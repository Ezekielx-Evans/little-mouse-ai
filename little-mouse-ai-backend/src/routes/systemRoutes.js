import express from 'express'
import { getHello, getSystemInfoController } from '../controllers/systemController.js'

const router = express.Router()

// 测试接口
router.get('/helloworld', getHello)

// 系统信息接口
router.get('/info', getSystemInfoController)

export default router
