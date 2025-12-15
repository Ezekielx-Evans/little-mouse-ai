import nacl from "tweetnacl"
import {decode as hexDecode} from "@stablelib/hex"
import BotConfig from "../models/botConfigModel.js"
import {handleProcessEvent} from "./processService.js";

/**
 * 处理与 QQ 机器人开放平台的 Webhook 通信。
 *
 *  - 根据 botId 查找机器人配置
 *  - 判断是否为初始化验证（op=13）
 *  - 验证回调签名（普通事件）
 *  - 分发事件（如 MESSAGE_CREATE / GROUP_AT_MESSAGE_CREATE）
 *
 * @param {string} botId - 路由中的机器人 ID，用于查找数据库对应配置
 * @param {Object} headers - HTTP 请求头，用于获取签名字段
 * @param {Object} body - QQ 发送的 Webhook Payload
 *
 * @returns {Promise<Object>} 返回格式：
 *  - { type: "validation", data: {...} }  → 回调验证模式
 *  - { type: "event" } → 普通事件
 */
export async function handelWebhookEvent(botId, headers, body) {

    // 查找机器人配置
    const botConfig = await BotConfig.findOne({id: botId})
    if (!botConfig) throw new Error("Bot not found")

    const botSecret = botConfig.appSecret

    // 判断是否为回调地址验证事件（op=13）
    if (body.op === 13) {
        return {
            type: "validation",
            data: genValidationResponse(botSecret, body)
        }
    }

    // 获取签名字段（普通事件必须校验）
    const signature = headers["x-signature-ed25519"]
    const timestamp = headers["x-signature-timestamp"]

    if (!signature || !timestamp) {
        throw new Error("Missing signature headers(签名头缺失)")
    }

    // 保持原始 body 字符串以供验签
    const rawBody = JSON.stringify(body)

    // 验证签名
    const valid = verifySignature(botSecret, timestamp, rawBody, signature)
    if (!valid) throw new Error("Invalid signature(签名无效)")

    // 分发普通事件
    await dispatchBotEvent(botConfig, body)

    return {type: "event"}
}

/**
 * 使用 Ed25519 验证 QQ Webhook 请求签名。
 *
 * @param {string} botSecret - 机器人密钥
 * @param {string} timestamp - 签名时间戳
 * @param {string} rawBody - 原始请求体字符串
 * @param {string} signatureHex - Header 中的十六进制签名
 * @returns {boolean} 是否通过验证
 */
function verifySignature(botSecret, timestamp, rawBody, signatureHex) {

    // 生成 32 字节 seed
    let seed = botSecret
    while (seed.length < 32) seed += seed
    const seedBytes = new TextEncoder().encode(seed.slice(0, 32))

    // 派生 Ed25519 公钥
    const publicKey = nacl.sign.keyPair.fromSeed(seedBytes).publicKey

    // hex → bytes
    const signature = hexDecode(signatureHex)

    // 拼接消息体：timestamp + rawBody
    const msg = new TextEncoder().encode(timestamp + rawBody)

    // 执行验签
    return nacl.sign.detached.verify(msg, signature, publicKey)
}

/**
 * 生成回调验证响应（op=13）。
 *
 * @param {string} botSecret - 机器人密钥
 * @param {Object} body - Webhook 请求体
 * @returns {{plain_token: string, signature: string}}
 */
function genValidationResponse(botSecret, body) {
    const {plain_token, event_ts} = body.d

    // 派生私钥（Ed25519 32 字节 seed）
    let seed = botSecret
    while (seed.length < 32) seed += seed
    const seedBytes = new TextEncoder().encode(seed.slice(0, 32))
    const keypair = nacl.sign.keyPair.fromSeed(seedBytes)

    // 签名内容：event_ts + plain_token
    const msg = new TextEncoder().encode(event_ts + plain_token)
    const signature = nacl.sign.detached(msg, keypair.secretKey)

    return {
        plain_token,
        signature: Buffer.from(signature).toString("hex")
    }
}

/**
 * 分发 QQ Webhook 事件。
 *
 * @param {Object} botConfig - 当前机器人配置
 * @param {Object} event - Webhook 事件对象
 */
async function dispatchBotEvent(botConfig, event) {
    const type = event.t

    switch (type) {
        case "GROUP_AT_MESSAGE_CREATE":
            console.log("群聊 @ 机器人:", event.d)
            await handleProcessEvent(botConfig, event)
            break

        default:
            console.log("未知事件类型:", type)
    }
}
