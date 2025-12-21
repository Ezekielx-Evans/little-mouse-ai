<script setup>
import {Delete, Edit, Plus, Warning} from '@element-plus/icons-vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {onMounted, ref} from 'vue'
import {
    deleteProcessConfig,
    getFunctionJsList,
    getModels,
    getProcessConfigList,
    getRoleTxtList,
    saveProcessConfig
} from "@/api/processApi.js";
import {getBotConfigList} from "@/api/botApi.js";
import {getModelConfigList} from "@/api/modelApi.js";

// 下拉菜单加载状态
const botIdLoading = ref(false)
const modelIdLoading = ref(false)
const modelLoading = ref(false)
const templateLoading = ref(false)
const functionLoading = ref(false)

// 机器人 ID 下拉选项
const botIdOptions = ref([])
// 模型 ID 下拉选项
const modelIdOptions = ref([])
// 可用模型列表下拉选项
const modelOptions = ref([])
// 角色预设下拉选项
const roleOptions = ref([
    {label: '自定义角色', value: 'custom'}
])
// 功能脚本下拉选项
const functionOptions = ref([])

// 加载机器人 ID 列表
const loadBotOptions = async () => {
    botIdLoading.value = true
    try {
        const res = await getBotConfigList()

        if (!res.success) {
            return ElMessage.error(res.message || "业务错误：机器人 ID 列表加载失败")
        }

        botIdOptions.value = res.data.map(item => ({
            label: item.name,
            value: item.id
        }))

    } catch (err) {
        ElMessage.error(`系统错误：${err.message || "机器人 ID 列表加载失败"}`)
    } finally {
        botIdLoading.value = false
    }
}
// 加载模型 ID 列表
const loadModelIdOptions = async () => {
    modelIdLoading.value = true
    try {
        const res = await getModelConfigList()

        if (!res.success) {
            return ElMessage.error(res.message || "业务错误：模型 ID 列表加载失败")
        }

        modelIdOptions.value = res.data.map(item => ({
            label: item.name,
            value: item.id
        }))

    } catch (err) {
        ElMessage.error(`系统错误：${err.message || "模型 ID 列表加载失败"}`)
    } finally {
        modelIdLoading.value = false
    }
}
// 加载可用模型列表
const loadModelOptions = async () => {
    if (!currentConfig.value?.modelId) {
        return ElMessage.warning("请先选择模型 ID")
    }

    modelLoading.value = true

    try {
        const res = await getModels(currentConfig.value.modelId)

        if (!res.success) {
            modelOptions.value = []
            return ElMessage.error(res.message || "业务错误：模型列表加载失败")
        }

        modelOptions.value = res.data.map(item => ({
            label: item.id,
            value: item.id
        }))

    } catch (err) {
        modelOptions.value = []
        ElMessage.error(`系统错误：${err.message || "模型列表加载失败"}`)
    } finally {
        modelLoading.value = false
    }
}

// 加载角色预设列表
const loadTemplateOptions = async () => {
    templateLoading.value = true
    try {
        const res = await getRoleTxtList()

        if (!res.success) {
            return ElMessage.error(res.message || '业务错误：预设列表加载失败')
        }

        roleOptions.value = [
            {label: '自定义预设', value: 'custom'},
            ...res.data.map(name => ({
                label: name,
                value: name
            }))
        ]

    } catch (err) {
        ElMessage.error(`系统错误：${err.message || '预设列表加载失败'}`)
    } finally {
        templateLoading.value = false
    }
}

// 加载功能文件列表
const loadFunctionOptions = async () => {
    functionLoading.value = true
    try {
        const res = await getFunctionJsList()

        if (!res.success) {
            return ElMessage.error(res.message || '业务错误：功能脚本列表加载失败')
        }

        functionOptions.value = res.data.map(name => ({
            label: name,
            value: name
        }))
    } catch (err) {
        ElMessage.error(`系统错误：${err.message || '功能脚本列表加载失败'}`)
    } finally {
        functionLoading.value = false
    }
}

// 定义第一次获取数据时的加载状态
const loading = ref(true)

