import express from 'express'
import {
    deleteConfig,
    getConfigList,
    getFunctions,
    getModels,
    getRoles,
    saveConfig
} from "../controllers/processController.js";

const router = express.Router()

// 保存流程配置接口
router.post('/save', saveConfig)

// 获取流程配置接口
router.get('/list', getConfigList)

// 删除流程配置接口
router.delete('/delete', deleteConfig)

// 获取流程配置绑定的大模型可用的模型列表
router.get('/models/:modelId', getModels)

// 获取角色模板列表
router.get("/roles", getRoles)

// 获取功能文件列表
router.get("/functions", getFunctions)

export default router