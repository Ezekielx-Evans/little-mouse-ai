import express from 'express'
import {verifyPassword, verifySession} from "../controllers/loginController.js";

const router = express.Router();

// 登录状态验证
router.post('/session', verifySession);

// 密码验证
router.post('/password', verifyPassword);

export default router;