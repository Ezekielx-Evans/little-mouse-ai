<script setup>

import {ElMessage, ElMessageBox} from 'element-plus'
import {Delete, Edit, Plus} from '@element-plus/icons-vue'
import {computed, ref, watch} from "vue";

const configs = ref([
    {
        id: 'bot-001',
        name: '客服助手',
        enabled: true,
        appId: 'APP-202401',
        appSecret: 'SECRET-58FJ2',
        token: 'TOKEN-91XZ3',
        image: new URL('@/assets/images/little-mouse.png', import.meta.url).href,
    },
    {
        id: 'bot-002',
        name: '销售助理',
        enabled: false,
        appId: '',
        appSecret: '',
        token: '',
        image: new URL('@/assets/images/little-mouse.png', import.meta.url).href,
    },
])

const selectedId = ref(configs.value[0]?.id ?? '')

const handleSelect = (id) => {
    selectedId.value = id
}

const handleAdd = () => {
    const index = configs.value.length + 1
    const id = `bot-${Date.now()}`
    const name = `机器人配置 ${index}`
    const image = new URL('@/assets/images/little-mouse.png', import.meta.url).href

    configs.value.push({
        id,
        name,
        enabled: true,
        appId: '',
        appSecret: '',
        token: '',
        image,
    })

    selectedId.value = id
    ElMessage.success('已新增机器人配置')
}

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

const handleEdit = (config) => {
    ElMessage.success(`「${config.name}」配置，保存成功`)
    selectedId.value = config.id
}

const currentConfig = computed(() => configs.value.find((item) => item.id === selectedId.value))

const generateCallbackUrl = (id) => `https://<网页地址>/bots/${id}/callback`

const callbackUrl = computed(() => (currentConfig.value ? generateCallbackUrl(currentConfig.value.id) : ''))

watch(
    () => currentConfig.value?.enabled,
    (val, oldVal) => {
        if (typeof val === 'boolean' && val !== oldVal && currentConfig.value) {
            ElMessage.success(`「${currentConfig.value.name}」已${val ? '开启' : '关闭'}`)
        }
    }
)

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
                            <el-form :model="currentConfig" label-position="top" label-width="96px">
                                <el-form-item label="名称">
                                    <el-input v-model="currentConfig.name" 请输入机器人名称/>
                                </el-form-item>
                                <el-form-item label="开启">
                                    <el-switch
                                        v-model="currentConfig.enabled"
                                        active-color="#67C23A"
                                        inactive-color="#909399"
                                    />
                                </el-form-item>
                                <el-form-item label="App ID">
                                    <el-input v-model="currentConfig.appId" placeholder="请输入 App ID"/>
                                </el-form-item>
                                <el-form-item label="App Secret">
                                    <el-input v-model="currentConfig.appSecret" placeholder="请输入 App Secret"/>
                                </el-form-item>
                                <el-form-item label="Token">
                                    <el-input v-model="currentConfig.token" placeholder="请输入 Token"/>
                                </el-form-item>
                                <el-form-item label="回调 URL">
                                    <el-input :model-value="callbackUrl" disabled/>
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
    gap: 24px;
}

.list-panel,
.details-panel {
    flex: 1;
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