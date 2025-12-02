import {processWebhookEvent} from "../services/webhookService.js"

/**
 * 处理 QQ 机器人开放平台的 Webhook HTTP 请求。
 *
 *  - 从 HTTP 请求中解析 botId / headers / body
 *  - 调用业务层 processWebhookEvent() 进行：签名验证、op=13验证、事件分发
 *  - 根据不同返回类型（验证模式 / 普通事件）返回平台需要的响应格式
 *
 * 注意：
 *  - Webhook 验证模式（op=13）需要返回 { plain_token, signature }
 *  - 普通事件需要返回 ACK：{ code: 0, message: "ok" }
 *  - 签名失败必须返回 401，符合 QQ 平台规范
 *
 * @async
 * @function processEvent
 *
 * @param {import("express").Request} req - Express HTTP 请求对象
 * @param {import("express").Response} res - Express HTTP 响应对象
 *
 * @returns {Promise<void>}
 *
 * @example
 * const result = await processWebhookEvent(botId, req.headers, req.body)
 * if (result.type === "validation") res.json(result.data)
 */
export async function processEvent(req, res) {
    const botId = req.params.botId

    try {
        const result = await processWebhookEvent(botId, req.headers, req.body)

        // Webhook 验证模式（op=13）
        if (result.type === "validation") {
            return res.json(result.data)
        }

        // 普通事件（必须回 ACK）
        return res.json({code: 0, message: "ok"})

    } catch (err) {
        console.error("Webhook 处理异常:", err)

        // 签名错误 → 必须返回 401
        if (err.message.includes("Invalid signature(签名无效)")) {
            return res.status(401).json({error: "Invalid signature(签名无效)"})
        }

        return res.status(500).json({error: err.message})
    }
}