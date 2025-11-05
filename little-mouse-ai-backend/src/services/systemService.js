import os from 'os'
import fs from 'fs'
import path from 'path'
import { getDiskInfoSync } from 'node-disk-info'

/**
 * 获取每个 CPU 核心的使用率（百分比）
 *
 * Node.js 的 os.cpus() 方法会返回每个核心的状态信息，
 * 其中每个核心的 `times` 对象包含 5 种 CPU 时间类型：
 *
 * CPU 时间字段说明：
 * - user：用户态程序执行时间（例如普通应用程序的计算操作）
 * - nice：经过优先级调整的用户态执行时间（较少使用）
 * - sys：内核态执行时间（操作系统内部任务，例如设备驱动）
 * - idle：空闲时间（CPU 未执行任何任务）
 * - irq：处理硬件中断的时间（例如网络、磁盘中断）
 *
 * 注意：这些时间都是从系统启动以来的累计值（单位：毫秒），而非实时值。
 *
 * 因此，计算当前 CPU 使用率的方式是：
 *   1. 在两个时间点调用 os.cpus()；
 *   2. 计算各时间差；
 *   3. 使用公式：usage = (1 - idleDiff / totalDiff) * 100。
 *
 * @async
 * @function getCpuCoreUsage
 * @returns {Promise<number[]>} 返回一个数组，每个元素表示一个 CPU 核心的当前使用率（百分比）。
 */
export const getCpuCoreUsage = async () => {
    // 第一次采样：初始 CPU 时间
    const start = os.cpus()

    // 等待 100 毫秒，便于计算差值
    await new Promise(resolve => setTimeout(resolve, 100))

    // 第二次采样：稍后 CPU 时间
    const end = os.cpus()

    // 遍历每个核心，计算使用率
    return start.map((cpu, i) => {
        const startTimes = cpu.times
        const endTimes = end[i].times

        // 计算空闲时间差（idle 表示 CPU 空闲的累计时间）
        const idleDiff = endTimes.idle - startTimes.idle

        // 计算总时间差（所有状态的差值总和）
        const totalDiff = Object.keys(endTimes)
            .map(k => endTimes[k] - startTimes[k])
            .reduce((a, b) => a + b, 0)

        // 使用率公式：usage = (1 - 空闲时间占比) × 100
        const usage = 1 - idleDiff / totalDiff

        // 返回百分比结果，保留两位小数
        return Number((usage * 100).toFixed(2))
    })
}

/**
 * 获取系统信息概览
 *
 * 本函数用于收集当前运行环境的基础系统信息：
 *  - 项目版本号（读取 package.json）
 *  - 操作系统平台（如 Linux、Windows、macOS）
 *  - Node.js 运行版本
 *  - 每个 CPU 核心的使用率（百分比）
 *  - 系统内存信息（总量、可用量）
 *  - 磁盘分区信息（总容量、可用容量、使用率）
 *
 * 可用于系统监控、状态检测、性能面板等场景。
 *
 * @async
 * @function getSystemInfo
 * @returns {Promise<Object>} 返回包含系统各项指标的对象
 * @property {string} version 项目版本号
 * @property {string} platform 操作系统平台（如 linux、darwin、win32）
 * @property {string} nodeVersion 当前 Node.js 版本
 * @property {number[]} cpuUsagePerCore 每个 CPU 核心的使用率数组（百分比）
 * @property {Object} memory 内存信息
 * @property {number} memory.total 系统总内存（字节）
 * @property {number} memory.free 系统空闲内存（字节）
 * @property {Object[]} storage 磁盘分区信息数组
 * @property {string} storage[].filesystem 磁盘设备名称
 * @property {string} storage[].mounted 挂载点（如 "/"）
 * @property {number} storage[].total 总容量（字节）
 * @property {number} storage[].used 已用空间（字节）
 * @property {number} storage[].available 可用空间（字节）
 * @property {string} storage[].capacity 使用率（字符串，例如 "45.3%"）
 */
export const getSystemInfo = async () => {
    // 1. 获取项目版本号（读取 package.json）
    let version = 'unknown'
    try {
        const pkgPath = path.resolve(process.cwd(), 'package.json')
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        version = pkg.version || 'unknown'
    } catch {
        version = 'unknown'
    }

    // 2. 获取 CPU 各核心使用率
    const cpuUsagePerCore = await getCpuCoreUsage()

    // 3. 获取系统内存信息
    const totalMem = os.totalmem() // 总内存（字节）
    const freeMem = os.freemem()   // 可用内存（字节）

    // 4. 获取磁盘信息
    let storage = []
    try {
        const disks = getDiskInfoSync()
        storage = disks.map(disk => ({
            filesystem: disk.filesystem, // 磁盘设备名
            mounted: disk.mounted,       // 挂载点
            total: disk.blocks,          // 总容量
            used: disk.used,             // 已用空间
            available: disk.available,   // 可用空间
            capacity: disk.capacity      // 使用率（字符串形式）
        }))
    } catch (err) {
        console.error('磁盘信息获取失败:', err)
        storage = []
    }

    // 5. 返回系统信息对象
    return {
        version,
        platform: os.platform(),
        nodeVersion: process.version,
        cpuUsagePerCore,
        memory: {
            total: totalMem,
            free: freeMem
        },
        storage
    }
}
