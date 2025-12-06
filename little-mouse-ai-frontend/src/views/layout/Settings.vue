<script setup>

import {ElMessage} from 'element-plus'
import {onMounted, ref} from 'vue'

// 服务配置和密码管理的表单实例
const serviceForm = ref()
const passwordForm = ref()

// 当前服务配置和密码
const currentService = ref({
    port: '',
    allowIp: '',
})
const currentPassword = ref({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
})

// 获取服务配置和密码
const getCurrentService = () => {
    currentService.value.port = '5173'
    currentService.value.allowIp = '0.0.0.0'
}

// 保存表单与重置表单
const submitServiceForm = (formRef) => {
    if (!formRef) return
    formRef.validate((valid) => {
        if (valid) {
            ElMessage.success('保存成功')
        } else {
            ElMessage.error('请检查表单输入是否正确！')
        }
    })
}
const resetServiceForm = (formRef) => {
    if (!formRef || !currentService.value) return
    formRef.resetFields()
    ElMessage.success('已重置表单')
}

const submitPasswordForm = (formRef) => {
    if (!formRef) return
    formRef.validate((valid) => {
        if (valid) {
            ElMessage.success('保存成功')
        } else {
            ElMessage.error('请检查表单输入是否正确！')
        }
    })
}
const resetPasswordForm = (formRef) => {
    if (!formRef || !currentPassword.value) return
    formRef.resetFields()
    ElMessage.success('已重置表单')
}

// 表单验证规则
const serviceRules = {
    port: [
        {required: true, message: '请输入服务端口', trigger: 'blur'},
        {
            validator: (rule, value, callback) => {
                const portNumber = Number(value)
                if (!Number.isInteger(portNumber)) {
                    callback(new Error('端口必须为整数'))
                } else if (portNumber < 1 || portNumber > 65535) {
                    callback(new Error('端口范围为 1-65535'))
                } else {
                    callback()
                }
            },
            trigger: 'blur',
        },
    ],
    allowIp: [
        {required: true, message: '请输入允许访问的 IP', trigger: 'blur'},
        {
            validator: (rule, value, callback) => {
                const ipv4Pattern = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
                if (!value) {
                    callback(new Error('允许访问的 IP 不能为空'))
                } else if (value !== '0.0.0.0' && !ipv4Pattern.test(value)) {
                    callback(new Error('请输入合法的 IPv4 地址，或 0.0.0.0 代表全部'))
                } else {
                    callback()
                }
            },
            trigger: 'blur',
        },
    ],
}
const passwordRules = {
    oldPassword: [
        {required: true, message: '请输入当前密码', trigger: 'blur'},
        {min: 6, message: '密码长度至少 6 位', trigger: 'blur'},
    ],
    newPassword: [
        {required: true, message: '请输入新密码', trigger: 'blur'},
        {min: 6, message: '密码长度至少 6 位', trigger: 'blur'},
        {
            validator: (rule, value, callback) => {
                if (!value) {
                    callback(new Error('请再次输入新密码'))
                } else if (currentPassword.value.confirmPassword !== '') {
                    passwordForm.value.validateField('confirmPassword')
                } else {
                    callback()
                }
            },
            trigger: 'blur',
        }
    ],
    confirmPassword: [
        {required: true, message: '请再次输入新密码', trigger: 'blur'},
        {min: 6, message: '密码长度至少 6 位', trigger: 'blur'},
        {
            validator: (rule, value, callback) => {
                if (!value) {
                    callback(new Error('请再次输入新密码'))
                } else if (value !== currentPassword.value.newPassword) {
                    callback(new Error('两次输入的密码不一致'))
                } else {
                    callback()
                }
            },
            trigger: 'blur',
        },
    ],
}

onMounted(() => {
    getCurrentService();
})

</script>

<template>
    <el-scrollbar>
        <div class="settings-page">

            <!-- 系统设置卡片 -->
            <el-card class="card">
                <div class="card-header">
                    <span class="decor"></span>
                    系统设置
                </div>
            </el-card>

            <!-- 服务配置卡片 -->
            <el-card class="card">
                <template #header>
                    <div class="card-title">
                        <span class="decor"></span>
                        服务配置
                    </div>
                </template>
                <el-form
                    ref="serviceForm"
                    :model="currentService"
                    :rules="serviceRules"
                    class="settings-form"
                    label-position="top"
                >
                    <el-form-item label="运行端口" prop="port">
                        <el-input v-model="currentService.port" placeholder="请输入运行端口"/>
                    </el-form-item>
                    <el-form-item label="允许访问的 IP" prop="allowIp">
                        <el-input v-model="currentService.allowIp" placeholder="例如：0.0.0.0"/>
                        <p class="form-tip">填写 0.0.0.0 即允许所有来源访问。</p>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="submitServiceForm">
                            保存配置
                        </el-button>
                        <el-button @click="resetServiceForm">
                            重置
                        </el-button>
                    </el-form-item>
                </el-form>
            </el-card>

            <el-card class="card">
                <template #header>
                    <div class="card-title">
                        <span class="decor"></span>
                        密码修改
                    </div>
                </template>
                <el-form
                    ref="passwordForm"
                    :model="currentPassword"
                    :rules="passwordRules"
                    class="settings-form"
                    label-position="top"
                >
                    <el-form-item label="当前密码" prop="oldPassword">
                        <el-input v-model="currentPassword.oldPassword" placeholder="请输入当前密码"
                                  show-password/>
                    </el-form-item>
                    <el-form-item label="新密码" prop="newPassword">
                        <el-input v-model="currentPassword.newPassword" placeholder="请输入新密码"
                                  show-password/>
                    </el-form-item>
                    <el-form-item label="确认新密码" prop="confirmPassword">
                        <el-input v-model="currentPassword.confirmPassword" placeholder="请再次输入新密码"
                                  show-password/>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="submitPasswordForm">
                            确认修改
                        </el-button>
                        <el-button @click="resetPasswordForm">
                            清空
                        </el-button>
                    </el-form-item>
                </el-form>
            </el-card>
        </div>
    </el-scrollbar>
</template>

<style scoped>
.settings-page {
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

.card-header,
.card-title {
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

.settings-form {
    max-width: 520px;
}

.form-tip {
    margin: 8px 0 0;
    color: #909399;
    font-size: 12px;
}
</style>