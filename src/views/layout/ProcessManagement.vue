<script setup>
import {Delete, Edit, Plus} from '@element-plus/icons-vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {computed, onMounted, ref, watch} from 'vue'

// 流程配置列表
const configs = ref([])

// 当前流程配置
const currentConfig = ref()

// 是否允许编辑
const isDisabled = ref(true)

// 新增：模板类型和模板选项拆分，模拟后端数据结构
const templateTypeOptions = ref([
    {value: 'AITemplate', label: 'AI 角色模板'},
    {value: 'functionTemplate', label: '功能模板'},
])

// 新增：不同模板类型下的模板列表
const templateOptions = ref({
    AITemplate: [
        {value: 'ai-custom', label: '自定义角色'},
        {value: 'catgirl', label: '猫娘'},
    ],
    functionTemplate: [
        {value: 'function-custom', label: '自定义功能'},
        {value: 'life_assistant', label: '生活助手'},
        {value: 'delta_force_assistant', label: '三角洲游戏助手'},
    ],
})

// 新增：根据当前配置计算可用模板
const currentTemplateOptions = computed(() => {
    const type = currentConfig.value?.templateType
    return type ? templateOptions.value[type] ?? [] : []
})

// 新增：根据模板类型与模板值获取展示名称
const getTemplateLabel = (type, value) => {
    return (templateOptions.value[type] ?? []).find(item => item.value === value)?.label ?? ''
}

// 新增：获取模板类型名称
const getTemplateTypeLabel = (type) => {
    return templateTypeOptions.value.find(item => item.value === type)?.label ?? ''
}

// 机器人列表（来自机器人管理）
const botOptions = ref([
    {label: '客服助手', value: 'bot-001'},
    {label: '销售助理', value: 'bot-002'},
    {label: '技术支持', value: 'bot-003'},
])

// 大模型列表（来自模型管理）
const modelOptions = ref([
    {label: 'deepseek-chat', value: 'deepseek-chat'},
    {label: 'deepseek-reasoner', value: 'deepseek-reasoner'},
])

// 当前选中的流程 ID
const selectedId = ref(configs.value[0]?.id ?? '')

// 表单实例
const configForm = ref()

// 获取流程配置列表
const getConfigs = () => {
    configs.value.push(
        {
            id: 'process-001',
            name: '猫娘',
            enabled: true,
            // 新增：区分模板类型
            templateType: 'AITemplate',
            template: 'catgirl',
            botId: 'bot-001',
            modelId: 'deepseek-chat',
            triggerCommand: '',
            codeInjection: '/* 自定义逻辑 */',
            role: '你是一只可爱活泼的猫娘，喜欢卖萌。',
            image: '/src/assets/images/mouse.png',
        },
        {
            id: 'process-002',
            name: '小助手',
            enabled: false,
            // 新增：区分模板类型
            templateType: 'functionTemplate',
            template: 'life_assistant',
            botId: 'bot-002',
            modelId: 'deepseek-reasoner',
            triggerCommand: '/life_assistant',
            codeInjection: '',
            role: '',
            image: '/src/assets/images/mouse.png',
        },
        {
            id: 'process-003',
            name: '三角洲行动游戏助手',
            enabled: true,
            // 新增：区分模板类型
            templateType: 'functionTemplate',
            template: 'delta_force_assistant',
            botId: 'bot-003',
            modelId: 'deepseek-chat',
            triggerCommand: '/delta_force_assistant',
            codeInjection: '',
            role: '',
            image: '/src/assets/images/mouse.png',
        },
    )
    // 新增：默认选中第一条配置
    selectedId.value = configs.value[0]?.id ?? ''
    currentConfig.value = configs.value[0] ?? null
}

// 选择流程
const handleSelect = (id) => {
    selectedId.value = id
    isDisabled.value = true
    currentConfig.value = configs.value.find(item => item.id === id)
}

// 新增流程
const handleAdd = () => {
    const index = configs.value.length + 1
    const id = `process-${Date.now()}`
    const defaultBot = botOptions.value[0]?.value ?? ''
    const defaultModel = modelOptions.value[0]?.value ?? ''

    const newProcess = {
        id,
        name: `新建流程 ${index}`,
        enabled: false,
        // 新增：新建流程默认使用 AI 自定义模板
        templateType: 'AITemplate',
        template: 'ai-custom',
        botId: defaultBot,
        modelId: defaultModel,
        triggerCommand: `/flow${index}`,
        codeInjection: '',
        role: '',
        image: '/src/assets/images/mouse.png',
    }

    configs.value.push(newProcess)
    handleSelect(id)
    ElMessage.success('已新增流程配置')
}

