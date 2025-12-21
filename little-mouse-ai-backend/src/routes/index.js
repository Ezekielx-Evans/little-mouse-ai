import express from 'express'
import systemRoutes from './systemRoutes.js'
import botRoutes from "./botRoutes.js";
import modelRoutes from "./modelRoutes.js";
import webhookRoutes from "./webhookRoutes.js";
import processRoutes from "./processRoutes.js";
import settingsRoutes from './settingsRoutes.js'

const router = express.Router()

router.use('/system', systemRoutes)
router.use('/bot', botRoutes)
router.use('/model',modelRoutes)
router.use('/webhook', webhookRoutes)
router.use('/process',processRoutes)
router.use('/setting', settingsRoutes)

export default router
