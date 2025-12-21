import axios from "axios"
import fs from "fs/promises"
import path from "path"
import OpenAI from "openai"
import ModelConfig from "../models/modelConfigModel.js"
import ProcessConfig from "../models/processConfigModel.js"
import RequestLog from "../models/requestLogModel.js"


// 项目根路径下的 data 目录
const DATA_ROOT = path.resolve(process.cwd(), "data")

// AccessToken 内存缓存（appId → token）
const tokenCache = new Map()

// 模型客户端缓存（modelId → OpenAI client）
const modelClientCache = new Map()

// msg_id → { currentMsgSeq, expiresAtMs }
// 用于同一条被动消息（msg_id）多次回复时，保证 msg_seq 递增，避免“消息被去重”
const msgSeqCache = new Map()

/**
 * 保存流程配置（新增或更新）。
 *
 * 根据传入数据中的 `id` 字段判断是更新现有流程，
 * 还是在不存在时创建新流程。
 *
 * 函数返回更新后的流程配置文档。
 *
 * @example
 * // 保存流程（若 id 存在则更新，否则新增）
 * await saveProcessConfig({
 *   "id": "flow-001",
 *   "name": "猫娘对话流程",
 *   "enabled": true,
 *   "processType": "role",
 *   "preset": "catgirl",
 *   "botId": "bot-001",
 *   "modelId": "deepseek-chat",
 *   "model": "deepseek-chat",
 *   "roleDescription": "你是一只可爱的猫娘"
 * })
 */
export async function saveProcessConfig(data) {

    // 如果保存的流程种类是角色配置且填写了 botId 则一个机器人只能绑定一个角色配置的验证
    if (data.processType === "role" && data.botId) {

        // 查询条件：同一个 bot 下的角色流程
        const query = {botId: data.botId, processType: "role"}

        // 如果是编辑流程，则排除当前这条记录
        if (data.id) {
            query.id = {$ne: data.id}
        }

        // 查找是否已存在角色流程
        const existing = await ProcessConfig.findOne(query)

        if (existing) {
            throw new Error("该机器人已绑定角色对话流程，不能重复绑定")
        }
    }

    const filter = {id: data.id}

    // new: true 返回更新后的文档
    // upsert: true 若未找到则插入新文档
    const options = {new: true, upsert: true}

    return ProcessConfig.findOneAndUpdate(filter, data, options)
}

/**
 * 获取所有流程配置。
 *
 * 返回数据库中全部流程配置文档数组。
 *
 * @example
 * const list = await getProcessConfigList()
 * // 返回示例：
 * [
 *   {
 *     id: "flow-001",
 *     name: "猫娘对话流程",
 *     processType: "role",
 *     ...
 *   },
 *   {
 *     id: "flow-002",
 *     name: "战绩查询流程",
 *     processType: "function",
 *     ...
 *   }
 * ]
 */
export async function getProcessConfigList() {
    return ProcessConfig.find()
}

/**
 * 根据 id 删除流程配置。
 *
 * 返回一个包含 deletedCount 的对象，用于指示删除数量。
 *
 * @example
 * await deleteProcessConfigById("flow-001")
 * // 返回示例：{ deletedCount: 1 }
 */
export async function deleteProcessConfigById(id) {
    const filter = {id}
    return ProcessConfig.deleteOne(filter)
}

/**
 * 获取 roles 目录下所有 txt 模板名（不含 .txt 后缀）
 * @example
 * const list = await getRoleTxtList()
 * // 返回示例：["catgirl", "assistant"]
 */
export async function getRoleTxtList() {
    const rolesDir = path.join(DATA_ROOT, "roles")

    const files = await fs.readdir(rolesDir, {withFileTypes: true})

    return files
        .filter(item => item.isFile() && item.name.endsWith(".txt"))
        .map(item => item.name.replace(/\.txt$/, ""))
}

