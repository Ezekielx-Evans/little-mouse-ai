<script setup>
const overviewMetrics = [
    {label: '在线模型', value: 4, hint: '运行中的模型实例'},
    {label: '活跃用户', value: 128, hint: '最近 24 小时'},
    {label: '今日请求', value: '3,942', hint: '累计调用次数'},
]

const systemInfo = [
    {label: 'Mouse AI', value: 'v1.2.0'},
    {label: '操作系统', value: 'Ubuntu 22.04 LTS'},
    {label: 'Node.js 版本', value: 'v18.17.0'},
]

const systemLoad = [
    {label: 'CPU', value: '35%', hint: '实时利用率'},
    {label: '内存', value: '61%', hint: '12 GB / 20 GB'},
    {label: '存储', value: '48%', hint: '960 GB / 2 TB'},
]

const llmStats = [
    {label: '请求总数', value: '12,845', hint: '累计调用量'},
    {label: '成功率', value: '99.2%', hint: '最近 7 天'},
    {label: 'Token 消耗', value: '184,320', hint: '本日总计'},
    {label: '平均响应时间', value: '842 ms', hint: 'P95 延迟 1.2 s'},
]
</script>

<template>

    <!-- 主体页面 -->
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
        </el-card>

        <!-- 系统负荷卡片 -->
        <el-card class="card">
            <template #header>
                <div class="card-header">
                    <span class="decor"></span>
                    系统负荷
                </div>
            </template>
        </el-card>

        <!-- LMM 统计卡片 -->
        <el-card class="card">
            <template #header>
                <div class="card-header">
                    <span class="decor"></span>
                    LLM 统计
                </div>
            </template>
        </el-card>

    </div>

</template>

<style scoped>

.home-page {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.card {
    border-radius: 20px;
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

</style>
