import instance from '@/utils/request.js'

// 获取 "Hello World !"
export const getHello = async () => {
    const res = await instance.get('/helloworld')
    return res.data
}
