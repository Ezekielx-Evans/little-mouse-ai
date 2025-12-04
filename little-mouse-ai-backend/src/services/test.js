import axios from "axios"
import vm from "vm"
import fs from "fs/promises"
import path from "path"
import OpenAI from "openai"

import BotConfig from "../models/botConfigModel.js"
import ModelConfig from "../models/modelConfigModel.js"
import ProcessConfig from "../models/processConfigModel.js"

// 获取项目根目录的 template 目录路径：
// 项目结构：/src 和 /template 同级，所以从 process.cwd() 指向项目根，再拼 template
const TEMPLATE_ROOT = path.resolve(process.cwd(), "template")

/**
 * 缓存 QQ 机器人 AccessToken：
 *
 * key: appId
 *
 * value: { token: string, expiresAt: number }
 */
const tokenCache = new Map()

/**
 * 缓存大模型客户端（OpenAI SDK 实例）：
 *
 * key: modelId
 *
 * value: OpenAI client
 */
const modelClientCache = new Map()

/**
 * 处理 QQ 群聊 @ 机器人事件入口。
 *
 * 现在的规则：
 *  - 不再用命令做流程过滤，只根据 botId + enabled = true 取出所有流程
 *  - functionTemplate：可以有多个 → 逐个执行，每个结果发一条消息
 *  - roleTemplate：也可以有多个 → 逐个执行，每个结果发一条消息
 *
 * @example
 * case "GROUP_AT_MESSAGE_CREATE":
 *    await handleProcessEvent(botConfig, event);
 *    break;
 *
 * @param {Object} botConfig - 当前机器人配置（来自 BotConfig）
 * @param {Object} event - Webhook 事件 body
 *
 * @returns {Promise<void>}
 */
export async function handleProcessEvent(botConfig, event) {

    // 事件内容
    const d = event?.d ?? {}

    // 用户真正发送来的消息
    const rawContent = typeof d.content === "string" ? d.content : ""
    const text = rawContent.trim()

    const groupOpenId = d.group_openid
    const replyToMsgId = d.id

    if (!text || !groupOpenId) {
        console.log("handleProcessEvent: 无有效消息内容或 group_openid，跳过")
        return
    }

    // 解析消息为命令还是普通聊天内容
    const {command, args} = parseCommandAndArgs(text)
    const botId = botConfig.id

    // 查出启用的所有流程
    const {functionFlows, roleFlows} = await findAllProcessesForBot(botId)

    // 如果是命令：只执行 functionTemplate
    if (command) {
        for (const funcCfg of functionFlows) {
            try {
                const result = await runFunctionTemplate(funcCfg, text, event, {command, args})
                if (result && result.trim()) {
                    await sendGroupTextMessage(botConfig, groupOpenId, result.trim(), replyToMsgId)
                }
            } catch (err) {
                console.error("功能模板执行出错:", funcCfg.id, funcCfg.name, err)
            }
        }
        return
    }

    // 若不是命令：执行角色模板
    for (const roleCfg of roleFlows) {
        try {
            const result = await runRoleTemplate(roleCfg, text)
            if (result && result.trim()) {
                await sendGroupTextMessage(botConfig, groupOpenId, result.trim(), replyToMsgId)
            }
        } catch (err) {
            console.error("角色模板执行出错:", roleCfg.id, roleCfg.name, err)
        }
    }
}

/**
 * 提取命令与参数
 *
 * 解析消息为命令还是普通聊天内容，例如：
 *    - "/战绩查询 放过善良小鼠鼠" -> { command: "/战绩查询", args: "放过善良小鼠鼠" }
 *    - "普通聊天内容"          -> { command: "", args: "普通聊天内容" }
 */
function parseCommandAndArgs(text) {
    const trimmed = text.trim()
    if (!trimmed.startsWith("/")) {
        return {command: "", args: trimmed}
    }
    const parts = trimmed.split(/\s+/)
    return {
        command: parts[0],
        args: parts.slice(1).join(" ")
    }
}

/**
 * 获取指定机器人下所有启用的流程，并按类型分组。
 *
 * - functionTemplate：放入 functionFlows
 * - roleTemplate：放入 roleFlows
 *
 * @param {string} botId - 机器人 ID（ProcessConfig.botId）
 */
