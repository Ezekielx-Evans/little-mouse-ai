import ModelConfig from '../models/modelConfigModel.js'

/**
 * 保存大模型配置（新增或更新）。
 *
 * 根据传入的数据中的 `id` 字段，判断是更新已有大模型配置，
 * 还是创建新的配置（如果不存在）。
 *
 * 返回更新后的配置。
 *
 * @example
 * // 保存大模型配置（如果 id 存在则更新，否则新增）
 * await saveModelConfig({
 *   "id": "model-001",
 *   "name": "DeepSeek Chat",
 *   "baseUrl": "https://api.deepseek.com/v1",
 *   "apiKey": "sk-15c040979d3e4b26abae62b09d3adfd5",
 *   "processId": "flow-001"
 * })
 */
export async function saveModelConfig(data) {
    const filter = { id: data.id };

    // 若指定流程 ID，检查是否已被其他配置占用，是则报错阻止重复绑定
    if (data.processId) {
        const occupied = await ModelConfig.findOne({
            processId: data.processId,
            id: { $ne: data.id }
        });

        if (occupied) {
            throw new Error("该流程已绑定其他大模型配置，请先解绑后再选择");
        }
    }

    // new: true 返回更新后的文档
    // upsert: true 未找到则创建新文档
    const options = { new: true, upsert: true };

    return ModelConfig.findOneAndUpdate(filter, data, options);
}

/**
 * 获取所有大模型配置列表。
 *
 * 返回数据库中全部大模型配置文档的数组。
 *
 * @example
 * const list = await getModelConfigList()
 * // 返回示例：
 * [
 *   {
 *     _id: "6923106e69af27de21770111",
 *     id: "deepseek-chat",
 *     name: "DeepSeek Chat",
 *     baseUrl: "https://api.deepseek.com/v1",
 *     apiKey: "sk-15c040979d3e4b26abae62b09d3adfd5",
 *   }
 * ]
 */
export async function getModelConfigList() {
    return ModelConfig.find();
}

/**
 * 根据传入的 id 删除大模型配置。
 *
 * 它返回一个包含 deletedCount 属性的对象，该属性指示已删除多少个文档。
 *
 * @example
 * await deleteModelConfigById("deepseek-chat")
 */
export async function deleteModelConfigById(id) {

    const filter = { id };

    return ModelConfig.deleteOne(filter);
}
