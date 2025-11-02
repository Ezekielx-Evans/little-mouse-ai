import express from 'express'

import routes from './routes/index.js'

const app = express()
const port = 3000

app.use(routes)

app.listen(port, () => {
    console.log(`后端服务器在 ${port} 端口上运行`)
})

