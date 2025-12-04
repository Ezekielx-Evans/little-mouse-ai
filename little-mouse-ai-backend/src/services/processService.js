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
    // 加载角色模板消息（可能是多条 system/user/assistant，也可能为空）
    const roleMessages = await loadRolePrompt(processConfig)

    // 获取对应模型客户端（OpenAI SDK，支持 DeepSeek）
    const llm = await getModelClient(processConfig.modelId)

    // 构造对话消息：
    //  - 如果有角色预设：先放入预设消息
    //  - 如果没有预设：直接只放当前用户消息
    const messages = []

    if (Array.isArray(roleMessages) && roleMessages.length > 0) {
        messages.push(...roleMessages)
    }

    // 当前用户的真实输入
    messages.push({
        role: "user",
        content: userMessage
    })

    // 调用 Chat Completion 接口
    const res = await llm.chat.completions.create({
        model: processConfig.modelId, // deepseek-chat / deepseek-reasoner / 其他
        messages
    })

    let content = res.choices?.[0]?.message?.content || ""

    return content || "（模型未返回任何内容）"
}


/**
 * 根据流程配置加载角色设定消息。
 *
 * 返回内容为 ChatGPT/DeepSeek 接受的 messages 数组，例如：
 * ```
 *   [
 *      { role: "system", content: "xxx" },
 *      { role: "user", content: "..." },
 *      { role: "assistant", content: "..." }
 *   ]
 * ```
 *
 * 支持三种来源：
 * 1. template === "role-custom"
 *      使用数据库中 processConfig.role（作为 system 消息）
 *
 * 2. 预设模板（template/roles/*.txt）
 *      文件内容会自动解析成多条 system/user/assistant 消息
 *
 * 3. 文件读取失败时回退：
 *      - 若 processConfig.role 有内容 → 使用其构造 system 消息
 *      - 否则返回空数组（表示没有预设）
 *
 * @param {ProcessConfig} processConfig - 流程配置
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

    // 回退：使用数据库中的 role 字段
    if (processConfig.role) {
        return [{ role: "system", content: processConfig.role }]
    }

    return []
}

/**
 * 执行功能模板流程
 *
 * 功能逻辑：
 * 1. 自定义功能（function-custom）
 *      - 直接执行 codeInjection（vm 沙盒）
 *
 * 2. 预设功能模板
 *      - 加载 template/functions/<template>.js
 *      - 调用模块的 run(context)
 *
 * 返回值规则：
 *  - 字符串：直接作为消息返回
 *  - 对象：自动 JSON.stringify
 *  - 空值：表示无需发送消息
 *
 * @param {ProcessConfig} processConfig
 * @param {string} message
 * @param {Object} event
 * @param {{command: string, args: string}} ctx
 * @returns {Promise<string>}
 */
async function runFunctionTemplate(processConfig, message, event, ctx) {
    const {command, args} = ctx

    // 自定义功能
    if (processConfig.template === "function-custom") {
        return await runCustomFunction(processConfig, message, event, command, args)
    }

    // 预设功能
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
 * 执行后台配置中的自定义功能代码（function-custom）。
 *
 * codeInjection 应定义 run() 函数，例如：
 *   function run(input, command, args, event, config) {
 *       return "xxx"
 *   }
 *
 * 代码执行逻辑：
 *  - 在 vm 沙盒环境执行，避免污染主程序
 *  - 禁用 console.log，避免刷日志
 *  - 限制执行时间，防止死循环卡死服务
 *
 * @param {ProcessConfig} processConfig
 * @param {string} message
 * @param {Object} event
 * @param {string} command
 * @param {string} args
 * @returns {Promise<string>}
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
 * 获取大模型客户端（OpenAI/DeepSeek）。
 *
 * 模型信息来自 ModelConfig：
 *  - id       → processConfig.modelId
 *  - apiKey   → 模型的密钥
 *  - baseUrl  → 模型接口地址（DeepSeek 也兼容）
 *
 * 采用缓存避免重复创建 OpenAI 对象。
 *
 * @param {string} modelId
 * @returns {Promise<OpenAI>}
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
 * 发送 QQ 群文本消息。
 *
 * 使用官方接口：
 *   POST /v2/groups/{group_openid}/messages
 *
 * 支持：
 *  - 纯文本消息（msg_type = 0）
 *  - 可选 replyToMsgId，用于“回复某条消息”
 *
 * @param {BotConfig} botConfig
 * @param {string} groupOpenId
 * @param {string} content
 * @param {string} [replyToMsgId]
 * @returns {Promise<Object>}
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
 * 获取 QQ Bot AccessToken。
 *
 * 使用缓存策略：
 *  - 以 appId 为 key
 *  - 记录 token 和过期时间
 *  - 在 token 即将过期前自动刷新
 *
 * 官方接口：
 *   POST https://bots.qq.com/app/getAppAccessToken
 *
 * @param {BotConfig} botConfig
 * @returns {Promise<string>}
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
 * 本地路径转为 ES Module 动态 import 可识别的 file:// 路径。
 *
 * 解决 Node ESM 中 import 绝对路径的问题。
 *
 * @param {string} filePath
 * @returns {string}
 */
function filePathToImportPath(filePath) {
    const abs = path.resolve(filePath)
    return new URL(`file://${abs}`).href
}
