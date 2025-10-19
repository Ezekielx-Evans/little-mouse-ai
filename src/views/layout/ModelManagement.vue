<script setup>
import {Delete, Edit, Plus} from '@element-plus/icons-vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {onMounted, ref} from "vue"

// 配置文件列表
const configs = ref([])

// 获取配置文件
const getConfigs = () => {
    configs.value.push(
        {
            id: 'model-001',
            name: '测试模型1',
            enabled: true,
            baseUrl: 'https://api.deepseek.com/v1',
            apiKey: 'sk-15c040979d3e4b26abae62b09d3adfd5',
            model: 'deepseek-chat',
            image: '/src/assets/images/deepseek.png',
        },
        {
            id: 'model-002',
            name: '测试模型2',
            enabled: false,
            baseUrl: 'https://api.deepseek.com/v1',
            apiKey: '',
            model: 'deepseek-reasoner',
            image: '/src/assets/images/deepseek.png',
        },
    )
}

// 当前选中的配置ID
const selectedId = ref(configs.value[0]?.id ?? '')

// 当前选中的配置文件
const currentConfig = ref()

// 是否允许编辑配置
const isDisabled = ref(true)

// 选择其他配置
const handleSelect = (id) => {
    selectedId.value = id
    isDisabled.value = true
    currentConfig.value = configs.value.find(item => item.id === id)
}

// 添加配置
const handleAdd = () => {
    const index = configs.value.length + 1
    const id = `model-${Date.now()}`
    const name = `模型配置 ${index}`
    const image = '/src/assets/images/deepseek.png'

    configs.value.push({
        id,
        name,
        enabled: false,
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: '',
        model: 'deepseek-chat',
        image,
    })

    handleSelect(id)
    ElMessage.success('已新增模型配置')
}

// 编辑配置
const handleEdit = (item) => {
    isDisabled.value = false
    ElMessage.success(`正在编辑「${item.name}」`)
}

// 删除配置
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

// 表单实例
const configForm = ref()

// 表单校验规则
const rules = ref({
    name: [
        {required: true, message: '名称不能为空！', trigger: 'blur'},
    ],
    baseUrl: [
        {required: true, message: 'Base URL 不能为空！', trigger: 'blur'},
    ],
    apiKey: [
        {required: true, message: 'API Key 不能为空！', trigger: 'blur'},
        {
            validator: (rule, value, callback) => {
                // 格式：sk-开头 + 字母数字组合
                const reg = /^sk-[A-Za-z0-9]+$/
                if (!value) {
                    callback(new Error('API Key 不能为空！'))
                } else if (!reg.test(value)) {
                    callback(new Error('API Key 必须以 sk- 开头，后面为 32 位字母数字组合！'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
    model: [
        {required: true, message: '请选择模型！', trigger: 'change'}
    ]
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
        <div class="model-page">
            <el-card class="card">
                <div class="card-header">
                    <span class="decor"></span>
                    配置
                </div>
            </el-card>

            <el-card class="card">
                <div class="model-layout">
                    <!-- 左侧配置列表 -->
                    <div class="list-panel">
                        <div class="panel-header">
                            <div class="panel-title">
                                <span class="decor"></span>
                                模型列表
                            </div>
                            <el-button :icon="Plus" plain type="primary" @click="handleAdd">新增模型</el-button>
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
                                        <el-tag :type="item.enabled ? 'success' : 'info'" size="small">
                                            {{ item.enabled ? '运行中' : '已停用' }}
                                        </el-tag>
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

                    <!-- 右侧详细配置 -->
                    <div class="details-panel">
                        <div class="panel-title">
                            <span class="decor"></span>
                            模型详情
                        </div>
                        <div v-if="currentConfig" class="detail-content">
                            <el-form ref="configForm" :model="currentConfig" :rules="rules" label-position="top"
                                     label-width="96px">
                                <el-form-item label="名称" prop="name">
                                    <el-input v-model="currentConfig.name" :disabled="isDisabled"
                                              placeholder="请输入模型名称"/>
                                </el-form-item>

                                <el-form-item label="开启">
                                    <el-switch
                                        v-model="currentConfig.enabled"
                                        :disabled="isDisabled"
                                        active-color="#67C23A"
                                        inactive-color="#909399"
                                    />
                                </el-form-item>

                                <el-form-item label="Base URL" prop="baseUrl">
                                    <el-input v-model="currentConfig.baseUrl" :disabled="true"
                                              placeholder="请输入 Base URL"/>
                                </el-form-item>

                                <el-form-item label="API Key" prop="apiKey">
                                    <el-input v-model="currentConfig.apiKey" :disabled="isDisabled"
                                              placeholder="请输入 API Key"/>
                                </el-form-item>

                                <el-form-item label="模型" prop="model">
                                    <el-select v-model="currentConfig.model" :disabled="isDisabled"
                                               placeholder="请选择模型">
                                        <el-option label="deepseek-chat" value="deepseek-chat"/>
                                        <el-option label="deepseek-reasoner" value="deepseek-reasoner"/>
                                    </el-select>
                                </el-form-item>

                                <el-form-item>
                                    <el-button :disabled="isDisabled" type="primary" @click="submitForm(configForm)">
                                        保存
                                    </el-button>
                                    <el-button :disabled="isDisabled" @click="resetForm(configForm)">
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

.config-actions {
    display: flex;
    gap: 8px;
}
</style>
