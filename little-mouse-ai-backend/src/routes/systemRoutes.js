import express from 'express'
import { getHello } from '../controllers/systemController.js'

const router = express.Router()

router.get('/helloworld', getHello)

export default router