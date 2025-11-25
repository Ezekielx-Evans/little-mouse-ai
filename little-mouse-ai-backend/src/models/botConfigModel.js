import mongoose from "mongoose";

const botConfigSchema = new mongoose.Schema({
    id: {type: String, unique: true, required: true},
    name: String,
    appId: String,
    appSecret: String,
    token: String,
    sandbox: Boolean,
    image: String
});

export default mongoose.model("BotConfig", botConfigSchema);