/**
 * 获取 functions 目录下所有 JavaScript 文件
 * @example
 * const list = await getFunctionJsList()
 * // 返回示例：["help.js", "clear.js"]
 */
export async function getFunctionJsList() {
    const functionsDir = path.join(DATA_ROOT, "functions")

    const files = await fs.readdir(functionsDir, {withFileTypes: true})

    return files
        .filter(item => item.isFile() && item.name.endsWith(".js"))
        .map(item => item.name)
}

/**
 * 根据 modelId 获取该模型配置下的模型列表。
 *
 * 逻辑：
 *   - 查询 ModelConfig 得到 apiKey / baseUrl
 *   - 创建 OpenAI 客户端
 *   - client.models.list()
 *
 * @param {string} modelId
 *
 * @returns {Promise<Array<{id:string, owned_by:string}>>}
 */
export async function getModelsByModelId(modelId) {
    // 读取模型配置
    const cfg = await ModelConfig.findOne({id: modelId});
    if (!cfg) throw new Error(`未找到 ModelConfig: ${modelId}`);

    try {
        const client = new OpenAI({
            baseURL: cfg.baseUrl, apiKey: cfg.apiKey
        });

        // SDK 获取模型列表
        const res = await client.models.list();

        return res.data.map(m => ({
            id: m.id
        }));
    } catch (err) {
        console.error(`获取模型列表失败（modelId=${modelId}）:`, err.message);
        return [];
    }
}

/**
 * 处理 QQ 群聊中 @ 机器人的消息事件。
 *
 * 此函数为 Webhook 消息处理入口，用于根据用户输入判断执行流程类型：
 * - 若输入以 "/" 开头，视为命令。
 * - 若输入不以以 "/" 开头，视为发送给大模型的普通消息。
 *
 * 执行顺序：
 *   1. 从数据库中读取当前 botId 对应的所有启用流程。
 *   2. 根据命令与否，选择执行功能模板或角色模板。
 *   3. 每个流程的输出内容都会单独发送一条消息到群聊。
 *
 * @param {Object} botConfig - 机器人自身配置（含 appId 与密钥）
 * @param {Object} event - QQ Webhook 事件体（包含消息、用户、群信息）
 * @returns {Promise<void>} - 处理完成，不返回实际数据
 */
export async function handleProcessEvent(botConfig, event) {

    // 获取事件中的消息
    const d = event?.d ?? {}

    // 获取消息中用户真正发出的文本
    const rawContent = typeof d.content === "string" ? d.content : ""
    // 消息去除首尾空格
    const text = rawContent.trim()

    // 获取发送消息的 QQ 群的 OpenId
    const groupOpenId = d.group_openid
    // 获取发送消息的 OpenId
    const replyToMsgId = d.id

    if (!text || !groupOpenId) {
        console.log("handleProcessEvent: 无有效消息内容或 group_openid，跳过")
        return
    }

    // 如果消息以 “/” 开头，则获取 命令（command）+ 参数（args），否则 命令（command）为空，消息全部放入 参数（args）
    const {command, args} = parseCommandAndArgs(text)
    const botId = botConfig.id
    // 查找收到和消息的机器人绑定的所有流程
    const {functionProcesses, roleProcesses} = await findAllProcessesForBot(botId)

    // 若是命令，只执行功能模板
    if (command) {
        for (const funcCfg of functionProcesses) {
            try {

                const result = await runFunction(funcCfg, command, args)

                if (result && result.trim()) {
                    await sendGroupTextMessage(botConfig, groupOpenId, result.trim(), replyToMsgId)
                }
            } catch (err) {
                console.error("功能模板执行出错:", funcCfg.id, funcCfg.name, err)
            }
        }
        return
    }

    // 非命令，执行角色模板
    for (const roleCfg of roleProcesses) {
        try {

            const result = await playRole(roleCfg, text)

            if (result && result.trim()) {
                await sendGroupTextMessage(botConfig, groupOpenId, result.trim(), replyToMsgId)
            }
        } catch (err) {
            console.error("角色模板执行出错:", roleCfg.id, roleCfg.name, err)
        }
    }
}

