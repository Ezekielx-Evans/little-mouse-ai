import mongoose from "mongoose";

const modelConfigSchema = new mongoose.Schema({
    id: {type: String, unique: true},
    name: String,
    baseUrl: String,
    apiKey: String,
    image: String
});

export default mongoose.model("ModelConfig", modelConfigSchema);