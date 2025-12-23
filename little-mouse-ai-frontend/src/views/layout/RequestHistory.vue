<script setup>
import {onMounted, ref} from 'vue'
import {getRequestLogs} from '@/api/requestLogApi.js'

const requestInfo = ref([
    {label: '总请求', value: 0, color: '#409EFF'},
    {label: '请求中', value: 0, color: '#E6A23C'},
    {label: '成功', value: 0, color: '#67C23A'},
    {label: '失败', value: 0, color: '#F56C6C'},
    {label: 'Token', value: 0, color: '#909399'},
])

// 表格数据（后端接口获取）
const requestData = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const activeLog = ref(null)

// 分页变量
// 当前页数
const currentPage = ref(1)
// 每页显示条目个数
const pageSize = ref(10)
// 记录总数
const total = ref(0)

const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString()
}

const formatJson = (data) => {
    if (!data) return '无数据'
    try {
        return JSON.stringify(data, null, 2)
    } catch (err) {
        return '解析失败'
    }
}

const updateRequestInfo = (summary = {}) => {
    requestInfo.value = [
        {label: '总请求', value: summary.total ?? 0, color: '#409EFF'},
        {label: '请求中', value: summary.pending ?? 0, color: '#E6A23C'},
        {label: '成功', value: summary.success ?? 0, color: '#67C23A'},
        {label: '失败', value: summary.error ?? 0, color: '#F56C6C'},
        {label: 'Token', value: summary.tokens ?? 0, color: '#909399'},
    ]
}

const openDetail = (row) => {
    activeLog.value = row.raw
    detailVisible.value = true
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
    loading.value = true
    try {
        const res = await getRequestLogs({page: currentPage.value, size: pageSize.value})

        if (res.success) {
            const {list = [], total: totalCount = 0, summary = {}} = res.data || {}

            requestData.value = list.map((item) => ({
                id: item._id,
                model: item.modelId || '-',
                bot: item.botId || '-',
                requestTime: formatDateTime(item.requestAt),
                responseTime: formatDateTime(item.responseAt),
                status: item.status || '-',
                token: item.tokens ?? 0,
                raw: item,
            }))

            total.value = totalCount
            updateRequestInfo(summary)
        }
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchData()
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
                <el-table :data="requestData" border style="width: 100%" :loading="loading">
                    <el-table-column label="模型" prop="model"/>
                    <el-table-column label="机器人" prop="bot"/>
                    <el-table-column label="请求时间" prop="requestTime"/>
                    <el-table-column label="响应时间" prop="responseTime"/>
                    <el-table-column label="状态" prop="status"/>
                    <el-table-column label="Token" prop="token"/>
                    <el-table-column label="请求/响应" width="140">
                        <template #default="{ row }">
                            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
                        </template>
                    </el-table-column>
                </el-table>

            </el-card>

            <!-- 分页按钮 -->
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

            <el-dialog
                v-model="detailVisible"
                align-center
                destroy-on-close
                title="请求/响应详情"
                width="60%"
            >
                <div class="detail-cards">
                    <el-card class="detail-card">
                        <template #header>
                            <div class="card-header">
                                <span class="decor"></span>
                                请求
                            </div>
                        </template>
                        <pre class="json-viewer">{{ formatJson(activeLog?.request) }}</pre>
                    </el-card>

                    <el-card class="detail-card">
                        <template #header>
                            <div class="card-header">
                                <span class="decor"></span>
                                响应
                            </div>
                        </template>
                        <pre class="json-viewer">{{ formatJson(activeLog?.response) }}</pre>
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

.detail-cards {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.detail-card {
    --el-card-border-radius: 12px;
}

.json-viewer {
    background: #f5f7fa;
    border-radius: 12px;
    padding: 12px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 13px;
    color: #303133;
}


</style>
