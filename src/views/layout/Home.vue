<script setup>

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
