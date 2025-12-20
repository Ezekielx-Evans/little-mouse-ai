import mongoose from "mongoose";

const modelConfigSchema = new mongoose.Schema({
    id: {type: String, unique: true, required: true},
    name: String,
    baseUrl: String,
    apiKey: String
});

export default mongoose.model("ModelConfig", modelConfigSchema);
