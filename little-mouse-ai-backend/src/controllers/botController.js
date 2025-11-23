import {saveBotConfig} from "../services/botService.js";

/**
 * 保存机器人配置（新增或更新）。
 *
 * 从前端接收机器人配置表单 JSON，根据是否包含 `id` 来决定是创建新记录，还是更新已有记录。
 *
 * @async
 * @function saveBotConfig
 *
 * @example
 * // 前端请求示例：
 * POST /bot/save
 * {
 *   "id": "bot-001",
 *   "name": "客服助手",
 *   "appId": "APP-202401",
 *   "appSecret": "SECRET-58FJ2",
 *   "token": "TOKEN-91XZ3",
 *   "sandbox": true,
 *   "image": "/src/assets/images/little-mouse.png"
 * }
 */
export const saveConfig = async (req, res) => {
    try {
        const result = await saveBotConfig(req.body)

        res.json({
            success: true,
            data: result
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
