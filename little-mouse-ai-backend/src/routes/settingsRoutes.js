import express from 'express'
import {changePassword, fetchSettings, saveServiceConfig} from '../controllers/settingsController.js'

const router = express.Router()

router.get('/', fetchSettings)
router.post('/service', saveServiceConfig)
router.post('/password', changePassword)

export default router