async function findAllProcessesForBot(botId) {
    const all = await ProcessConfig.find({ botId, enabled: true })

    const functionFlows = all.filter(item => item.templateType === "functionTemplate")
    const roleFlows = all.filter(item => item.templateType === "roleTemplate")

    return { functionFlows, roleFlows }
}


/**
 * 将角色模板文本解析成多条可用于 ChatGPT/DeepSeek 的对话消息。
 *
 * 角色模板允许开发者写成以下格式：
 * ```
 *   system: 你是一个猫娘...
 *   user: 进入设定模式
 *   assistant: 正在设定特征
 *   user: 现在你将模仿一只猫娘...
 * ```
 *
 * 每个以 “system: / user: / assistant:” 开头的行内容会被记录。
 *
 * 解析结果格式和 OpenAI/DeepSeek 的 API 兼容：
 * ```
 *   [
 *      { role: "system", content: "..." },
 *      { role: "user", content: "..." },
 *      { role: "assistant", content: "..." }
 *   ]
 * ```
 *
 * @param {string} text - 完整的角色模板原始文本
 */
function parseRoleMessages(text) {
    if (!text.trim()) return []

    // 按行拆分，兼容 Windows/Mac/Linux 换行符
    const lines = text.split(/\r?\n/)

    const messages = []
    // 当前段落属于哪个角色（system/user/assistant）
    let currentRole = null
    // 当前段落的内容收集区（可能多行）
    let buffer = []

    // 将当前 buffer 推入 messages（如果有内容）,并清空 buffer。
    const push = () => {
        if (currentRole && buffer.length > 0) {
            messages.push({
                role: currentRole,
                content: buffer.join("\n").trim()
            })
        }
        buffer = []
    }

    // 遍历每一行
    for (const line of lines) {

        // 匹配格式：system: xxx / user: xxx / assistant: xxx
        const m = line.match(/^(system|user|assistant)\s*:(.*)$/i)

        if (m) {
            // 遇到新的角色段落，
            // 先把旧段落推入 messages
            push()

            // 设置当前角色
            currentRole = m[1].toLowerCase()

            // 把冒号后面的文字加入 buffer
            buffer.push(m[2].trim())
        } else {
            // 非角色行，继续附加到当前 buffer（支持换行、多行文本）
            buffer.push(line)
        }
    }

    // 推入最后一段
    push()

    return messages
}

/**
 * 执行角色模板流程
 *
 * 工作流程：
 *   1. 使用 loadRolePrompt(processConfig) 读取角色模板内容（解析为 message 数组）
 *   2. 如果角色模板为空，表示该流程不参与角色对话 → 直接跳过
 *   3. 调用大模型（DeepSeek / OpenAI）执行对话
 *   4. 返回 AI 回复文本
 *
 * @param {ProcessConfig} processConfig - 流程配置（包含模型、模板、角色内容等）
 * @param {string} userMessage          - 用户消息（通常为命令后的参数或完整文本）
 * @returns {Promise<string>}           - 模型生成的文本回复
 */
async function runRoleTemplate(processConfig, userMessage) {
    // 加载角色模板（可能包含 system/user/assistant 多条消息）
    const roleMessages = await loadRolePrompt(processConfig)

    // 模板内容为空：该流程不参与角色回复
    if (!roleMessages || roleMessages.length === 0) return ""

    // 获取指定模型的客户端（从 ModelConfig 获取 baseUrl + apiKey）
    const llm = await getModelClient(processConfig.modelId)

    // 构建完整对话：
    //   角色模板中的多条消息（完整上下文）
    //   当前用户发来的真实消息
    const messages = [
        ...roleMessages,
        { role: "user", content: userMessage }
    ]

    // 请求大模型生成回复
    const res = await llm.chat.completions.create({
        model: processConfig.modelId,
        messages
    })

    // 取 AI 文本内容
    let content = res.choices?.[0]?.message?.content || ""

    return content || "（模型未返回任何内容）"
}


/**
 * 根据流程配置加载角色描述文本。
 * 新增：支持 system/user/assistant 多段解析。
 */
