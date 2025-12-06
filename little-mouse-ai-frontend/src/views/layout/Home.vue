<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {getSystemInfo} from '@/api/systemApi.js'

// 定义展示数据
const systemInfo = ref([])
const systemLoad = ref([])
const llmStats = ref([
    {label: '请求总数', value: '12,843'},
    {label: '成功率', value: '98.4%'},
    {label: 'Token 消耗', value: '1.2M'},
])

// 定义第一次获取数据时的加载状态
const loading = ref(true)

// 定义定时器
let timer = null

onMounted(() => {
    // 进入页面加载一次数据
    loadData()
    // 每 4 秒加载一次
    timer = setInterval(loadData, 3000)
})

onBeforeUnmount(() => {
    // 切换页面时销毁定时器，防止内存泄漏
    clearInterval(timer)
})

async function loadData() {
    const data = await getSystemInfo()

    systemInfo.value = [
        {label: '版本', value: data.version},
        {label: '操作系统', value: data.platform},
        {label: 'Node.js 版本', value: data.nodeVersion},
        {label: 'CPU 型号', value: data.cpuName},
    ]

    systemLoad.value = [
        {
            label: 'CPU',
            value: getUsedCpuCores(data.cpuUsagePerCore),
            total: data.cpuUsagePerCore.length,
            unit: '核',
            percent: getCpuAverage(data.cpuUsagePerCore),
        },
        {
            label: '内存',
            value: (data.memory.totalGB - data.memory.freeGB).toFixed(2),
            total: data.memory.totalGB,
            unit: 'GB',
            percent: getMemoryUsage(data.memory),
        },
        {
            label: '存储',
            value: data.storage.usedGB.toFixed(2),
            total: data.storage.totalGB,
            unit: 'GB',
            percent: Number(data.storage.capacity.replace('%', '')),
        },
    ]

    // 第一次加载完成后关闭 loading
    if (loading.value) loading.value = false
}

// 计算已使用的 CPU 核数
function getUsedCpuCores(list) {
    // 平均使用率 %
    const avgPercent = getCpuAverage(list)
    // 核心数
    const coreCount = list.length
    return Number((avgPercent / 100 * coreCount).toFixed(2))
}

// 计算 CPU 平均占用率
function getCpuAverage(cpuList) {
    if (!cpuList?.length) return 0
    const sum = cpuList.reduce((total, current) => total + current.usage, 0)
    return Number((sum / cpuList.length).toFixed(0))
}

// 计算内存使用率
function getMemoryUsage(memory) {
    const used = memory.totalGB - memory.freeGB
    return Number(((used / memory.totalGB) * 100).toFixed(0))
}
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
            <el-card v-loading="loading" class="card">
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
                        :md="6"
                        :sm="12"
                        :xs="24"
                    >
                        <div class="info-card">
                            <div class="info-label">{{ item.label }}</div>
                            <div class="info-value">{{ item.value }}</div>
                        </div>
                    </el-col>
                </el-row>
            </el-card>

            <!-- 系统负荷卡片 -->
            <el-card v-loading="loading" class="card">
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
                        :md="8"
                        :sm="12"
                        :xs="24"
                        class="load-card"
                    >
                        <el-progress
                            :percentage="item.percent"
                            :stroke-width="8"
                            :width="140"
                            color="#3a7afe"
                            type="circle"
                        >
                            <span class="percentage-value">{{ item.percent }}%</span>
                            <span class="percentage-label">{{ item.label }}</span>
                        </el-progress>
                        <div class="load-label">{{ item.value }} {{ item.unit }} / {{ item.total }} {{
                                item.unit
                            }}
                        </div>
                    </el-col>
                </el-row>
            </el-card>

            <!-- LLM 统计卡片 -->
            <el-card v-loading="loading" class="card">
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
                        :md="8"
                        :sm="12"
                        :xs="24"
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
    user-select: none
}

.info-card {
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 16px;
    text-align: center;
}

.info-label {
    font-size: 16px;
    color: #606266;
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
    color: #606266;
}

.percentage-value {
    display: block;
    margin-top: 10px;
    font-size: 28px;
}

.percentage-label {
    display: block;
    margin-top: 10px;
    font-size: 12px;
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
    color: #606266;
    margin-bottom: 6px;
}

.stat-value {
    font-size: 20px;
    font-weight: 700;
    color: #409EFF;
}
</style>