/**
 * 根据用户输入解析命令格式。
 *
 * 解析规则：
 *   - 以 "/" 开头的文本为命令，命令部分为第一个词，其余部分视为参数。
 *   - 若不以 "/" 开头，则视为普通消息，命令为空字符串，参数为原始文本。
 *
 * @param {string} text - 用户原始输入文本
 * @returns {{command: string, args: string}} - 解析后的命令与参数对象
 */
function parseCommandAndArgs(text) {
    const trimmed = text.trim()
    if (!trimmed.startsWith("/")) {
        return {command: "", args: trimmed}
    }
    const parts = trimmed.split(/\s+/)
    return {
        command: parts[0], args: parts.slice(1).join(" ")
    }
}

/**
 * 获取指定机器人下所有启用的流程，并按照类型分类。
 *
 * 分类规则：
 *   - processType === "function" → 放入 functionProcesses。
 *   - processType === "role"     → 放入 roleProcesses。
 *
 * @param {string} botId - 当前机器人对应的 botId
 * @returns {Promise<{functionFlows: ProcessConfig[], roleFlows: ProcessConfig[]}>} - 按模板类型分组的流程
 */
async function findAllProcessesForBot(botId) {
    const all = await ProcessConfig.find({botId, enabled: true})

    return {
        functionProcesses: all.filter(f => f.processType === "function"),
        roleProcesses: all.filter(f => f.processType === "role")
    }
}

/**
 * 执行功能流程。
 *
 * 模板文件路径：
 *   - data/functions/<file>.js
 *
 * 逻辑说明：
 *   1. 根据用户输入的命令（parsed.command）匹配流程中的 functions[]。
 *   2. 找到 command 对应的 function 配置项。
 *   3. 动态加载对应 JS 文件并执行 export default 函数。
 *   4. 将 command / args 传入模板函数。
 *
 * @param {ProcessConfig} processConfig - 当前流程配置（含 functions[]）
 * @param {string} command - 命令
 * @param {string} args - 命令参数
 * @returns {Promise<string>} - 执行功能模板后的输出
 */
async function runFunction(processConfig, command, args) {

    // 当前流程中的所有功能项
    const funcList = processConfig.functions || [];

    // 根据 command 匹配用户触发的功能
    const funcItem = funcList.find(f => f.command === command);

    // 若未找到对应的功能，返回空字符串
    if (!funcItem) {
        console.warn(`未找到命令对应的功能：${command} in process ${processConfig.id}`);
        return "";
    }

    // 模板文件路径：data/functions/<file>.js
    const filePath = path.join(DATA_ROOT, "functions", `${funcItem.file}`);

    try {
        // 以 file:// URL 动态 import
        const module = await import(filePathToImportPath(filePath));

        const fn = module.default;

        // 每个模板必须 export default 一个函数
        if (typeof fn === "function") {

            const result = await fn(processConfig, args);

            return typeof result === "string" ? result : JSON.stringify(result);
        }

        console.warn(`文件 ${funcItem.file}.js 未导出默认函数`);
    } catch (err) {
        console.warn(`加载功能模板失败：${filePath}`, err.message);
    }

    return "";
}

/**
 * 将角色模板文本解析为多段对话消息。
 *
 * 支持以下格式：
 *   - system: 预设...
 *   - user: 用户回复...
 *   - assistant: 大模型回复...
 *
 * @param {string} text - 原始角色模板文件内容
 * @returns {Array<{role:string, content:string}>} - 拆分后的消息数组
 */
