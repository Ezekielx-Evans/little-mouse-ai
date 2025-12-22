import {verifyLoginPassword, verifyLoginSession} from "../services/loginService.js";

export const verifySession = async (req, res) => {
    try {
        const valid = await verifyLoginSession()

        res.json({
            success: true, data: {
                authenticated: valid
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false, message: error.message
        })
    }
}

export const verifyPassword = async (req, res) => {
    try {
        const {password} = req.body || {}

        const ok = await verifyLoginPassword(password)

        if (!ok) {
            return res.status(400).json({
                success: false, message: '密码错误'
            })
        }

        res.json({
            success: true
        })
    } catch (error) {
        res.status(500).json({
            success: false, message: error.message
        })
    }
}