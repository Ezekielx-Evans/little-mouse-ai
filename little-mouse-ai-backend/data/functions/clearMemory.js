import RequestLog from "../../src/models/requestLogModel.js";
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

    const {id: processId, botId} = processConfig;

    // 删除该流程下的所有对话记录
    const [requestLogs, roleHistory] = await Promise.all([
        RequestLog.deleteMany({
        processId
        }),
        botId ? RoleConversationHistory.deleteOne({botId}) : {deletedCount: 0}
    ]);

    return `对话历史已清除（请求记录 ${requestLogs.deletedCount} 条，角色记忆 ${roleHistory.deletedCount || 0} 条）`;
}
