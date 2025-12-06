import express from 'express'
import {deleteConfig, getConfigList, saveConfig} from "../controllers/processController.js";

const router = express.Router()

// 保存流程配置接口
router.post('/save', saveConfig)

// 获取流程配置接口
router.get('/list', getConfigList)

// 删除流程配置接口
router.delete('/delete', deleteConfig)

export default router