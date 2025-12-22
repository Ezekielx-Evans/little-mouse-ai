import {readConfig, writeConfig} from "../utils/configStore.js";

export async function verifyLoginSession() {
    const config = await readConfig()

    if (!config.lastVerifiedAt) return false

    const now = Date.now()
    const last = new Date(config.lastVerifiedAt).getTime()

    return now - last < config.passwordIntervalMinutes * 60 * 1000
}

/**
 * 登录：验证密码并建立登录会话
 */
export async function verifyLoginPassword(password) {
    const config = await readConfig()

    // 校验密码
    if (!password || password !== config.password) {
        return false
    }

    // 记录本次验证时间（建立登录态）
    config.lastVerifiedAt = new Date().toISOString()
    await writeConfig(config)

    return true
}