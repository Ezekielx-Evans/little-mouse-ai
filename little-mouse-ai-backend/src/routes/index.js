import express from 'express'
import systemRoutes from './systemRoutes.js'
import botRoutes from "./botRoutes.js";

const router = express.Router()

router.use('/system', systemRoutes)
router.use('/bot', botRoutes)

export default router
