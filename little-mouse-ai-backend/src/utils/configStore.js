import fs from 'fs/promises'
import path from 'path'

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json')

const DEFAULT_SETTINGS = {
    port: 3000,
    allowIp: '0.0.0.0',
    password: '123456',
    passwordIntervalMinutes: 30,
    lastVerifiedAt: undefined
}

export async function readConfig() {
    try {
        const content = await fs.readFile(CONFIG_PATH, 'utf-8')
        const savedConfig = JSON.parse(content)

        // 清洗 null，避免覆盖默认逻辑
        if (savedConfig.lastVerifiedAt === null) {
            delete savedConfig.lastVerifiedAt
        }

        return { ...DEFAULT_SETTINGS, ...savedConfig }
    } catch {
        return { ...DEFAULT_SETTINGS }
    }
}

export async function writeConfig(config) {
    await fs.writeFile(
        CONFIG_PATH,
        JSON.stringify(config, null, 2),
        'utf-8'
    )
}
