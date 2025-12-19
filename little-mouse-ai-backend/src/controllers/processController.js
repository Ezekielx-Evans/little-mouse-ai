import {
    deleteProcessConfigById, getFunctionJsList,
    getModelsByModelId,
    getProcessConfigList,
    getRoleTxtList,
    saveProcessConfig
} from "../services/processService.js"

/**
 * 保存流程配置（新增或更新）。
 *
 * 从前端接收流程配置 JSON，根据是否包含 `id` 来决定是创建新流程，
 * 还是更新已有流程记录。
 *
 * @example
 * // 前端请求示例：
 * POST /process/save
 * {
 *   "id": "flow-001",
 *   "name": "猫娘对话流程",
 *   "enabled": true,
 *   "templateType": "roleTemplate",
 *   "data": "catgirl",
 *   "botId": "bot-001",
 *   "modelId": "deepseek-chat",
 *   "triggerCommand": "",
 *   "role": "你是一只可爱的猫娘"
 * }
 */
export const saveConfig = async (req, res) => {
    try {
        const result = await saveProcessConfig(req.body)

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
 * 获取所有流程配置。
 *
 * 从数据库中读取全部流程配置记录，并以数组形式返回。
 *
 * @example
 * // 前端请求示例：
 * GET /process/list
 *
 * // 返回示例：
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "_id": "6923106e69af27de21770111",
 *       "id": "flow-001",
 *       "name": "猫娘对话流程",
 *       "templateType": "roleTemplate",
 *       "data": "catgirl",
 *       ...
 *     }
 *   ]
 * }
 */
export const getConfigList = async (req, res) => {
    try {
        const list = await getProcessConfigList()

        res.json({
            success: true,
            data: list
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

/**
 * 删除流程配置。
 *
 * 根据流程 ID 删除对应的配置记录。
 *
 * @example
 * // 前端请求示例：
 * DELETE /process/delete
 * {
 *   "id": "flow-001"
 * }
 */
export const deleteConfig = async (req, res) => {
    try {
        const {id} = req.body

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "流程 ID 不能为空"
            })
        }

        const result = await deleteProcessConfigById(id)

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "配置不存在"
            })
        }

        res.json({
            success: true,
            data: {
                deletedId: id,
                deletedCount: result.deletedCount
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

/**
 * 根据模型配置 ID 获取该模型下可用的模型列表。
 *
 * 前端传入 modelId（对应 ModelConfig.id），
 * 后端会读取模型配置并调用模型服务获取可用模型。
 *
 * @example
 * // 前端请求示例：
 * GET /process/models/deepseek-chat
 *
 * // 返回示例：
 * {
 *   "success": true,
 *   "data": [
 *     { "id": "deepseek-chat" },
 *     { "id": "deepseek-reasoner" }
 *   ]
 * }
 */
export const getModels = async (req, res) => {
    try {
        const modelId = req.params.modelId;

        if (!modelId) {
            return res.status(400).json({
                success: false,
                message: "modelId 不能为空"
            });
        }

        const list = await getModelsByModelId(modelId);

        res.json({
            success: true,
            data: list
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


/**
 * 获取 roles 目录下的所有角色模板名称。
 *
 * 仅返回文件名，不包含 .txt 后缀，
 * 用于前端下拉选择角色模板。
 *
 * 数据来源：data/roles/*.txt
 *
 * @example
 * // 前端请求示例：
 * GET /process/roles
 *
 * // 返回示例：
 * {
 *   "success": true,
 *   "data": [
 *     "catgirl",
 *     "assistant"
 *   ]
 * }
 */
export async function getRoles(req, res) {
    try {
        const list = await getRoleTxtList()

        res.json({
            success: true,
            data: list
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

/**
 * 获取 templates 目录下的所有模板脚本文件名
 *
 * 返回完整文件名（包含 .js 后缀），
 * 用于前端下拉选择模板。
 *
 * 数据来源：data/templates/*.js
 *
 * @example
 * // 前端请求示例：
 * GET /process/functions
 *
 * // 返回示例：
 * {
 *   "success": true,
 *   "data": [
 *     "help.js",
 *     "clear.js"
 *   ]
 * }
 */
export async function getFunctions(req, res) {
    try {
        const list = await getFunctionJsList()

        res.json({
            success: true,
            data: list
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
