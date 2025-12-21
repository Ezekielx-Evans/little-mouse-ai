import fs from 'fs/promises'
import path from 'path'

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json')

const DEFAULT_SETTINGS = {
    port: 3000,
    allowIp: '0.0.0.0',
    password: '123456',
    passwordIntervalMinutes: 30
}

const readConfig = async () => {
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

const writeConfig = async (config) => {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * 获取当前设置（服务配置与密码配置）。
 */
export const getSettings = async () => {
    const config = await readConfig()

    return {
        port: config.port,
        allowIp: config.allowIp
    }
}

/**
 * 更新服务配置（端口与允许访问的 IP）。
 *
 * @param {Object} data
 * @param {number} data.port 运行端口
 * @param {string} data.allowIp 允许访问的 IP
 */
export const updateServiceConfig = async ({port, allowIp}) => {
    const config = await readConfig()

    const nextConfig = {
        ...config,
        port,
        allowIp
    }

    await writeConfig(nextConfig)

    return {
        port: nextConfig.port,
        allowIp: nextConfig.allowIp
    }
}

/**
 * 修改密码。
 *
 * @param {Object} data
 * @param {string} data.password 新密码
 */
export const updatePassword = async ({password}) => {
    const config = await readConfig()

    if (!password) {
        throw new Error('新密码不能为空')
    }

    const nextConfig = {
        ...config,
        password
    }

    await writeConfig(nextConfig)
}
