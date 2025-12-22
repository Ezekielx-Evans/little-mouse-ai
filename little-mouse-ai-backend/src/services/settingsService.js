import fs from 'fs/promises'
import path from 'path'

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json')

const DEFAULT_SETTINGS = {
    port: 3000,
    allowIp: '0.0.0.0',
    password: '123456',
    passwordIntervalMinutes: 30
}

async function readConfig() {
    try {
        const content = await fs.readFile(CONFIG_PATH, 'utf-8')
        const savedConfig = JSON.parse(content)

        if (savedConfig.lastVerifiedAt === null) {
            delete savedConfig.lastVerifiedAt
        }

        return {...DEFAULT_SETTINGS, ...savedConfig}
    } catch (err) {
        // 如果读取失败，使用默认配置
        return {...DEFAULT_SETTINGS}
    }
}

async function writeConfig(config) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

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
export async function saveSettingConfig({port, allowIp, passwordIntervalMinutes}) {
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
 */
export async function updateSettingData({password}) {
    const config = await readConfig()

    const nextConfig = {
        ...config,
        password
    }

    await writeConfig(nextConfig)
}
