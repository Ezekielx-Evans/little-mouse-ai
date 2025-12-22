import instance from '@/utils/request.js'

// 验证登录状态
export const verifyLoginSession = async () => {
    const res = await instance.get('/login/verify')
    return res.data
}

// 验证密码
export const verifyLoginPassword = async (password) => {
    const res = await instance.post('/login', {
        password: password,
    })
    return res.data
}
