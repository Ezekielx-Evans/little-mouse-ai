import express from 'express'
import {getConfig, saveConfig, updatePassword} from '../controllers/settingsController.js'

const router = express.Router()

router.get('/service', getConfig)
router.post('/save', saveConfig)
router.post('/password', updatePassword)

export default router
