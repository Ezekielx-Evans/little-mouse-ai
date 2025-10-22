<script setup>
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
                    ref="serviceFormRef"
                    :model="serviceForm"
                    :rules="serviceRules"
                    class="settings-form"
                    label-position="top"
                >
                    <el-form-item label="运行端口" prop="port">
                        <el-input v-model="serviceForm.port" placeholder="请输入运行端口"/>
                    </el-form-item>
                    <el-form-item label="允许访问的 IP" prop="allowIp">
                        <el-input v-model="serviceForm.allowIp" placeholder="例如：0.0.0.0"/>
                        <p class="form-tip">填写 0.0.0.0 即允许所有来源访问。</p>
                    </el-form-item>
                    <el-form-item>
                        <el-button :loading="serviceLoading" type="primary" @click="handleServiceSubmit">
                            保存配置
                        </el-button>
                        <el-button :disabled="serviceLoading" @click="handleServiceReset">
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
                    ref="passwordFormRef"
                    :model="passwordForm"
                    :rules="passwordRules"
                    class="settings-form"
                    label-position="top"
                >
                    <el-form-item label="当前密码" prop="oldPassword">
                        <el-input v-model="passwordForm.oldPassword" placeholder="请输入当前密码"
                                  show-password/>
                    </el-form-item>
                    <el-form-item label="新密码" prop="newPassword">
                        <el-input v-model="passwordForm.newPassword" placeholder="请输入新密码"
                                  show-password/>
                    </el-form-item>
                    <el-form-item label="确认新密码" prop="confirmPassword">
                        <el-input v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码"
                                  show-password/>
                    </el-form-item>
                    <el-form-item>
                        <el-button :loading="passwordLoading" type="primary" @click="handlePasswordSubmit">
                            确认修改
                        </el-button>
                        <el-button :disabled="passwordLoading" @click="handlePasswordReset">
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
    margin-left: 100px;
    margin-right: 100px;
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