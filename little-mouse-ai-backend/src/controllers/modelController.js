import {deleteModelConfigById, getModelConfigList, saveModelConfig} from "../services/modelService.js";

/**
 * 保存大模型配置（新增或更新）。
 *
 * 从前端接收大模型配置表单 JSON，根据是否包含 `id` 来决定是创建新记录，
 * 还是更新已有记录。
 *
 * @example
 * // 前端请求示例：
 * POST /model/save
 * {
 *   "id": "model-001",
 *   "name": "DeepSeek Chat",
 *   "baseUrl": "https://api.deepseek.com/v1",
 *   "apiKey": "sk-15c040979d3e4b26abae62b09d3adfd5",
 *   "processId": "flow-001"
 * }
 */
export const saveConfig = async (req, res) => {
    try {
        const result = await saveModelConfig(req.body);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 获取所有大模型配置。
 *
 * 从数据库中读取全部大模型配置记录，并以数组形式返回。
 *
 * @example
 * // 前端请求示例：
 * GET /model/list
 *
 * // 返回示例：
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "_id": "6923106e69af27de21770111",
 *       "id": "deepseek-chat",
 *       "name": "DeepSeek Chat",
 *       "baseUrl": "https://api.deepseek.com/v1",
 *       "apiKey": "sk-15c040...",
 *       ...
 *     }
 *   ]
 * }
 */
export const getConfigList = async (req, res) => {
    try {
        const list = await getModelConfigList();

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
 * 删除大模型配置。
 *
 * 根据模型ID删除对应的配置记录。
 *
 * @example
 * // 前端请求示例：
 * DELETE /model/delete
 * {
 *   "id": "deepseek-chat"
 * }
 */
export const deleteConfig = async (req, res) => {
    try {
        const {id} = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "模型 ID 不能为空"
            });
        }

        const result = await deleteModelConfigById(id);

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "配置不存在"
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
