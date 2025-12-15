import mongoose from "mongoose";

const processConfigSchema = new mongoose.Schema({
    id: {type: String, unique: true, required: true},
    name: String,
    enabled: Boolean,
    processType: String,
    botId: String,
    modelId: String,
    model: String,
    roleTemplate: String,
    roleDescription: String,
    image: String,
    functions: [
        {
            command: String,
            file: String,
            desc: String
        }
    ]
});

export default mongoose.model("ProcessConfig", processConfigSchema);