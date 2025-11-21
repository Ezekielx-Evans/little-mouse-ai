import os from 'os'
import fs from 'fs'
import path from 'path'
import { getDiskInfoSync } from 'node-disk-info'

/**
 * 返回问候语。
 *
 * @function getHelloMessage
 * @returns {string} "Hello World !"
 * @example
 * getHelloMessage()
 * // => "Hello World !"
 */
export const getHelloMessage = () => 'Hello World !'



/**
 * 获取每个 CPU 核心的使用率（百分比）。
 *
 * @async
 * @function getCpuCoreUsage
 * @returns {Promise<Object[]>} 各核心使用率数组。
 * @example
 * await getCpuCoreUsage()
 * // => [
 * //   { core: 0, usage: 23.47 },
 * //   { core: 1, usage: 0.00 },
 * //   { core: 2, usage: 18.33 },
 * //   { core: 3, usage: 25.60 }
 * // ]
 */
export const getCpuCoreUsage = async () => {
    const start = os.cpus()
    await new Promise(resolve => setTimeout(resolve, 100))
    const end = os.cpus()

    return start.map((cpu, i) => {
        const startTimes = cpu.times
        const endTimes = end[i].times

        const idleDiff = endTimes.idle - startTimes.idle
        const totalDiff = Object.keys(endTimes)
            .map(k => endTimes[k] - startTimes[k])
            .reduce((a, b) => a + b, 0)

        const usage = 1 - idleDiff / totalDiff
        return { core: i, usage: Number((usage * 100).toFixed(2)) }
    })
}



/**
 * 获取系统信息概览。
 *
 * 包含版本号、平台、Node 版本、CPU 使用率、内存与磁盘信息。
 *
 * @async
 * @function getSystemInfo
 * @returns {Promise<Object>} 系统信息对象。
 * @example
 * await getSystemInfo()
 * // => {
 * //   version: "1.0.0",
 * //   platform: "win32",
 * //   nodeVersion: "v22.19.0",
 * //   cpuName: "Intel(R) Core(TM) i7-12700H",
 * //   cpuUsagePerCore: [...],
 * //   memory: {
 * //     totalGB: 31.72,
 * //     freeGB: 17.79
 * //   },
 * //   storage: {
 * //       filesystem: "Local Fixed Disk",
 * //       mounted: "C:",
 * //       totalGB: 851.74,
 * //       usedGB: 362.39,
 * //       capacity: "43%"
 * //   }
 * // }
 */
export const getSystemInfo = async () => {
    // 1. 获取项目版本号
    let version = 'unknown'
    try {
        const pkgPath = path.resolve(process.cwd(), 'package.json')
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        version = pkg.version || 'unknown'
    } catch {}

    // 2. CPU、内存、磁盘信息

    // 获取 CPU 信息
    const cpuUsagePerCore = await getCpuCoreUsage()
    const cpuName = os.cpus()[0]?.model || 'unknown'

    // 获取内存信息，单位改为 GB
    const totalGB = Number((os.totalmem() / 1024 ** 3).toFixed(2))
    const freeGB = Number((os.freemem() / 1024 ** 3).toFixed(2))

    // 获取项目运行所在分区磁盘信息
    let storage = null
    try {
        const disks = getDiskInfoSync()
        const cwd = process.cwd()
        const root = path.parse(cwd).root // Windows: 'C:\\' Linux: '/'

        // 仅获取项目运行所在分区
        let currentDisk = null
        if (process.platform === 'win32') {
            const drive = root.slice(0, 2).toUpperCase()
            currentDisk = disks.find(d => (d.mounted || '').toUpperCase().startsWith(drive))
        } else {
            currentDisk = disks.find(d => cwd.startsWith(d.mounted))
        }

        if (currentDisk) {
            storage = {
                filesystem: currentDisk.filesystem,
                mounted: currentDisk.mounted,
                totalGB: Number((currentDisk.blocks / 1024 ** 3).toFixed(2)),
                usedGB: Number((currentDisk.used / 1024 ** 3).toFixed(2)),
                capacity: currentDisk.capacity
            }
        }
    } catch (err) {
        console.error('磁盘信息获取失败:', err)
    }

    // 3. 返回系统信息
    return {
        version,
        platform: os.platform(),
        nodeVersion: process.version,
        cpuName,
        cpuUsagePerCore,
        memory: { totalGB, freeGB },
        storage
    }
}
