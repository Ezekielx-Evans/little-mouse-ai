<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'
import {getRequestHistoryList} from '@/api/requestApi.js'
import {getBotConfigList} from '@/api/botApi.js'

const requestInfo = ref([
    {label: '总请求', value: '0', color: '#409EFF'},
    {label: '请求中', value: '0', color: '#E6A23C'},
    {label: '成功', value: '0', color: '#67C23A'},
    {label: '失败', value: '0', color: '#F56C6C'},
    {label: 'Token', value: '0', color: '#909399'},
])

// 表格数据
const requestData = ref([])

// 分页变量
// 当前页数
const currentPage = ref(1)
// 每页显示条目个数
const pageSize = ref(10)
// 记录总数
const total = ref(0)

const detailVisible = ref(false)
const activeHistory = ref(null)
const botOptions = ref([])
const timer = ref(null)

const statusTypeMap = {
    pending: 'warning',
    success: 'success',
    error: 'danger'
}

const statusLabelMap = {
    pending: '请求中',
    success: '成功',
    error: '失败'
}

// 分页方法（调用后端接口）
// page-size 改变时触发
const handleSizeChange = (val) => {
    pageSize.value = val
    fetchData()
}

// current-page 改变时触发
const handleCurrentChange = (val) => {
    currentPage.value = val
    fetchData()
}

// 请求后端数据
const fetchData = async () => {
    const [historyRes, botRes] = await Promise.all([
        getRequestHistoryList({
            page: currentPage.value,
            size: pageSize.value
        }),
        getBotConfigList()
    ])

    if (botRes?.success) {
        botOptions.value = botRes.data.map(item => ({
            label: item.name,
            value: item.id
        }))
    }

    if (!historyRes?.success) return

    requestData.value = historyRes.data.records || []
    total.value = historyRes.data.total || 0

    const stats = historyRes.data.stats || {}
    requestInfo.value = [
        {label: '总请求', value: String(stats.total ?? 0), color: '#409EFF'},
        {label: '请求中', value: String(stats.pending ?? 0), color: '#E6A23C'},
        {label: '成功', value: String(stats.success ?? 0), color: '#67C23A'},
        {label: '失败', value: String(stats.error ?? 0), color: '#F56C6C'},
        {label: 'Token', value: String(stats.tokens ?? 0), color: '#909399'},
    ]
}

const openDetail = (row) => {
    activeHistory.value = row
    detailVisible.value = true
}

const formattedRequest = computed(() => {
    if (!activeHistory.value?.request) return '暂无请求数据'
    return JSON.stringify(activeHistory.value.request, null, 2)
})

const formattedResponse = computed(() => {
    if (!activeHistory.value?.response) return '暂无响应数据'
    return JSON.stringify(activeHistory.value.response, null, 2)
})

const resolveBotName = (botId) =>
    botOptions.value.find(item => item.value === botId)?.label || '未知机器人'

const resolveStatusType = (status) => statusTypeMap[status] ?? 'info'
const resolveStatusLabel = (status) => statusLabelMap[status] ?? (status || '未知状态')

