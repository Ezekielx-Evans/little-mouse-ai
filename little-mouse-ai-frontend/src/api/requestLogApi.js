import instance from '@/utils/request.js'

export const getRequestLogs = async (params) => {
    const res = await instance.get('/request/list', {params})
    return res.data
}
