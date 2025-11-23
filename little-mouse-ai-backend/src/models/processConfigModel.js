import mongoose from "mongoose";

const processConfigSchema = new mongoose.Schema({
    id: {type: String, unique: true},
    name: String,
    enabled: Boolean,
    templateType: String,
    template: String,
    botId: String,
    modelId: String,
    triggerCommand: String,
    codeInjection: String,
    role: String,
    image: String
});

export default mongoose.model("ProcessConfig", processConfigSchema);