import RoleConversationHistory from "../../src/models/roleConversationHistoryModel.js";

/**
 * 清空当前流程的对话记录
 *
 * @param {ProcessConfig} processConfig - 当前流程配置
 * @param {string} args - 命令参数（本命令不需要）
 *
 * @returns {string}
 */
export default async function (processConfig, args) {

    const {botId} = processConfig;

    // 删除该 bot 下的对话记录
    const result = await RoleConversationHistory.deleteOne({ botId });

    return `对话记忆 ${result.deletedCount || 0} 条`;
}
