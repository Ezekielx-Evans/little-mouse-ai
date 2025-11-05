import instance from '@/utils/request.js'

// 获取 "Hello World !"
export const getHello = async () => {
    const res = await instance.get('/system/helloworld')
    return res.data
}

// 获取系统概览信息
export const getSystemDashboard = async () => {
    const res = await instance.get('/system/overview')
    return res.data
}
