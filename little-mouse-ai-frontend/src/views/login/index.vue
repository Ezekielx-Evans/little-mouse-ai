<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import { verifyLoginPassword } from '@/api/loginApi.js'

const router = useRouter()
const loginFormRef = ref()

const loginForm = ref({
    password: '',
})

const rules = {
    password: [
        { required: true, message: '密码不能为空！', trigger: 'blur' },
        { min: 6, message: '密码长度至少 6 位', trigger: 'blur' },
    ],
}

const handleSubmit = (formRef) => {
    if (!formRef) return

    formRef.validate(async (valid) => {
        if (!valid) return

        try {
            const res = await verifyLoginPassword(loginForm.value.password)

            if (res.success) {
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
    ElMessageBox.alert(
        '默认密码：123456<br>密码储存在 little-mouse-ai-backend/config.json<br>重置密码可将配置文件中 password 字段删除',
        {
            dangerouslyUseHTMLString: true,
        }
    )
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
                @submit.prevent="handleSubmit(loginFormRef)"
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
                                <Lock />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
            </el-form>

            <div class="form-options">
                <el-link
                    :underline="false"
                    type="primary"
                    @click="handleForgotPassword"
                >
                    忘记密码？
                </el-link>
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
    background:
        radial-gradient(circle at 20% 20%, rgba(58, 122, 254, 0.2), transparent 55%),
        radial-gradient(circle at 80% 0%, rgba(144, 202, 249, 0.25), transparent 50%),
        radial-gradient(circle at 50% 80%, rgba(105, 117, 255, 0.2), transparent 55%);
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
    justify-content: flex-end;
    margin: 18px 0;
    color: #909399;
}

.login-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    letter-spacing: 0.1em;
}
</style>