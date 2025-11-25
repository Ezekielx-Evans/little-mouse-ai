import express from 'express'
import systemRoutes from './systemRoutes.js'
import botRoutes from "./botRoutes.js";
import modelRoutes from "./modelRoutes.js";

const router = express.Router()

router.use('/system', systemRoutes)
router.use('/bot', botRoutes)
router.use('/model',modelRoutes)

export default router
