import fs from 'fs'
import os from 'os'
import { execSync } from 'child_process'

/**
 * 获取项目版本号
 * @returns {string}
 */
const getProjectVersion = () => {
    try {
        const packageJsonPath = new URL('../../package.json', import.meta.url)
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
        return packageJson.version ?? '1.0.0'
    } catch (error) {
        return '1.0.0'
    }
}

const projectVersion = getProjectVersion()

/**
 * 获取 "Hello World !" 的示例数据
 * @returns {string}
 */
export const getHelloMessage = () => {
    return 'Hello World !'
}

/**
 * 将字节转换为 GB
 * @param {number} bytes 原始字节数
 * @returns {number}
 */
const bytesToGB = (bytes) => {
    return bytes / 1024 / 1024 / 1024
}

/**
 * 保留指定小数位的数值，返回数值类型便于后续计算和展示
 * @param {number} value 原始数值
 * @param {number} fractionDigits 需要保留的小数位
 * @returns {number}
 */
const formatNumber = (value, fractionDigits = 1) => {
    return Number(value.toFixed(fractionDigits))
}

/**
 * 读取根目录的磁盘使用情况
 * @returns {{ total: number, used: number } | null}
 */
const readDiskStats = () => {
    try {
        const output = execSync('df -k /').toString().trim().split('\n')
        if (output.length < 2) {
            return null
        }

        const columns = output[output.length - 1].split(/\s+/)
        const total = Number(columns[1]) * 1024
        const used = Number(columns[2]) * 1024

        return {
            total,
            used,
        }
    } catch (error) {
        return null
    }
}

/**
 * 获取首页概览所需的系统信息
 * @returns {{ overview: Array, load: Array, generatedAt: string }}
 */
export const getSystemDashboardData = () => {
    const osInfo = `${os.type()} ${os.release()}`
    const uptimeHours = formatNumber(os.uptime() / 3600, 1)

    const cpuCores = Math.max(os.cpus().length, 1)
    const cpuLoad = os.loadavg()[0] / cpuCores
    const cpuPercentage = Math.min(100, Math.max(0, formatNumber(cpuLoad * 100, 2)))

    const totalMemoryGB = bytesToGB(os.totalmem())
    const usedMemoryGB = totalMemoryGB - bytesToGB(os.freemem())
    const memoryPercentage = totalMemoryGB > 0
        ? Math.min(100, Math.max(0, formatNumber((usedMemoryGB / totalMemoryGB) * 100, 2)))
        : 0

    const diskStats = readDiskStats()
    const totalDiskGB = diskStats ? bytesToGB(diskStats.total) : 0
    const usedDiskGB = diskStats ? bytesToGB(diskStats.used) : 0
    const diskPercentage = totalDiskGB > 0
        ? Math.min(100, Math.max(0, formatNumber((usedDiskGB / totalDiskGB) * 100, 2)))
        : 0

    return {
        overview: [
            { label: 'Mouse AI', value: `v${projectVersion}` },
            { label: '操作系统', value: osInfo },
            { label: 'Node.js 版本', value: process.version },
            { label: '系统已运行 (小时)', value: uptimeHours },
        ],
        load: [
            {
                label: 'CPU',
                percentage: cpuPercentage,
                used: cpuPercentage,
                total: 100,
                unit: '%',
            },
            {
                label: '内存',
                percentage: memoryPercentage,
                used: formatNumber(usedMemoryGB, 1),
                total: formatNumber(totalMemoryGB, 1),
                unit: 'GB',
            },
            {
                label: '存储',
                percentage: diskPercentage,
                used: formatNumber(usedDiskGB, 1),
                total: formatNumber(totalDiskGB, 1),
                unit: 'GB',
            },
        ],
        generatedAt: new Date().toISOString(),
    }
}