function parseRoleMessages(text) {
    // 检查是否为空白文本
    if (!text.trim()) return []

    // 把文本拆分成一行一行的数组
    const lines = text.split(/\r?\n/)

    const messages = []

    // 当前角色(system/user/assistant)
    let currentRole = null
    // 临时存储当前角色的对话
    let buffer = []

    // 写入一段角色的对话（如果有内容）
    const push = () => {
        if (currentRole && buffer.length > 0) {
            messages.push({
                role: currentRole, content: buffer.join("\n").trim()
            })
        }
        buffer = []
    }

    for (const line of lines) {

        // 如果为空行代表当前角色的对话完了，使用 push() 写入一段角色的对话
        if (!line.trim()) {
            push()
            // 空行后清空 currentRole，为下一段角色做准备
            currentRole = null
            continue
        }

        // 获取当前对话的角色
        const roleMatch = line.match(/^(system|user|assistant)\s*:(.*)$/)

        if (roleMatch) {
            // 保险起见，遇到新的角色依旧会推入上一段
            push()

            // 角色名原样使用（不转大小写）
            currentRole = roleMatch[1]

            // 写入第一行内容
            buffer.push(roleMatch[2].trim())
        } else {
            // 普通文本直接加入当前段
            buffer.push(line)
        }
    }
    // 文件末尾补一次 push()
    push()

    return messages
}

/**
 * 从 RequestLog 中加载最近 N 条对话作为上下文
 *
 * @param {string} processId
 * @param {number} maxMessages 默认 20
 * @returns {Promise<Array<{role:string, content:string}>>}
 */
async function loadConversationHistoryFromDB(processId, maxMessages = 20) {

    // 一条记录 = 一轮（user + assistant）
    // 所以最多取 maxMessages / 2 条记录
    const maxRounds = Math.ceil(maxMessages / 2)

    const logs = await RequestLog.find({
        processId, status: "success"
    })
        .sort({requestAt: -1})
        .limit(maxRounds)
        .lean()

    const messages = []

    // 倒序恢复时间顺序
    for (const log of logs.reverse()) {

        const reqMsgs = log.request?.messages ?? []
        for (const m of reqMsgs) {
            if (m.role === "user" || m.role === "assistant") {
                messages.push({
                    role: m.role, content: m.content
                })
            }
        }

        const assistantMsg = log.response?.choices?.[0]?.message

        if (assistantMsg?.content) {
            messages.push({
                role: "assistant", content: assistantMsg.content
            })
        }
    }

    // 最终再裁剪一次，确保不超过 maxMessages
    return messages.slice(-maxMessages)
}

/**
 * 执行角色流程。
 *
 * 流程说明：
 *   - 读取角色模板内容作为预设消息（system/user/assistant）。
 *   - 把用户本次输入作为最终 user 消息加入对话。
 *   - 调用模型生成回复。
 *
 * @param {ProcessConfig} processConfig - 当前角色模板对应的流程配置
 * @param {string} userMessage - 用户当前输入的文本内容
 *
 * @returns {Promise<string>} - 大模型生成的回复文本
 */
