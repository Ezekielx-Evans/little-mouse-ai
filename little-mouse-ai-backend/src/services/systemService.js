import os from 'os'

// 获取欢迎消息
export const getHelloMessage = () => {
    return 'Hello World !'
}

// 获取系统信息
export const getSystemInfo = () => {
    const cpus = os.cpus() || []
    const totalMem = os.totalmem()
    const freeMem = os.freemem()

    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: os.uptime(),
        cpu: {
            model: cpus[0]?.model || '',
            cores: cpus.length,
        },
        memory: {
            total: totalMem,
            free: freeMem,
            usage: Number(((1 - freeMem / totalMem) * 100).toFixed(2)),
        },
        loadAverage: os.loadavg(),
    }
}
