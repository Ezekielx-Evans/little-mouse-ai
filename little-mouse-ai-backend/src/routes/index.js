import express from 'express'
import systemRoutes from './systemRoutes.js'
import botRoutes from "./botRoutes.js";
import modelRoutes from "./modelRoutes.js";
import webhookRoutes from "./webhookRoutes.js";
import processRoutes from "./processRoutes.js";
import settingRoutes from './settingRoutes.js'
import loginRouter from "./loginRouter.js";
import requestRoutes from "./requestRoutes.js";

const router = express.Router()

router.use('/system', systemRoutes)
router.use('/bot', botRoutes)
router.use('/model', modelRoutes)
router.use('/webhook', webhookRoutes)
router.use('/process', processRoutes)
router.use('/setting', settingRoutes)
router.use('/login', loginRouter)
router.use('/request', requestRoutes)

export default router
