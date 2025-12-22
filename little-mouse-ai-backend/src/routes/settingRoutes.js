import express from 'express'
import {getConfig, saveConfig, updatePassword} from '../controllers/settingController.js'

const router = express.Router()

router.get('/service', getConfig)
router.post('/save', saveConfig)
router.post('/password', updatePassword)

export default router
