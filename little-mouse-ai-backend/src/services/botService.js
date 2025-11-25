import BotConfig from '../models/botConfigModel.js'

/**
 * 保存机器人配置（新增或更新）。
 *
 * 根据传入的数据中的 `id` 字段，判断是更新已有机器人配置，还是创建新的配置（如果不存在）。
 *
 * 返回更新后的配置。
 *
 * @async
 * @function saveBotConfig
 *
 * @example
 * // 保存机器人配置（如果 id 存在则更新，否则新增）
 * await saveBotConfig({
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

/**
 * 获取所有机器人配置列表。
 *
 * 返回数据库中全部机器人配置文档的数组。
 *
 * @async
 * @function getBotConfigList
 *
 * @example
 * // 获取机器人配置列表
 * const bots = await getBotConfigList()
 * // 返回示例：
 * // [
 * //   {
 * //     _id: "6923106e69af27de2177056a",
 * //     id: "bot-001",
 * //     name: "客服助手",
 * //     sandbox: true,
 * //     ...
 * //   },
 * //   {
 * //     _id: "6923106e69af27de21770987",
 * //     id: "bot-002",
 * //     name: "内容助手",
 * //     sandbox: false,
 * //     ...
 * //   }
 * // ]
 */
export async function getBotConfigList() {
    return BotConfig.find();
}

/**
 * 通过传入的 id 删除机器人配置。
 *
 * 它返回一个包含 deletedCount 属性的对象，该属性指示已删除多少个文档。
 *
 * @async
 * @function deleteBotConfigById
 *
 * @example
 * // 根据 id 删除机器人配置
 * await deleteBotConfigById(id: "bot-001")
 */
export async function deleteBotConfigById(id) {

    const filter = {id: id};

    return BotConfig.deleteOne(filter);
}