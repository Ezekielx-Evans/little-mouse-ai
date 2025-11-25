import instance from '@/utils/request.js'

// 保存机器人配置（新增 / 更新）
export const saveBotConfig = async (data) => {
    const res = await instance.post('/bot/save', data)
    return res.data
}

// 获取机器人配置列表
export const getBotConfigList = async () => {
    const res = await instance.get('/bot/list')
    return res.data
}

// 删除机器人配置
export const deleteBotConfig = async (id) => {
    const res = await instance.delete('/bot/delete', {
        data: { id }
    })
    return res.data
}