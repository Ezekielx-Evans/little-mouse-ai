import express from 'express'

const app = express()
const port = 3000

app.listen(port, () => {
    console.log(`后端服务器在 ${port} 端口上运行`)
})
