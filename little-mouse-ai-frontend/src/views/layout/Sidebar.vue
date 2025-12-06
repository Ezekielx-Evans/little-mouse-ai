<script setup>
import HomeIcon from '@/icons/HomeIcon.vue'
import LogIcon from '@/icons/LogIcon.vue'
import QQIcon from '@/icons/QQIcon.vue'
import ModelIcon from '@/icons/ModelIcon.vue'
import ProcessIcon from '@/icons/ProcessIcon.vue'
import SettingIcon from '@/icons/SettingIcon.vue'
</script>

<template>
    <el-container>
        <!-- Logo + Title -->
        <el-header class="logo-title">
            <el-image class="logo" src="src/assets/images/little-mouse.png"/>
            <span class="title">Mouse AI</span>
        </el-header>
        <!-- Menu -->
        <el-main class="menu-area">
            <!-- default-active：默认激活菜单的 index -->
            <el-menu
                :default-active="$route.path"
                :router="true"
                class="custom-menu"
            >
                <!-- 首页 -->
                <el-menu-item index="/">
                    <HomeIcon></HomeIcon>
                    首页
                </el-menu-item>

                <!-- 请求记录 -->
                <el-menu-item index="/requests">
                    <LogIcon></LogIcon>
                    请求记录
                </el-menu-item>

                <!-- 机器人管理 -->
                <el-menu-item index="/bots">
                    <QQIcon></QQIcon>
                    机器人管理
                </el-menu-item>

                <!-- 大模型管理 -->
                <el-menu-item index="/models">
                    <ModelIcon></ModelIcon>
                    大模型管理
                </el-menu-item>

                <!-- 流程管理 -->
                <el-menu-item index="/processes">
                    <ProcessIcon></ProcessIcon>
                    流程管理
                </el-menu-item>

                <!-- 设置 -->
                <el-menu-item index="/settings">
                    <SettingIcon></SettingIcon>
                    设置
                </el-menu-item>

            </el-menu>
        </el-main>

    </el-container>
</template>

<style scoped>
.logo-title {
    display: flex;
    align-items: center;
    justify-content: start;
    height: 64px;
    border-bottom: 1px solid var(--el-border-color);
    width: 100%;
}

.logo {
    width: 36px;
    height: 36px;
    margin-right: 8px;
    display: flex;
}

.title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

.menu-area {
    padding: 0;
}

.custom-menu {
    border-right: none;
}

.custom-menu .el-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    height: 56px;
    border-radius: 8px;
    margin-top: 8px;
    margin-bottom: 8px;
    user-select: none
}

.icon {
    width: 30px;
    height: 30px;
    fill: currentColor;
}
</style>