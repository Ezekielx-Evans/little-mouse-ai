import instance from '@/utils/request.js'

// 保存大模型配置（新增 / 更新）
export const saveModelConfig = async (data) => {
    const res = await instance.post('/model/save', data)
    return res.data
}

// 获取大模型配置列表
export const getModelConfigList = async () => {
    const res = await instance.get('/model/list')
    return res.data
}

// 删除大模型配置
export const deleteModelConfig = async (id) => {
    const res = await instance.delete('/model/delete', {
        data: { id }
    })
    return res.data
}