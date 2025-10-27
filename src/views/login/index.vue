<script setup>
import {reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {ElMessage} from 'element-plus'
import {Lock, User} from '@element-plus/icons-vue'

const router = useRouter()
const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
    username: '',
    password: '',
})

const rules = {
    username: [
        {required: true, message: '请输入账号', trigger: 'blur'},
    ],
    password: [
        {required: true, message: '请输入密码', trigger: 'blur'},
    ],
}

const remember = ref(true)

const handleSubmit = async () => {
    if (!loginFormRef.value) return

    try {
        loading.value = true
        await loginFormRef.value.validate()

        // 模拟登录请求
        await new Promise(resolve => setTimeout(resolve, 600))

        ElMessage.success('登录成功')
        router.push('/')
    } catch (error) {
        // 表单校验失败时无需处理
    } finally {
        loading.value = false
    }
}

</script>

<template>
    <div class="login-page">
        <div class="background-gradient"></div>
        <div class="background-blur background-blur--left"></div>
        <div class="background-blur background-blur--right"></div>

        <el-card class="login-card" shadow="always">
            <div class="card-header">
                <div class="logo">Mouse AI</div>
                <div class="subtitle">登录你的智能运营控制台</div>
            </div>

            <el-form
                ref="loginFormRef"
                :model="loginForm"
                :rules="rules"
                label-position="top"
                class="login-form"
            >
                <el-form-item label="账号" prop="username">
                    <el-input
                        v-model="loginForm.username"
                        placeholder="请输入账号"
                        size="large"
                        @keyup.enter="handleSubmit"
                    >
                        <template #prefix>
                            <el-icon><User /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input
                        v-model="loginForm.password"
                        placeholder="请输入密码"
                        type="password"
                        show-password
                        size="large"
                        @keyup.enter="handleSubmit"
                    >
                        <template #prefix>
                            <el-icon><Lock /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
            </el-form>

            <div class="form-options">
                <el-checkbox v-model="remember">记住我</el-checkbox>
                <el-link type="primary" :underline="false">忘记密码？</el-link>
            </div>

            <el-button
                type="primary"
                size="large"
                round
                class="login-button"
                :loading="loading"
                @click="handleSubmit"
            >
                登录
            </el-button>

            <div class="helper-text">
                还没有账号？<el-link type="primary" :underline="false">申请试用</el-link>
            </div>
        </el-card>
    </div>
</template>

<style scoped>
.login-page {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f8ff 0%, #f0f4ff 48%, #f8fbff 100%);
    overflow: hidden;
    padding: 24px;
}

.background-gradient {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 20% 20%, rgba(58, 122, 254, 0.2), transparent 55%),
                radial-gradient(circle at 80% 0%, rgba(144, 202, 249, 0.25), transparent 50%),
                radial-gradient(circle at 50% 80%, rgba(105, 117, 255, 0.2), transparent 55%);
    filter: blur(0px);
    z-index: 1;
}

.background-blur {
    position: absolute;
    width: 360px;
    height: 360px;
    background: rgba(58, 122, 254, 0.18);
    filter: blur(120px);
    border-radius: 50%;
    z-index: 1;
}

.background-blur--left {
    top: 12%;
    left: -120px;
}

.background-blur--right {
    bottom: -80px;
    right: -90px;
}

.login-card {
    position: relative;
    z-index: 2;
    width: 420px;
    padding: 32px 36px 40px;
    border-radius: 24px;
    box-shadow: 0 30px 80px rgba(58, 122, 254, 0.18);
    border: none;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
}

.card-header {
    text-align: center;
    margin-bottom: 32px;
}

.logo {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #3155ff;
}

.subtitle {
    margin-top: 8px;
    color: #606266;
    font-size: 14px;
}

.login-form :deep(.el-form-item__label) {
    font-weight: 600;
    color: #1f2d3d;
}

.login-form :deep(.el-input__wrapper) {
    padding: 14px 16px;
    border-radius: 14px;
}

.form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 6px 0 18px;
    color: #909399;
}

.login-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    letter-spacing: 0.1em;
}

.helper-text {
    margin-top: 24px;
    text-align: center;
    color: #909399;
}

.helper-text :deep(.el-link) {
    font-weight: 600;
}

@media (max-width: 520px) {
    .login-card {
        width: 100%;
        padding: 28px 24px 32px;
    }
}
</style>
