import express from 'express'
import systemRoutes from './systemRoutes.js'

const router = express.Router()

router.use('/system', systemRoutes)

export default router
