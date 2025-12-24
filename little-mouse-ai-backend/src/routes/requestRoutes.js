import express from 'express'
import {getRequestHistory} from "../controllers/requestController.js"

const router = express.Router()

router.get('/history', getRequestHistory)

export default router
