import {deleteBotConfigById, getBotConfigList, saveBotConfig} from "../services/botService.js";

/**
 * 保存机器人配置（新增或更新）。
 *
 * 从前端接收机器人配置表单 JSON，根据是否包含 `id` 来决定是创建新记录，还是更新已有记录。
 *
 * @async
 * @function saveConfig
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

/**
 * 获取所有机器人配置。
 *
 * 从数据库中读取全部机器人配置记录，并以数组形式返回。
 *
 * @async
 * @function getConfigList
 *
 * @example
 * // 前端请求示例：
 * GET /bot/list
 *
 * // 返回示例：
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "_id": "6923106e69af27de2177056a",
 *       "id": "bot-001",
 *       "name": "客服助手",
 *       "sandbox": true,
 *       ...
 *     },
 *     ...
 *   ]
 * }
 */
export const getConfigList = async (req, res) => {
    try {
        const list = await getBotConfigList();

        res.json({
            success: true,
            data: list
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 删除机器人配置。
 *
 * 根据机器人ID删除对应的配置记录。
 *
 * @async
 * @function deleteConfig
 *
 * @example
 * // 前端请求示例：
 * DELETE /bot/delete
 * {
 *   "id": "bot-001"
 * }
 */
export const deleteConfig = async (req, res) => {
    try {

        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: '机器人ID不能为空'
            });
        }

        const result = await deleteBotConfigById(id);

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: '配置不存在'
            });
        }

        res.json({
            success: true,
            data: {
                deletedId: id,
                deletedCount: result.deletedCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