async function loadRolePrompt(processConfig) {
    const tpl = processConfig.template

    // 自定义角色模板
    if (!tpl || tpl === "role-custom") {
        if (!processConfig.role) return []
        return [{ role: "system", content: processConfig.role }]
    }

    // 文件模板
    const filePath = path.join(TEMPLATE_ROOT, "roles", `${tpl}.txt`)

    try {
        const fileContent = await fs.readFile(filePath, "utf8")
        const trimmed = fileContent.trim()
        if (trimmed) {
            return parseRoleMessages(trimmed)
        }
    } catch (err) {
        console.warn(`读取角色模板文件失败：${filePath}`, err.message)
    }

    // 回退
    if (processConfig.role) {
        return [{ role: "system", content: processConfig.role }]
    }

    return []
}

/**
 * 执行功能模板流程（functionTemplate）
 */
async function runFunctionTemplate(processConfig, message, event, ctx) {
    const {command, args} = ctx

    if (processConfig.template === "function-custom") {
        return await runCustomFunction(processConfig, message, event, command, args)
    }

    const tpl = processConfig.template
    const filePath = path.join(TEMPLATE_ROOT, "functions", `${tpl}.js`)

    try {
        const module = await import(filePathToImportPath(filePath))
        const fn = module.run || module.default

        if (typeof fn === "function") {
            const result = await fn({
                message,
                command,
                args,
                event,
                config: processConfig
            })
            return typeof result === "string" ? result : JSON.stringify(result)
        }
    } catch (err) {
        console.warn(`加载功能模板失败: ${filePath}`, err.message)
    }

    return ""
}

/**
 * 执行自定义功能代码
 */
async function runCustomFunction(processConfig, message, event, command, args) {
    const code = processConfig.codeInjection
    if (!code || !code.trim()) return ""

    const sandbox = {
        input: message,
        command,
        args,
        event,
        config: processConfig,
        output: "",
        console: { log: () => {} }
    }

    const scriptText = `
        "use strict";
        ${code}
        if (typeof run === "function") {
            output = run(input, command, args, event, config);
        }
    `

    try {
        const script = new vm.Script(scriptText)
        const context = vm.createContext(sandbox)
        script.runInContext(context, {timeout: 200})
        return sandbox.output ? String(sandbox.output) : ""
    } catch (err) {
        console.error("自定义功能执行错误:", err)
        return ""
    }
}

/**
 * 从 ModelConfig 获取 LLM 客户端
 */
async function getModelClient(modelId) {
    if (!modelId) throw new Error("流程配置缺少 modelId")

    const cached = modelClientCache.get(modelId)
    if (cached) return cached

    const modelConfig = await ModelConfig.findOne({id: modelId})
    if (!modelConfig) throw new Error(`未找到 ModelConfig: ${modelId}`)

    const client = new OpenAI({
        apiKey: modelConfig.apiKey,
        baseURL: modelConfig.baseUrl
    })

    modelClientCache.set(modelId, client)
    return client
}

/**
 * 发送 QQ 文本消息
 */
async function sendGroupTextMessage(botConfig, groupOpenId, content, replyToMsgId) {
    const accessToken = await getAccessToken(botConfig)

    const url = `https://api.sgroup.qq.com/v2/groups/${groupOpenId}/messages`

    const body = {
        content,
        msg_type: 0
    }

    if (replyToMsgId) {
        body.msg_id = replyToMsgId
        body.msg_seq = 1
    }

    const res = await axios.post(url, body, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `QQBot ${accessToken}`,
            "X-QQ-Client-ID": botConfig.appId
        }
    })

    return res.data
}

/**
 * QQ 机器人 AccessToken（缓存）
 */
async function getAccessToken(botConfig) {
    const cacheKey = botConfig.appId
    const now = Date.now()
    const cached = tokenCache.get(cacheKey)

    if (cached && cached.expiresAt > now + 60000) {
        return cached.token
    }

    const res = await axios.post("https://bots.qq.com/app/getAppAccessToken", {
        appId: botConfig.appId,
        clientSecret: botConfig.appSecret
    })

    const token = res.data.access_token
    const expiresIn = res.data.expires_in

    tokenCache.set(cacheKey, {
        token,
        expiresAt: now + expiresIn * 1000
    })

    return token
}

/**
 * 本地路径转 import 兼容路径
 */
function filePathToImportPath(filePath) {
    const abs = path.resolve(filePath)
    return new URL(`file://${abs}`).href
}
