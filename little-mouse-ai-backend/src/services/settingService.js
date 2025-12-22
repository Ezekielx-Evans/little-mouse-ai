import { readConfig, writeConfig } from '../utils/configStore.js'

/**
 * 获取当前设置（服务配置与密码配置）。
 */
export async function getSettingConfig() {
    const config = await readConfig()

    return {
        port: config.port,
        allowIp: config.allowIp,
        passwordIntervalMinutes: config.passwordIntervalMinutes
    }
}

/**
 * 更新服务配置（端口与允许访问的 IP）。
 */
export async function saveSettingConfig({ port, allowIp, passwordIntervalMinutes }) {
    const config = await readConfig()

    const nextConfig = {
        ...config,
        port,
        allowIp,
        passwordIntervalMinutes
    }

    await writeConfig(nextConfig)

    return {
        port: nextConfig.port,
        allowIp: nextConfig.allowIp,
        passwordIntervalMinutes: nextConfig.passwordIntervalMinutes
    }
}

/**
 * 修改密码。
 * 修改密码后强制让登录会话失效
 */
export async function updateSettingData({ password }) {
    const config = await readConfig()

    const nextConfig = {
        ...config,
        password,
        lastVerifiedAt: undefined // 强制重新登录
    }

    await writeConfig(nextConfig)
}
