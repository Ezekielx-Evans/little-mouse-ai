import instance from '@/utils/request.js'

// 获取当前服务配置
export const getSettingConfig = async () => {
    const res = await instance.get('/setting/service')
    return res.data
}

// 保存服务配置
export const saveSettingConfig = async (data) => {
    const res = await instance.post('/setting/save', data)
    return res.data
}

// 修改密码
export const updateLoginPassword = async (data) => {
    const res = await instance.post('/setting/password', data)
    return res.data
}
