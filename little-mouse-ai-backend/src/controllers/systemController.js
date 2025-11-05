import { getHelloMessage, getSystemDashboardData } from '../services/systemService.js'

/**
 * "Hello World !" 示例接口
 */
export const getHello = (req, res) => {
    const message = getHelloMessage()
    res.send(message)
}

/**
 * 获取系统概览信息
 */
export const getSystemDashboard = (req, res) => {
    try {
        const data = getSystemDashboardData()
        res.json(data)
    } catch (error) {
        console.error('获取系统信息失败', error)
        res.status(500).json({ message: '获取系统信息失败' })
    }
}
