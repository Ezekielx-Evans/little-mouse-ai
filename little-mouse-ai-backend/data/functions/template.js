/**
 * 示例功能模板
 *
 * @param {ProcessConfig} processConfig - 当前流程配置
 * @param {string} args - 用户命令后跟随的参数文本
 *
 * @returns {string} - 返回的内容会被 runFunction() 自动处理
 */
export default async function (processConfig, args) {

    // 如果没有参数，给一个默认行为
    if (!args || !args.trim()) {
        return  "请提供有效的参数，例如：/命令 参数1 参数2";
    }

    // 返回结果
    return `你输入的参数是：${args}`;
}