// 编辑流程
const handleEdit = (item) => {
    isDisabled.value = false
    ElMessage.success(`正在编辑「${item.name}」`)
}

// 删除流程
const handleDelete = (config) => {
    ElMessageBox.confirm(`确认删除「${config.name}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => {
            const index = configs.value.findIndex((item) => item.id === config.id)
            if (index !== -1) {
                configs.value.splice(index, 1)
                if (selectedId.value === config.id) {
                    selectedId.value = configs.value[0]?.id ?? ''
                    currentConfig.value = configs.value[0] ?? null
                }
                ElMessage.success('删除成功')
            }
        })
        .catch(() => {
        })
}

// 表单校验规则
const rules = ref({
    name: [
        {required: true, message: '名称不能为空！', trigger: 'blur'},
    ],
    // 新增：校验模板类型
    templateType: [
        {required: true, message: '请选择模板类型！', trigger: 'change'},
    ],
    template: [
        {required: true, message: '请选择流程模板！', trigger: 'change'},
    ],
    botId: [
        {required: true, message: '请选择机器人！', trigger: 'change'},
    ],
    modelId: [
        {required: true, message: '请选择模型！', trigger: 'change'},
    ],
    triggerCommand: [
        {required: true, message: '触发命令不能为空！', trigger: 'blur'},
        {
            validator: (rule, value, callback) => {
                if (!value) {
                    callback(new Error('触发命令不能为空！'))
                } else if (!value.startsWith('/')) {
                    callback(new Error('触发命令必须以 / 开头！'))
                } else {
                    callback()
                }
            },
            trigger: 'blur',
        },
    ],
})

// 新增：根据模板类型控制字段可见性与可编辑性
const isAiTemplate = computed(() => currentConfig.value?.templateType === 'AITemplate')
const isFunctionTemplate = computed(() => currentConfig.value?.templateType === 'functionTemplate')
const showTriggerField = computed(() => !isAiTemplate.value)
const showCodeField = computed(() => !isAiTemplate.value)
const showModelField = computed(() => !isFunctionTemplate.value)
const showRoleField = computed(() => isAiTemplate.value)
const isRoleEditable = computed(() => isAiTemplate.value && currentConfig.value?.template === 'ai-custom')
const isCodeEditable = computed(() => {
    if (isAiTemplate.value) return false
    if (isFunctionTemplate.value) {
        return currentConfig.value?.template === 'function-custom'
    }
    return true
})

// 新增：监听模板类型变化，同步模板值
watch(() => currentConfig.value?.templateType, (type) => {
    if (!currentConfig.value || !type) return
    const available = templateOptions.value[type] ?? []
    if (!available.find(item => item.value === currentConfig.value.template)) {
        currentConfig.value.template = available[0]?.value ?? ''
    }
})

// 保存表单
const submitForm = (formRef) => {
    if (!formRef) return
    formRef.validate((valid) => {
        if (valid) {
            isDisabled.value = true
            ElMessage.success('保存成功')
        } else {
            ElMessage.error('请检查表单输入是否正确！')
        }
    })
}

// 重置表单
const resetForm = (formRef) => {
    if (!formRef || !currentConfig.value) return
    formRef.resetFields()
    ElMessage.success('已重置表单')
}

onMounted(() => {
    getConfigs()

})
</script>

<template>
    <el-scrollbar>
        <div class="process-page">
            <el-card class="card">
                <div class="card-header">
                    <span class="decor"></span>
                    流程管理
                </div>
            </el-card>

            <el-card class="card">
                <div class="process-layout">
                    <!-- 左侧流程列表 -->
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
                                :class="['config-card', { active: selectedId === item.id }]"
                                @click="handleSelect(item.id)"
                            >
                                <div class="config-body">
                                    <el-image :src="item.image" fit="cover"/>
                                    <div class="config-content">
                                        <div class="config-name">{{ item.name }}</div>
                                        <!-- 新增：展示模板类型与名称 -->
                                        <div class="config-meta">
                                            <el-tag size="small">
                                                {{ getTemplateTypeLabel(item.templateType) }} / {{ getTemplateLabel(item.templateType, item.template) }}
                                            </el-tag>
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

                    <!-- 右侧流程详情 -->
                    <div class="details-panel">
                        <div class="panel-title">
                            <span class="decor"></span>
                            流程详情
                        </div>
                        <div v-if="currentConfig" class="detail-content">
                            <el-form
                                ref="configForm"
                                :model="currentConfig"
                                :rules="rules"
                                label-position="top"
                                label-width="96px"
                            >
                                <el-form-item label="名称" prop="name">
                                    <el-input
                                        v-model="currentConfig.name"
                                        :disabled="isDisabled"
                                        placeholder="请输入流程名称"
                                    />
                                </el-form-item>

                                <el-form-item label="开启">
                                    <el-switch
                                        v-model="currentConfig.enabled"
                                        :disabled="isDisabled"
                                        active-color="#67C23A"
                                        inactive-color="#909399"
                                    />
                                </el-form-item>

                                <!-- 新增：模板类型选择 -->
                                <el-form-item label="模板类型" prop="templateType">
                                    <el-select
                                        v-model="currentConfig.templateType"
                                        :disabled="isDisabled"
                                        placeholder="请选择模板类型"
                                    >
                                        <el-option
                                            v-for="item in templateTypeOptions"
                                            :key="item.value"
                                            :label="item.label"
                                            :value="item.value"
                                        />
                                    </el-select>
                                </el-form-item>

                                <!-- 新增：根据模板类型细分模板 -->
                                <el-form-item label="模板" prop="template">
                                    <el-select
                                        v-model="currentConfig.template"
                                        :disabled="isDisabled"
                                        placeholder="请选择流程模板"
                                    >
                                        <el-option
                                            v-for="item in currentTemplateOptions"
                                            :key="item.value"
                                            :label="item.label"
                                            :value="item.value"
                                        />
                                    </el-select>
                                </el-form-item>

                                <el-form-item label="机器人" prop="botId">
                                    <el-select
                                        v-model="currentConfig.botId"
                                        :disabled="isDisabled"
                                        placeholder="请选择机器人"
                                    >
                                        <el-option
                                            v-for="bot in botOptions"
                                            :key="bot.value"
                                            :label="bot.label"
                                            :value="bot.value"
                                        />
                                    </el-select>
                                </el-form-item>

                                <!-- 新增：功能模板隐藏模型配置 -->
                                <el-form-item v-if="showModelField" label="模型" prop="modelId">
                                    <el-select
                                        v-model="currentConfig.modelId"
                                        :disabled="isDisabled"
                                        placeholder="请选择模型"
                                    >
                                        <el-option
                                            v-for="model in modelOptions"
                                            :key="model.value"
                                            :label="model.label"
                                            :value="model.value"
                                        />
                                    </el-select>
                                </el-form-item>

                                <!-- 新增：AI 模板隐藏触发命令 -->
                                <el-form-item v-if="showTriggerField" label="触发命令" prop="triggerCommand">
                                    <el-input
                                        v-model="currentConfig.triggerCommand"
                                        :disabled="isDisabled"
                                        placeholder="请输入以 / 开头的命令"
                                    />
                                </el-form-item>

                                <!-- 新增：按模板类型控制代码注入展示与可编辑性 -->
                                <el-form-item v-if="showCodeField" label="代码注入">
                                    <el-input
                                        v-model="currentConfig.codeInjection"
                                        :autosize="{ minRows: 3 }"
                                        :disabled="isDisabled || !isCodeEditable"
                                        placeholder="请输入自定义代码"
                                        template="textarea"
                                    />
                                    <div v-if="isFunctionTemplate && currentConfig.template !== 'function-custom'" class="field-tip">
                                        仅自定义功能模板支持修改代码
                                    </div>
                                </el-form-item>

                                <!-- 新增：功能模板隐藏角色描述 -->
                                <el-form-item v-if="showRoleField" label="角色描述" prop="role">
                                    <el-input
                                        v-model="currentConfig.role"
                                        :disabled="isDisabled || !isRoleEditable"
                                        placeholder="请输入 AI 扮演角色"
                                        type="textarea"
                                    />
                                    <div v-if="isAiTemplate && currentConfig.template !== 'ai-custom'" class="field-tip">
                                        仅自定义角色模板支持修改角色描述
                                    </div>
                                </el-form-item>

                                <el-form-item>
                                    <el-button
                                        :disabled="isDisabled"
                                        type="primary"
                                        @click="submitForm(configForm)"
                                    >
                                        保存
                                    </el-button>
                                    <el-button
                                        :disabled="isDisabled"
                                        @click="resetForm(configForm)"
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
.process-page {
    margin-left: 100px;
    margin-right: 100px;
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

.card-header .decor,
.panel-title .decor {
    display: inline-block;
    width: 6px;
    height: 20px;
    background: rgb(51, 126, 204);
    border-radius: 3px;
    margin-right: 8px;
}

.process-layout {
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
}

.config-meta {
    display: flex;
    gap: 8px;
    align-items: center;
}

.config-actions {
    display: flex;
    gap: 8px;
}

.field-tip {
    margin-top: 6px;
    font-size: 12px;
    color: #909399;
}

.detail-content {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
}
</style>