import mongoose from "mongoose";

const modelConfigSchema = new mongoose.Schema({
    id: {type: String, unique: true, required: true},
    name: String,
    baseUrl: String,
    apiKey: String,
    // 记录绑定的流程 ID，sparse + unique 确保一个流程只会绑定到一个模型配置
    processId: {type: String, unique: true, sparse: true}
});

export default mongoose.model("ModelConfig", modelConfigSchema);