async function playRole(processConfig, userMessage) {

    // 使用用 processId 作为对话记忆 key
    const memoryKey = processConfig.id

    // 读取历史对话，最多 MAX_CONVERSATION_MESSAGES（默认 20） 条
    const historyMessages = await loadConversationHistoryFromDB(processConfig.id)

    // 加载角色预设
    const roleMessages = await loadRolePrompt(processConfig)

    // 获取 OpenSDK 创建的模型实例
    const llm = await getModelClient(processConfig.modelId)

    const messages = []

    if (roleMessages.length > 0) {
        messages.push(...roleMessages)
    }

    // 插入历史对话（user / assistant）
    if (historyMessages.length > 0) {
        messages.push(...historyMessages)
    }

    // 插入当前用户的对话
    messages.push({
        role: "user", content: userMessage
    })

    // 记录请求开始的时间
    const requestAt = new Date()
    // 请求记录
    let requestLog
    // 请求回复
    let response
    // 消耗 Token
    let tokens = 0

    try {
        // 请求前：创建请求记录（status: "pending"）
        requestLog = await RequestLog.create({
            modelId: processConfig.modelId, processId: processConfig.id, botId: processConfig.botId,

            status: "pending",

            request: {
                model: processConfig.model, messages
            },

            tokens: 0, requestAt
        })

        // 调用大模型
        const res = await llm.chat.completions.create({
            model: processConfig.model, messages
        })

        const assistantReply = res.choices?.[0]?.message?.content || ""

        // 更新请求成功记录
        await RequestLog.updateOne({_id: requestLog._id}, {
            status: "success", response: res, tokens: res.usage?.total_tokens ?? 0, responseAt: new Date()
        })

        return assistantReply

    } catch (err) {

        // 更新请求失败记录
        if (requestLog) {
            await RequestLog.updateOne({_id: requestLog._id}, {
                status: "error", response: {
                    message: err.message
                }, responseAt: new Date()
            })
        }

        throw err
    }
}


/**
 * 加载角色模板内容并解析为 messages 数组。
 *
 * 来源优先级：
 *   1. 自定义角色（roleDescription）
 *   2. 文件模板 data/roles/<data>.txt
 *   3. 文件读取失败时回退到 roleDescription
 *
 * @param {ProcessConfig} processConfig - 流程配置
 *
 * @returns {Promise<Array<{role:string,content:string}>>} - 处理后的角色消息数组
 */
async function loadRolePrompt(processConfig) {

    // 获取角色模板种类
    const tpl = processConfig.preset

    // 如果为自定义模板
    if (!tpl || tpl === "custom") {
        return processConfig.roleDescription ? [{role: "system", content: processConfig.roleDescription}] : []
    }

    // 角色模板路径
    const filePath = path.join(DATA_ROOT, "roles", `${tpl}.txt`)

    try {
        const fileContent = await fs.readFile(filePath, "utf8")
        const trimmed = fileContent.trim()
        if (trimmed) {
            return parseRoleMessages(trimmed)
        }
    } catch (err) {
        console.warn(`读取角色模板文件失败：${filePath}`, err.message)
    }

    return processConfig.roleDescription ? [{role: "system", content: processConfig.roleDescription}] : []
}

/**
 * 根据 modelId 创建或复用大模型客户端。
 *
 * 使用 ModelConfig 表中的：
 *   - apiKey
 *   - baseUrl
 *
 * @param {string} modelId - 当前流程配置中绑定的模型 ID
 * @returns {Promise<OpenAI>} - 可直接用于 completions/chat 的模型客户端实例
 */
async function getModelClient(modelId) {
    if (!modelId) throw new Error("流程配置缺少 modelId")

    const cached = modelClientCache.get(modelId)
    if (cached) return cached

    const modelConfig = await ModelConfig.findOne({id: modelId})
    if (!modelConfig) throw new Error(`未找到 ModelConfig: ${modelId}`)

    const client = new OpenAI({
        apiKey: modelConfig.apiKey, baseURL: modelConfig.baseUrl
    })

    modelClientCache.set(modelId, client)
    return client
}

/**
 * 获取同一个 msg_id 的下一个 msg_seq（自增序号）。
 *
 * QQ 群聊被动回复通常要求：
 * - 同一个 msg_id 可以回复多次，但需要携带 msg_seq 且递增
 * - 被动回复存在时间窗口（例如 5 分钟），过期后应重置序号
 * - 被动回复次数限制 5 次
 *
 * @param {string} replyToMsgId - QQ 事件里的 msg_id（你代码里的 replyToMsgId）
 * @param {number} [ttlMs=300000] - 缓存有效期毫秒数，默认 5 分钟
 * @param {number} [maxSeq=5] - 最大允许的 msg_seq 默认 5
 *
 * @returns {number|null} - 下一个 msg_seq；如果超过 maxSeq，返回 null（表示不要再回复了）
 */
