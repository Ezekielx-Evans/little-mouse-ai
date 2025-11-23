import mongoose from "mongoose";

const requestLogSchema = new mongoose.Schema({
    request: mongoose.Schema.Types.Mixed,           // 请求 JSON
    response: mongoose.Schema.Types.Mixed,          // 响应 JSON
    modelId: String,
    processId: String,
    botId: String,
    createdAt: { type: Date, default: Date.now }    // 创建时间
});

export default mongoose.model("RequestLog", requestLogSchema);