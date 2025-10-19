<script setup>

import {Delete, Edit, Plus} from '@element-plus/icons-vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {computed, onMounted, ref} from "vue";

// 配置文件列表
const configs = ref([])

// 获取配置文件
const getConfigs = () => {
    configs.value.push({
            id: 'bot-001',
            name: '客服助手',
            enabled: true,
            appId: 'APP-202401',
            appSecret: 'SECRET-58FJ2',
            token: 'TOKEN-91XZ3',
            sandbox: true,
            image: '/src/assets/images/little-mouse.png',
        },
        {
            id: 'bot-002',
            name: '销售助理',
            enabled: false,
            appId: '',
            appSecret: '',
            token: '',
            sandbox: true,
            image: '/src/assets/images/little-mouse.png',
        },)
}


// 当前选中的配置ID
const selectedId = ref(configs.value[0]?.id ?? '')

// 当前选中的配置文件
const currentConfig = ref()

// 选择其他配置时的行为
const handleSelect = (id) => {
    selectedId.value = id
    isDisabled.value = true
    currentConfig.value = configs.value.find(item => item.id === id)
}

// 添加配置时的行为
const handleAdd = () => {
    const index = configs.value.length + 1
    const id = `bot-${Date.now()}`
    const name = `机器人配置 ${index}`
    const image = '/src/assets/images/little-mouse.png'

    configs.value.push({
        id,
        name,
        enabled: false,
        appId: '',
        appSecret: '',
        token: '',
        sandbox: true,
        image,
    })

    handleSelect(id)
    ElMessage.success('已新增机器人配置')
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
        .then(() => {
            const index = configs.value.findIndex((item) => item.id === config.id)
            if (index !== -1) {
                configs.value.splice(index, 1)
                if (selectedId.value === config.id) {
                    selectedId.value = configs.value[0]?.id ?? ''
                }
                ElMessage.success('删除成功')
            }
        })
        .catch(() => {
        })
}

// 是否允许编辑配置
const isDisabled = ref(true)

// 生成回调地址的函数
const generateCallbackUrl = (id) => `https://<网页地址>/bots/${id}/callback`

// 实时更新回调地址，如果没有则调用生成函数
const callbackUrl = computed(() => (currentConfig.value ? generateCallbackUrl(currentConfig.value.id) : ''))

// 表单实例
const configForm = ref()

// 表单校验规则
const rules = ref({
    name: [
        { required: true, message: '名称不能为空！', trigger: 'blur' },
    ],
    appId: [
        { required: true, message: 'App ID 不能为空！', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                const reg = /^[0-9]+$/; // 纯数字
                if (!value) {
                    callback(new Error('App ID 不能为空！'))
                } else if (!reg.test(value)) {
                    callback(new Error('App ID 为纯数字！'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
    appSecret: [
        { required: true, message: 'App Secret 不能为空！', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                const reg = /^[A-Za-z0-9]{32}$/; // 32位字母数字
                if (!value) {
                    callback(new Error('App Secret 不能为空！'))
                } else if (!reg.test(value)) {
                    callback(new Error('App Secret 为32位字母数字组合！'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
    token: [
        { required: true, message: 'Token 不能为空！', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                const reg = /^[A-Za-z0-9]{32}$/; // 32位字母数字
                if (!value) {
                    callback(new Error('Token 不能为空！'))
                } else if (!reg.test(value)) {
                    callback(new Error('Token 为32位字母数字组合！'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
})


onMounted(() => {
    getConfigs()
})

</script>

<template>
    <el-scrollbar>

        <!-- 页面标题 -->
        <div class="bot-page">
            <el-card class="card">
                <div class="card-header">
                    <span class="decor"></span>
                    配置
                </div>
            </el-card>

            <!-- 配置信息卡片 -->
            <el-card class="card">
                <div class="bot-layout">

                    <!-- 左侧配置列表 -->
                    <div class="list-panel">

                        <!-- 头部信息 -->
                        <div class="panel-header">
                            <!-- 标题 -->
                            <div class="panel-title">
                                <span class="decor"></span>
                                配置列表
                            </div>
                            <!-- 添加配置按钮  -->
                            <el-button :icon="Plus" plain type="primary" @click="handleAdd">新增配置</el-button>
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
                            配置详情
                        </div>
                        <div v-if="currentConfig" class="detail-content">
                            <el-form ref="configForm" :model="currentConfig" :rules="rules" label-position="top"
                                     label-width="96px">
                                <!-- 机器人名称 -->
                                <el-form-item label="名称" prop="name">
                                    <el-input v-model="currentConfig.name" :disabled="isDisabled"
                                              placeholder="请输入机器人名称"/>
                                </el-form-item>

                                <!-- 开启按钮 -->
                                <el-form-item label="开启">
                                    <el-switch
                                        v-model="currentConfig.enabled"
                                        :disabled="isDisabled"
                                        active-color="#67C23A"
                                        inactive-color="#909399"
                                    />
                                </el-form-item>

                                <!-- App ID -->
                                <el-form-item label="App ID" prop="appId">
                                    <el-input v-model="currentConfig.appId" :disabled="isDisabled"
                                              placeholder="请输入 App ID"/>
                                </el-form-item>

                                <!-- App Secret -->
                                <el-form-item label="App Secret" prop="appSecret">
                                    <el-input v-model="currentConfig.appSecret" :disabled="isDisabled"
                                              placeholder="请输入 App Secret"/>
                                </el-form-item>

                                <!-- Token -->
                                <el-form-item label="Token" prop="token">
                                    <el-input v-model="currentConfig.token" :disabled="isDisabled"
                                              placeholder="请输入 Token"/>
                                </el-form-item>

                                <!-- 沙盒环境 -->
                                <el-form-item label="沙盒环境">
                                    <el-switch
                                        v-model="currentConfig.sandbox"
                                        :disabled="isDisabled"
                                        active-color="#67C23A"
                                        inactive-color="#909399"
                                    />
                                </el-form-item>

                                <!-- 回调 URL -->
                                <el-form-item label="回调 URL">
                                    <el-input :model-value="callbackUrl" disabled/>
                                </el-form-item>

                                <!-- 保存与重置按钮 -->
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
.bot-page {
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

.bot-layout {
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