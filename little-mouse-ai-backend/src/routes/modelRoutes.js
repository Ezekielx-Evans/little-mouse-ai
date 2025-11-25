import express from 'express'
import { deleteConfig, getConfigList, saveConfig } from "../controllers/modelController.js";

const router = express.Router();

// 保存大模型配置接口
router.post('/save', saveConfig);

// 获取大模型配置接口
router.get('/list', getConfigList);

// 删除大模型配置接口
router.delete('/delete', deleteConfig);

export default router;