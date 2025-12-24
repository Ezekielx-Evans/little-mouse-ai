import mongoose from "mongoose"

const requestHistorySchema = new mongoose.Schema({
    request: mongoose.Schema.Types.Mixed,
    response: mongoose.Schema.Types.Mixed,
    modelId: String,
    processId: String,
    botId: String,
    status: String,
    requestAt: Date,
    responseAt: Date,
    durationMs: Number,
    tokens: Number
})

export default mongoose.model("RequestHistory", requestHistorySchema)
