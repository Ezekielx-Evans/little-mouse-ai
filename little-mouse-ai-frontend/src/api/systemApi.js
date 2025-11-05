import instance from '@/utils/request.js'

// 获取 "Hello World !"
export const getHello = async () => {
    const res = await instance.get('/system/helloworld')
    return res.data
}

// 获取系统信息
export const getSystemStatus = async () => {
    const res = await instance.get('/system/status')
    return res.data
}