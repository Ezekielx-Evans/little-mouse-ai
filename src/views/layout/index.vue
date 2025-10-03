<script setup>

import Sidebar from "@/views/layout/Sidebar.vue";

</script>

<template>
    <div class="common-layout">
        <el-container>

            <!-- 侧边栏 -->
            <el-aside class="sidebar" width="200px">
                <Sidebar></Sidebar>
            </el-aside>

            <el-container>

                <!-- 主页面 -->
                <el-main>
                    <RouterView></RouterView>
                </el-main>

            </el-container>
        </el-container>
    </div>
</template>

<style scoped>

.sidebar {
    height: 100vh;
    border-right: 1px solid var(--el-border-color);
}

</style>