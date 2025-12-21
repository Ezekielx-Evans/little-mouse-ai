import {getSettings, updatePassword, updateServiceConfig} from '../services/settingsService.js'

export const fetchSettings = async (req, res) => {
    try {
        const data = await getSettings()
        res.json({success: true, data})
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

export const saveServiceConfig = async (req, res) => {
    try {
        const data = await updateServiceConfig(req.body || {})
        res.json({success: true, data})
    } catch (error) {
        res.status(400).json({success: false, message: error.message})
    }
}

export const changePassword = async (req, res) => {
    try {
        const {password} = req.body || {}

        if (!password) {
            return res.status(400).json({success: false, message: '密码不能为空'})
        }

        await updatePassword({password})
        res.json({success: true})
    } catch (error) {
        res.status(400).json({success: false, message: error.message})
    }
}

