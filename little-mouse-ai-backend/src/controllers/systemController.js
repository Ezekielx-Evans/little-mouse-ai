import { getHelloMessage } from '../services/systemService.js'

export const getHello = (req, res) => {
    const message = getHelloMessage()
    res.send(message)
}