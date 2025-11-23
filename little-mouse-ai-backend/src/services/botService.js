import BotConfig from '../models/botConfigModel.js'

/**
 * 保存机器人配置（新增或更新）。
 *
 * 根据传入的数据中的 `id` 字段，判断是更新已有机器人配置，还是创建新的配置（如果不存在）。
 *
 * 返回更新后的配置。
 *
 * @async
 * @function saveConfig
 *
 * @example
 * // 保存机器人配置（如果 id 存在则更新，否则新增）
 * await saveConfig({
 *   id: "bot-001",
 *   name: "客服助手",
 *   sandbox: true
 * })
 */
export async function saveBotConfig(data) {
    const filter = {id: data.id};

    // new: true 代表返回更新后的数据
    // upsert: true 代表如果未找到文档，则插入新文档
    const options = {new: true, upsert: true};

    return BotConfig.findOneAndUpdate(filter, data, options);
}