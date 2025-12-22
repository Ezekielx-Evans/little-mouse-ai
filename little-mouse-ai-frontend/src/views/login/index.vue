<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {ElMessage} from 'element-plus'
import {Lock} from '@element-plus/icons-vue'
import {verifyLoginPassword} from "@/api/loginApi.js";

const router = useRouter()
const loginFormRef = ref()
const remember = ref(false)

const PASSWORD_STORAGE_KEY = 'password'

const loginForm = ref({
    password: '',
})

const rules = {
    password: [
        {required: true, message: '密码不能为空！', trigger: 'blur'},
        {min: 6, message: '密码长度至少 6 位', trigger: 'blur'},
    ],
}

const rememberPassword = ref(true)

onMounted(() => {
    const savedPassword = localStorage.getItem(PASSWORD_STORAGE_KEY)

    if (savedPassword) {
        loginForm.value.password = savedPassword
        rememberPassword.value = true
    } else {
        rememberPassword.value = false
    }
})

const handleSubmit = (formRef) => {
    if (!formRef) return

    formRef.validate(async (valid) => {
        if (!valid) return

        try {
            const res = await verifyLoginPassword(loginForm.value.password)

            if (res.success) {
                if (rememberPassword.value) {
                    localStorage.setItem(PASSWORD_STORAGE_KEY, loginForm.value.password)
                } else {
                    localStorage.removeItem(PASSWORD_STORAGE_KEY)
                }

                ElMessage.success('登录成功')
                await router.push('/')
            } else {
                ElMessage.error(res.message || '密码错误！')
            }
        } catch (err) {
            ElMessage.error('密码错误！')
        }
    })
}

const handleForgotPassword = () => {
    remember.value = true
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
            </div>

            <el-form
                ref="loginFormRef"
                :model="loginForm"
                :rules="rules"
                class="login-form"
                label-position="top"
            >
                <el-form-item prop="password">
                    <el-input
                        v-model="loginForm.password"
                        placeholder="请输入密码"
                        show-password
                        size="large"
                        type="password"
                    >
                        <template #prefix>
                            <el-icon>
                                <Lock/>
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
            </el-form>

            <div class="form-options">
                <el-checkbox v-model="rememberPassword">记住我</el-checkbox>
                <el-link :underline="false" type="primary" @click="handleForgotPassword">忘记密码？</el-link>
            </div>

            <el-button
                class="login-button"
                round
                size="large"
                type="primary"
                @click="handleSubmit(loginFormRef)"
            >
                登录
            </el-button>

            <el-dialog
                v-model="remember"
                align-center
                class="forgot-dialog"
                title="忘记密码"
                width="420px"
            >
                <p class="forgot-dialog__text">默认密码：123456</p>
                <p class="forgot-dialog__text">忘记密码可在 little-mouse-ai-backend/config.json 的 password 字段查看</p>
                <template #footer>
                    <el-button type="primary" @click="remember = false">知道了</el-button>
                </template>
            </el-dialog>

        </el-card>
    </div>
</template>

<style scoped>
.login-page {
    position: relative;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f8ff 0%, #f0f4ff 48%, #f8fbff 100%);
    overflow: hidden;
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

.form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 18px 0 18px;
    color: #909399;
}

.login-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    letter-spacing: 0.1em;
}

.forgot-dialog__text {
    margin: 6px 0;
    color: #606266;
    line-height: 1.6;
}

</style>