// 北京时间格式化
const formatBeijingTime = (time) => {
    if (!time) return '-'
    const date = new Date(time)
    date.setHours(date.getHours() + 8)

    const pad = (n) => String(n).padStart(2, '0')

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// 响应耗时计算
const calcResponseDuration = (requestTime, responseTime) => {
    if (!requestTime || !responseTime) return '-'

    const start = new Date(requestTime).getTime()
    const end = new Date(responseTime).getTime()
    const diff = end - start

    if (diff < 0) return '-'
    if (diff < 1000) return `${diff} ms`

    return `${(diff / 1000).toFixed(2)} s`
}

onMounted(() => {
    fetchData()
    timer.value = setInterval(fetchData, 500)
})

onBeforeUnmount(() => {
    // 切换页面时销毁定时器，防止内存泄漏
    clearInterval(timer)
})

</script>

<template>

    <!-- 主体页面 -->
    <el-scrollbar>
        <div class="request-page">

            <!-- LLM 请求记录卡片 -->
            <el-card class="card">
                <div class="card-header">
                    <span class="decor"></span>
                    LLM 请求
                </div>
            </el-card>

            <!-- 总请求信息 -->
            <el-row justify="space-between">
                <el-col
                    v-for="item in requestInfo"
                    :key="item.label"
                    :md="4"
                    :sm="10"
                    :xs="24"
                    class="request-item"
                >
                    <el-card class="card">
                        <div class="info-card">
                            <div class="info-label">{{ item.label }}</div>
                            <div :style="{ color: item.color }" class="info-value">{{ item.value }}</div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>

            <!-- 单条记录分页框卡片 -->
            <el-card class="card">

                <!-- 卡片标题 -->
                <template #header>
                    <div class="card-header">
                        <span class="decor"></span>
                        LLM 记录
                    </div>
                </template>

                <!-- 记录表格 -->
                <el-table :data="requestData" border style="width: 100%" table-layout="auto">
                    <el-table-column label="模型" prop="model"/>

                    <el-table-column label="机器人" prop="bot">
                        <template #default="{ row }">
                            <div class="option-row">
                                <span class="data-inline">{{ resolveBotName(row.bot) }}</span>
                                <el-tag size="small">{{ row.bot }}</el-tag>
                            </div>
                        </template>
                    </el-table-column>

                    <!-- 请求时间 -->
                    <el-table-column label="请求时间">
                        <template #default="{ row }">
                            {{ formatBeijingTime(row.requestTime) }}
                        </template>
                    </el-table-column>

                    <!-- 响应时间 -->
                    <el-table-column label="响应时间">
                        <template #default="{ row }">
                            <span class="data-inline">{{ calcResponseDuration(row.requestTime, row.responseTime) }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column label="状态" prop="status">
                        <template #default="{ row }">
                            <el-tag :type="resolveStatusType(row.status)" size="small">
                                {{ resolveStatusLabel(row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column label="Token" prop="token"/>

                    <el-table-column label="请求/响应" width="120">
                        <template #default="{ row }">
                            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>

            <div class="pagination-block">
                <span class="total-text">共 {{ total }} 条记录</span>
                <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="total"
                    background
                    layout="sizes, prev, pager, next"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                />
            </div>

            <el-dialog v-model="detailVisible" title="请求/响应详情" width="70%">
                <div class="detail-content">
                    <el-card class="detail-card">
                        <template #header>
                            <div class="detail-header">Request</div>
                        </template>
                        <pre class="detail-pre">{{ formattedRequest }}</pre>
                    </el-card>
                    <el-card class="detail-card">
                        <template #header>
                            <div class="detail-header">Response</div>
                        </template>
                        <pre class="detail-pre">{{ formattedResponse }}</pre>
                    </el-card>
                </div>
            </el-dialog>
        </div>
    </el-scrollbar>
</template>

<style scoped>

.request-page {
    margin-left: 10%;
    margin-right: 10%;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.card {
    --el-card-border-radius: 20px;
}

.card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 45px rgba(64, 158, 255, 0.15);
}

.card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.08em;
}

.decor {
    display: inline-block;
    width: 6px;
    height: 20px;
    background: rgb(51, 126, 204);
    border-radius: 3px;
    margin-right: 8px;
    user-select: none
}

.info-card {
    border-radius: 16px;
    margin-bottom: 16px;
    text-align: center;
}

.info-label {
    font-size: 16px;
    color: #606266;
    margin-bottom: 6px;
    white-space: nowrap;
}

.info-value {
    font-size: 18px;
    font-weight: 600;
    color: #409EFF;
}

.request-item {
    margin-bottom: 16px;
}

.pagination-block {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.total-text {
    color: #606266;
    font-size: 14px;
    white-space: nowrap;
}

.detail-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
}

.detail-card {
    --el-card-border-radius: 16px;
    background: #fafafa;
}

.detail-header {
    font-weight: 600;
    color: #303133;
}

.detail-pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 13px;
    color: #606266;
}

.option-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.data-inline {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

</style>
