import express from 'express'
import { getHello, getSystemDashboard } from '../controllers/systemController.js'

const router = express.Router()

// 示例接口
router.get('/helloworld', getHello)

// 首页系统信息接口
router.get('/overview', getSystemDashboard)

export default router
