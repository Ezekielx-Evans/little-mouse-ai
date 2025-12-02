import express from 'express'
import {processEvent} from '../controllers/webhookController.js'

const router = express.Router()

// 接收 Webhook 消息，执行回调函数接口
router.post('/callback/:botId', processEvent)

export default router
