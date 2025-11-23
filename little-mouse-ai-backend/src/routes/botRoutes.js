import express from 'express'
import {saveConfig} from "../controllers/botController.js";

const router = express.Router()

// 保存机器人信息接口
router.post('/save', saveConfig)

export default router