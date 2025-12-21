import mongoose from "mongoose"

const roleConversationHistorySchema = new mongoose.Schema({
    botId: {type: String, required: true, unique: true},
    messages: [{
        role: {type: String, enum: ["user", "assistant"], required: true},
        content: {type: String, required: true},
        createdAt: {type: Date, default: Date.now}
    }]
})

export default mongoose.model("RoleConversationHistory", roleConversationHistorySchema)
