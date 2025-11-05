import { getHelloMessage, getSystemInfo } from '../services/systemService.js'

// 返回欢迎消息
export const getHello = (req, res) => {
    const message = getHelloMessage()
    res.send(message)
}

// 返回系统信息
export const getSystemInfoController = (req, res) => {
    const systemInfo = getSystemInfo()
    res.json(systemInfo)
}
