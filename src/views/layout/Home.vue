<script setup>
import {ref} from 'vue'

const systemInfo = ref([
    {label: 'Mouse AI', value: 'v1.0.0'},
    {label: '操作系统', value: 'Ubuntu 22.04'},
    {label: 'node.js 版本', value: '20.18.0'},
])

const systemLoad = ref([
    {label: 'CPU', value: 56},
    {label: '内存', value: 68},
    {label: '存储', value: 44}
])

const llmStats = ref([
    {label: '请求总数', value: '12,843'},
    {label: '成功率', value: '98.4%'},
    {label: 'Token 消耗', value: '1.2M'},
    {label: '平均响应时间', value: '1.6s'}
])
</script>

<template>

    <!-- 主体页面 -->
    <el-scrollbar>
        <div class="home-page">

            <!-- 概览卡片 -->
            <el-card class="card">
                <div class="card-header">
                    <span class="decor"></span>
                    概览
                </div>
            </el-card>

            <!-- 系统信息卡片 -->
            <el-card class="card">
                <template #header>
                    <div class="card-header">
                        <span class="decor"></span>
                        系统信息
                    </div>
                </template>
                <el-row :gutter="16">
                    <el-col
                        v-for="item in systemInfo"
                        :key="item.label"
                        :md="8"
                        :sm="12"
                        :xs="12"
                    >
                        <div class="info-card">
                            <div class="info-label">{{ item.label }}</div>
                            <div class="info-value">{{ item.value }}</div>
                        </div>
                    </el-col>
                </el-row>
            </el-card>

            <!-- 系统负荷卡片 -->
            <el-card class="card">
                <template #header>
                    <div class="card-header">
                        <span class="decor"></span>
                        系统负荷
                    </div>
                </template>
                <el-row :gutter="24" justify="space-between">
                    <el-col
                        v-for="item in systemLoad"
                        :key="item.label"
                        :sm="8"
                        :xs="24"
                        class="load-card"
                    >
                        <el-progress
                            :percentage="item.value"
                            :stroke-width="14"
                            :width="140"
                            color="#3a7afe"
                            type="dashboard"
                        />
                        <div class="load-label">{{ item.label }}</div>
                    </el-col>
                </el-row>
            </el-card>

            <!-- LMM 统计卡片 -->
            <el-card class="card">
                <template #header>
                    <div class="card-header">
                        <span class="decor"></span>
                        LLM 统计
                    </div>
                </template>
                <el-row :gutter="16">
                    <el-col
                        v-for="item in llmStats"
                        :key="item.label"
                        :md="6"
                        :sm="12"
                        :xs="12"
                    >
                        <div class="stat-card">
                            <div class="stat-label">{{ item.label }}</div>
                            <div class="stat-value">{{ item.value }}</div>
                        </div>
                    </el-col>
                </el-row>
            </el-card>


        </div>
    </el-scrollbar>

</template>

<style scoped>

.home-page {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.card {
    --el-card-border-radius: 20px;
}

.card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.08em;
}

.card-header .decor {
    display: inline-block;
    width: 6px;
    height: 20px;
    background: rgb(51, 126, 204);
    border-radius: 3px;
    margin-right: 8px;
}

.info-card {
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 16px;
    text-align: center;
}

.info-label {
    font-size: 16px;
    color: #6b7280;
    margin-bottom: 6px;
}

.info-value {
    font-size: 18px;
    font-weight: 600;
    color: #409EFF;
}

.load-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 16px 0;
}

.load-label {
    font-weight: 600;
    color: #111827;
}

.stat-card {
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 16px;
    background-color: #fff;
    text-align: center;
}

.stat-label {
    font-size: 16px;
    color: #6b7280;
    margin-bottom: 6px;
}

.stat-value {
    font-size: 20px;
    font-weight: 700;
    color: #409EFF;
}
</style>