// 配置文件列表
const configs = ref([])

// 获取配置文件
const getConfigs = async () => {
    try {
        const res = await getProcessConfigList()

        if (res.success) {
            configs.value = res.data

        } else {
            return ElMessage.error(res.message || '业务错误：获取配置列表失败')
        }

    } catch (err) {
        console.error(err)
        ElMessage.error(`系统错误：${err.message || '获取配置列表失败'}`)
    } finally {
        loading.value = false
    }
}


// 当前选中的配置ID
const selectedId = ref(configs.value[0]?.id ?? '')

// 当前选中的配置文件
const currentConfig = ref()

// 选择其他配置时的行为
const handleSelect = async (id) => {
    selectedId.value = id
    isDisabled.value = true
    currentConfig.value = configs.value.find(v => v.id === id)
}

// 添加配置时的行为
const handleAdd = async () => {
    const id = `process-${Date.now()}`
    const index = configs.value.length + 1

    try {
        loading.value = true

        const res = await saveProcessConfig({
            id,
            name: `流程配置 ${index}`,
            enabled: false,
            processType: 'function',
            botId: '',
            modelId: '',
            model: '',
            preset: 'custom',
            roleDescription: '',
            functions: [{command: '', file: '', desc: ''}],
        })

        if (!res.success) {
            return ElMessage.error(res.message || '新增失败')
        }

        await getConfigs()
        handleSelect(id)
        ElMessage.success('已新增流程配置')
    } catch (err) {
        console.error(err)
        ElMessage.error(`新增失败：${err.message}`)
    } finally {
        loading.value = false
    }
}

// 点击编辑按钮时的行为
const handleEdit = (item) => {
    isDisabled.value = false
    ElMessage.success(`正在编辑「${item.name}」`)
}

