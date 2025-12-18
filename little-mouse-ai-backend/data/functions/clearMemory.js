import RequestLog from "../../src/models/requestLogModel.js";

/**
 * 清空当前流程的对话记录
 *
 * @param {ProcessConfig} processConfig - 当前流程配置
 * @param {string} args - 命令参数（本命令不需要）
 *
 * @returns {string}
 */
export default async function (processConfig, args) {

    const {id: processId} = processConfig;

    // 删除该流程下的所有对话记录
    const result = await RequestLog.deleteMany({
        processId
    });

    return `对话历史已清除（共 ${result.deletedCount} 条）`;
}
