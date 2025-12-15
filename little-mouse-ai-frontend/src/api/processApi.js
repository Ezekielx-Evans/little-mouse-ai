import instance from '@/utils/request.js'

// 保存流程配置（新增 / 更新）
export const saveProcessConfig = async (data) => {
    const res = await instance.post('/process/save', data)
    return res.data
}

// 获取流程配置列表
export const getProcessConfigList = async () => {
    const res = await instance.get('/process/list')
    return res.data
}

// 删除流程配置
export const deleteProcessConfig = async (id) => {
    const res = await instance.delete('/process/delete', {
        data: { id }
    })
    return res.data
}

// 获取流程配置绑定的大模型可用的模型列表
export const getModels = async (modelId) => {
    const res = await instance.get(`/process/models/${modelId}`);
    return res.data;
};