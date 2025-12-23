import {getSettingConfig, saveSettingConfig, updateLoginPassword,} from '../services/settingService.js'

export const getConfig = async (req, res) => {
    try {
        const data = await getSettingConfig()
        res.json({success: true, data})
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

export const saveConfig = async (req, res) => {
    try {
        const data = await saveSettingConfig(req.body || {})
        res.json({success: true, data})
    } catch (error) {
        res.status(400).json({success: false, message: error.message})
    }
}

export const updatePassword = async (req, res) => {
    try {

        const data = await updateLoginPassword(req.body || {})

        res.json({success: true, data})
    } catch (error) {
        res.status(400).json({success: false, message: error.message})
    }
}
