import instance from '@/utils/request.js'

export const getRequestHistoryList = async (params) => {
    const res = await instance.get('/request/history', {params})
    return res.data
}