// 删除配置时的行为
const handleDelete = (config) => {
    ElMessageBox.confirm(`确认删除「${config.name}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(async () => {
            try {
                loading.value = true

                const res = await deleteProcessConfig(config.id)

                if (res.success) {
                    ElMessage.success('删除成功')

                    // 刷新列表
                    await getConfigs()

                    selectedId.value = ''
                    currentConfig.value = null
                } else {
                    ElMessage.error(res.message || '删除失败')
                }
            } catch (err) {
                console.error(err)
                ElMessage.error('删除失败：' + err.message)
            } finally {
                loading.value = false
            }
        })
        .catch(() => {
        })
}

// 是否允许编辑配置
const isDisabled = ref(true)

// 表单实例
const configFormRef = ref()

// 点击新增功能时的行为
const addFunction = () => {
    if (!currentConfig.value) return
    if (!Array.isArray(currentConfig.value.functions)) {
        currentConfig.value.functions = []
    }
    currentConfig.value.functions.push({command: '', file: '', desc: ''})
}

// 点击删除功能时的行为
const removeFunction = (idx) => {
    if (!currentConfig.value || !Array.isArray(currentConfig.value.functions)) return
    currentConfig.value.functions.splice(idx, 1)
}

// 机器人配置绑定模型的唯一性校验
const validateBotModelUnique = (rule, value, callback) => {
    if (!currentConfig.value || currentConfig.value.processType !== 'role') {
        return callback()
    }

    if (!value || !currentConfig.value.botId) {
        return callback()
    }

    const isConflict = configs.value.some(config =>
        config.id !== currentConfig.value.id
        && config.processType === 'role'
        && config.botId === currentConfig.value.botId
        && config.modelId !== value
    )

    if (isConflict) {
        return callback(new Error('该机器人已绑定其他模型配置'))
    }

    callback()
}

// 表单校验规则
const rules = ref({
    name: [{required: true, message: '名称不能为空', trigger: 'blur'}],
    processType: [{required: true, message: '请选择流程种类', trigger: 'blur'}],
    botId: [{required: true, message: '机器人 ID 不能为空', trigger: 'blur'}],
    modelId: [
        {required: true, message: '模型 ID 不能为空', trigger: 'blur'},
        {validator: validateBotModelUnique, trigger: ['change', 'blur']},
    ],
    model: [{required: true, message: '模型不能为空', trigger: 'blur'}],
    preset: [{required: true, message: '角色不能为空', trigger: 'blur'}],

})

// 保存表单
const submitForm = async (formRef) => {
    if (!formRef || !currentConfig.value) return

    formRef.validate(async (valid) => {
        if (!valid) {
            return
        }

        try {
            loading.value = true

            const res = await saveProcessConfig(currentConfig.value)

            if (res.success) {
                ElMessage.success('保存成功')

                isDisabled.value = true

                // 保存成功后刷新列表
                await getConfigs()

                // 重新选中为保存的配置
                selectedId.value = currentConfig.value.id
            } else {
                ElMessage.error(res.message || '保存失败')
            }
        } catch (err) {
            console.error(err)
            ElMessage.error('保存失败：' + err.message)
        } finally {
            loading.value = false
        }
    })
}

// 重置表单
const resetForm = (formRef) => {
    if (!formRef) return
    formRef.resetFields()
    ElMessage.success('已重置')
}

onMounted(() => {
    getConfigs()
})
</script>

<template>
    <el-scrollbar>
        <div class="model-page">

            <!-- 标题卡片 -->
            <el-card class="card">
                <div class="card-header">
                    <span class="decor"></span>
                    配置
                </div>
            </el-card>

            <!-- 配置信息卡片 -->
            <el-card v-loading="loading" class="card">
                <div class="model-layout">

                    <!-- 左侧列表 -->
                    <div class="list-panel">
                        <div class="panel-header">
                            <div class="panel-title">
                                <span class="decor"></span>
                                流程列表
                            </div>
                            <el-button :icon="Plus" plain type="primary" @click="handleAdd">新增流程</el-button>
                        </div>

                        <el-scrollbar class="list-scroll">
                            <div
                                v-for="item in configs"
                                :key="item.id"
                                :class="{ active: selectedId === item.id }"
                                class="config-card"
                                @click="handleSelect(item.id)"
                            >
                                <div class="config-body">
                                    <el-image fit="cover" src="/src/assets/images/processImage.png"/>
                                    <div class="config-content">
                                        <div class="config-name">{{ item.name }}</div>
                                        <div class="config-meta">
                                            <el-tag :type="item.enabled ? 'success' : 'info'" size="small">
                                                {{ item.enabled ? '运行中' : '已停用' }}
                                            </el-tag>
                                        </div>
                                    </div>
                                </div>
                                <div class="config-actions">
                                    <el-button
                                        :disabled="item.id !== selectedId"
                                        :icon="Edit"
                                        circle
                                        text
                                        type="primary"
                                        @click.stop="handleEdit(item)"
                                    />
                                    <el-button
                                        :icon="Delete"
                                        circle
                                        text
                                        type="danger"
                                        @click.stop="handleDelete(item)"
                                    />
                                </div>
                            </div>
                        </el-scrollbar>
                    </div>

                    <!-- 右侧详情 -->
                    <div class="details-panel">
                        <div class="panel-title">
                            <span class="decor"></span>
                            流程详情
                        </div>

                        <div v-if="currentConfig">
                            <el-form
                                ref="configFormRef"
                                :model="currentConfig"
                                :rules="rules"
                                label-position="top"
                            >
                                <!-- 名称 -->
                                <el-form-item label="名称" prop="name">
                                    <el-input v-model="currentConfig.name" :disabled="isDisabled"/>
                                </el-form-item>

                                <!-- 开启 -->
                                <el-form-item label="开启">
                                    <el-switch v-model="currentConfig.enabled" :disabled="isDisabled"/>
                                </el-form-item>

                                <!-- 流程种类 -->
                                <el-form-item label="流程种类" prop="processType">
                                    <el-select v-model="currentConfig.processType" :disabled="isDisabled">
                                        <el-option label="功能回复" value="function"/>
                                        <el-option label="角色对话" value="role"/>
                                    </el-select>
                                </el-form-item>

                                <!-- 机器人 ID -->
                                <el-form-item label="机器人 ID" prop="botId">
                                    <el-select v-model="currentConfig.botId"
                                               :disabled="isDisabled"
                                               :loading="botIdLoading"
                                               placeholder="选择机器人 ID"
                                               @visible-change="val => val && loadBotOptions()"
                                    >
                                        <el-option
                                            v-for="item in botIdOptions"
                                            :key="item.value"
                                            :label="item.value"
                                            :value="item.value"
                                        >
                                            <div class="option-row">
                                                <span>{{ item.label }}</span>
                                                <el-tag size="small">
                                                    {{ item.value }}
                                                </el-tag>
                                            </div>
                                        </el-option>
                                    </el-select>
                                </el-form-item>

                                <!-- 角色区域（仅角色对话显示） -->
                                <template v-if="currentConfig.processType === 'role'">

                                    <!-- 模型 ID -->
                                    <el-form-item prop="modelId" style="gap: 10px">
                                        <template #label>
                                            <div class="form-label-with-icon">
                                                <span>模型 ID</span>
                                                <el-tooltip content="同一机器人只能绑定一个模型配置">
                                                    <el-icon>
                                                        <Warning/>
                                                    </el-icon>
                                                </el-tooltip>
                                            </div>
                                        </template>
                                        <el-select v-model="currentConfig.modelId"
                                                   :disabled="isDisabled"
                                                   :loading="modelIdLoading"
                                                   placeholder="选择模型 ID"
                                                   @visible-change="val => val && loadModelIdOptions()"
                                        >
                                            <el-option
                                                v-for="item in modelIdOptions"
                                                :key="item.value"
                                                :label="item.value"
                                                :value="item.value"
                                            >
                                                <div class="option-row">
                                                    <span>{{ item.label }}</span>
                                                    <el-tag size="small">
                                                        {{ item.value }}
                                                    </el-tag>
                                                </div>
                                            </el-option>
                                        </el-select>
                                    </el-form-item>

                                    <!-- 模型 -->
                                    <el-form-item label="模型" prop="model">
                                        <el-select
                                            v-model="currentConfig.model"
                                            :disabled="isDisabled"
                                            :loading="modelLoading"
                                            placeholder="选择模型"
                                            @visible-change="val => val && loadModelOptions()"
                                        >
                                            <el-option
                                                v-for="item in modelOptions"
                                                :key="item.value"
                                                :label="item.label"
                                                :value="item.value"
                                            />
                                        </el-select>
                                    </el-form-item>

                                    <!-- 角色预设 -->
                                    <el-form-item label="角色预设" prop="preset">
                                        <el-select
                                            v-model="currentConfig.preset"
                                            :disabled="isDisabled"
                                            :loading="templateLoading"
                                            placeholder="请选择角色预设"
                                            @visible-change="val => val && loadTemplateOptions()"
                                        >
                                            <el-option
                                                v-for="item in roleOptions"
                                                :key="item.value"
                                                :label="item.label"
                                                :value="item.value"
                                            />
                                        </el-select>
                                    </el-form-item>

                                    <!-- 角色描述 -->
                                    <el-form-item
                                        v-if="currentConfig.preset === 'custom'"
                                        label="角色描述"
                                    >
                                        <el-input
                                            v-model="currentConfig.roleDescription"
                                            :disabled="isDisabled"
                                            :rows="4"
                                            placeholder="请输入角色描述"
                                            type="textarea"
                                        />
                                    </el-form-item>

                                </template>

                                <!-- 功能配置（仅功能回复显示） -->
                                <template v-if="currentConfig.processType === 'function'">

                                    <!-- 标题 + 新增按钮 -->
                                    <el-form-item label="功能配置">
                                        <el-button
                                            :disabled="isDisabled"
                                            size="small"
                                            type="primary"
                                            @click="addFunction"
                                        >
                                            新增功能
                                        </el-button>

                                    </el-form-item>

                                    <!-- 功能设置 -->
                                    <el-form-item
                                        v-for="(fn, idx) in currentConfig.functions"
                                        :key="idx"
                                    >
                                        <div class="function-group">
                                            <!-- 触发指令 -->
                                            <div class="function-item-wrap">
                                                <span class="function-desc">指令</span>
                                                <el-input
                                                    v-model="fn.command"
                                                    :disabled="isDisabled"
                                                    class="function-item"
                                                    placeholder="触发指令，如 /help"
                                                />
                                            </div>

                                            <!-- 执行文件 -->
                                            <div class="function-item-wrap">
                                                <span class="function-desc">文件</span>
                                                <el-select
                                                    v-model="fn.file"
                                                    :disabled="isDisabled"
                                                    :loading="functionLoading"
                                                    class="function-item"
                                                    placeholder="执行文件"
                                                    @visible-change="val => val && loadFunctionOptions()"
                                                >
                                                    <el-option
                                                        v-for="item in functionOptions"
                                                        :key="item.value"
                                                        :label="item.value"
                                                        :value="item.value"
                                                    />
                                                </el-select>
                                            </div>

                                            <!-- 描述 -->
                                            <div class="function-item-wrap">
                                                <span class="function-desc">描述</span>
                                                <el-input
                                                    v-model="fn.desc"
                                                    :disabled="isDisabled"
                                                    class="function-item"
                                                    placeholder="功能描述"
                                                />
                                            </div>

                                            <!-- 删除 -->
                                            <el-button
                                                :disabled="isDisabled"
                                                :icon="Delete"
                                                circle
                                                type="danger"
                                                @click="removeFunction(idx)"
                                            />
                                        </div>
                                    </el-form-item>
                                </template>

                                <!-- 操作按钮 -->
                                <el-form-item>
                                    <el-button
                                        :disabled="isDisabled"
                                        type="primary"
                                        @click="submitForm(configFormRef)"
                                    >
                                        保存
                                    </el-button>
                                    <el-button
                                        :disabled="isDisabled"
                                        @click="resetForm(configFormRef)"
                                    >
                                        重置
                                    </el-button>
                                </el-form-item>
                            </el-form>
                        </div>

                        <div v-else class="empty-state">
                            <el-empty description="请先创建或选择一个配置"/>
                        </div>
                    </div>
                </div>
            </el-card>
        </div>
    </el-scrollbar>
</template>

<style scoped>
.model-page {
    margin-left: 10%;
    margin-right: 10%;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.card {
    --el-card-border-radius: 20px;
}

.card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 45px rgba(64, 158, 255, 0.15);
}

.card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.08em;
}

.decor {
    display: inline-block;
    width: 6px;
    height: 20px;
    background: rgb(51, 126, 204);
    border-radius: 3px;
    margin-right: 8px;
    user-select: none;
}

.model-layout {
    display: flex;
    overflow-x: auto;
    gap: 24px;
}

.list-panel,
.details-panel {
    flex-grow: 1;
    background: #f8f9ff;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.list-panel {
    max-width: 320px;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-title {
    display: flex;
    align-items: center;
    font-weight: 600;
}

.list-scroll {
    max-height: 420px;
    padding-right: 8px;
}

.config-card {
    border-radius: 16px;
    padding: 16px;
    background: #fff;
    box-shadow: 0 10px 24px rgba(64, 158, 255, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    margin-bottom: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
}

.config-card:last-child {
    margin-bottom: 0;
}

.config-card.active {
    border: 1px solid #409eff;
    box-shadow: 0 16px 30px rgba(64, 158, 255, 0.18);
}

.config-card:hover {
    transform: translateY(-4px);
}

.config-body {
    display: flex;
    align-items: center;
    gap: 12px;
}

.config-body .el-image {
    width: 56px;
    height: 56px;
    border-radius: 14px;
}

.config-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.config-name {
    font-weight: 600;
    font-size: 16px;
    color: #303133;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.config-actions {
    display: flex;
    gap: 8px;
}

.empty-state {
    margin-top: 40px;
}

.function-group {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.function-item-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
}

.function-item {
    flex: 1;
}

.function-desc {
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
}

.option-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.form-label-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
</style>