function nextMsgSeq(replyToMsgId, ttlMs = 5 * 60 * 1000, maxSeq = 5) {
    const nowMs = Date.now()

    const cached = msgSeqCache.get(replyToMsgId)

    // 未命中缓存 or 已过期：从 1 开始
    if (!cached || cached.expiresAtMs <= nowMs) {
        msgSeqCache.set(replyToMsgId, {
            currentMsgSeq: 1, expiresAtMs: nowMs + ttlMs
        })
        return 1
    }

    const nextSeq = cached.currentMsgSeq + 1

    // 超过上限：返回 null，让调用方决定是否跳过发送
    if (nextSeq > maxSeq) {
        return null
    }

    cached.currentMsgSeq = nextSeq
    cached.expiresAtMs = nowMs + ttlMs

    return nextSeq
}

/**
 * 发送 QQ 群文本消息（仅支持被动消息）。
 *
 * 被动消息要求：
 *   - 必须携带 msg_id（用于回复用户消息）
 *   - 没有 msg_id 则跳过发送（不支持主动消息）
 *
 * @param {BotConfig} botConfig - 当前机器人配置（包含 appId 与密钥）
 * @param {string} groupOpenId - QQ 群 openid，用于制定发送目标
 * @param {string} content - 要发送的文本内容
 * @param {string} replyToMsgId - 用户触发消息的 msg_id，用于被动回复
 * @returns {Promise<Object|void>} - 发送成功返回响应体，缺少 msg_id 则返回 void
 */
async function sendGroupTextMessage(botConfig, groupOpenId, content, replyToMsgId) {
    // 必须有 msg_id（被动消息）
    if (!replyToMsgId) {
        console.warn("未提供 msg_id，系统仅支持被动消息，跳过发送。")
        return
    }

    // 如果消息回复次数达到上限
    const msgSeq = nextMsgSeq(replyToMsgId)
    if (msgSeq == null) {
        console.warn("同一 msg_id 回复次数已达上限，跳过发送：", replyToMsgId)
        return
    }

    const accessToken = await getAccessToken(botConfig)

    const url = `https://mouse.kielx.cn/qq-api/v2/groups/${groupOpenId}/messages`

    const body = {
        content, msg_type: 0, msg_id: replyToMsgId, msg_seq: msgSeq
    }

    const res = await axios.post(url, body, {
        headers: {
            "Content-Type": "application/json", Authorization: `QQBot ${accessToken}`, "X-QQ-Client-ID": botConfig.appId
        }
    })

    return res.data
}

/**
 * 获取 QQ Bot AccessToken。
 *
 * Token 缓存：
 *   - Token 有效期内会保持缓存。
 *   - 若接近过期（提前 60 秒），则自动刷新。
 *
 * @param {BotConfig} botConfig - 当前机器人配置（含 appId 与 appSecret）
 * @returns {Promise<string>} - 可直接用于 Authorization 的 access_token
 */
async function getAccessToken(botConfig) {
    const cacheKey = botConfig.appId
    const now = Date.now()
    const cached = tokenCache.get(cacheKey)

    if (cached && cached.expiresAt > now + 60000) {
        return cached.token
    }

    const res = await axios.post("https://bots.qq.com/app/getAppAccessToken", {
        appId: botConfig.appId, clientSecret: botConfig.appSecret
    })

    const token = res.data.access_token
    const expiresIn = res.data.expires_in

    tokenCache.set(cacheKey, {
        token, expiresAt: now + expiresIn * 1000
    })

    return token
}

/**
 * 将本地路径转换为动态 import() 可用的 file:// URL。
 *
 * @param {string} filePath - 本地文件路径
 * @returns {string} - 适用于 import() 的 file:// 绝对路径 URL
 */
function filePathToImportPath(filePath) {
    const abs = path.resolve(filePath)
    return new URL(`file://${abs}`).href
}
