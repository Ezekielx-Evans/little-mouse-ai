import express from 'express'
import {deleteConfig, getConfigList, saveConfig} from "../controllers/botController.js";

const router = express.Router()

// 保存机器人配置接口
router.post('/save', saveConfig)

// 获取机器人配置接口
router.get('/list', getConfigList)

// 删除机器人配置接口
router.delete('/delete', deleteConfig)

export default router