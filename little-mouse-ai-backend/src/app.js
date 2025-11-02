import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'

const app = express()
const port = 3000

// 允许跨域请求
app.use(cors({
    origin: 'http://localhost:5173',  // 允许的前端地址
}))

// 解析前端发送的 JSON 数据
app.use(express.json())

// 挂载路由
app.use(routes)


// 启动服务器
app.listen(port, () => {
    console.log(`后端服务器在 ${port} 端口上运行`)
})
