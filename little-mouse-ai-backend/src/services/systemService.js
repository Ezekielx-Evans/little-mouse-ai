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
 * //   cpuUsagePerCore: [
 * //     { core: 0, usage: 23.47 },
 * //     { core: 1, usage: 0.00 },
 * //     { core: 2, usage: 18.33 }
 * //   ],
 * //   memory: {
 * //     total: 34038341632,
 * //     free: 19089436672
 * //   },
 * //   storage: [
 * //     {
 * //       filesystem: "Local Fixed Disk",
 * //       mounted: "C:",
 * //       total: 914840612864,
 * //       used: 389107511296,
 * //       available: 525733101568,
 * //       capacity: "43%"
 * //     }
 * //   ]
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
    const cpuUsagePerCore = await getCpuCoreUsage()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()

    let storage = []
    try {
        const disks = getDiskInfoSync()
        storage = disks.map(disk => ({
            filesystem: disk.filesystem,
            mounted: disk.mounted,
            total: disk.blocks,
            used: disk.used,
            available: disk.available,
            capacity: disk.capacity
        }))
    } catch (err) {
        console.error('磁盘信息获取失败:', err)
    }

    // 3. 返回系统信息
    return {
        version,
        platform: os.platform(),
        nodeVersion: process.version,
        cpuUsagePerCore,
        memory: { total: totalMem, free: freeMem },
        storage
    }
}
