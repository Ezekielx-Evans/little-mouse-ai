import express from "express"
import {getRequestList} from "../controllers/requestController.js"

const router = express.Router()

router.get('/list', getRequestList)

export default router
