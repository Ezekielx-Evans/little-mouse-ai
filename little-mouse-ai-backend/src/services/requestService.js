import RequestHistory from "../models/requestHistoryModel.js"

export async function getRequestHistoryList({page = 1, size = 10}) {
    const pageNumber = Number(page) || 1
    const pageSize = Number(size) || 10
    const skip = (pageNumber - 1) * pageSize

    const [records, total, pendingCount, successCount, errorCount, tokenAgg] = await Promise.all([
        RequestHistory.find().sort({requestAt: -1}).skip(skip).limit(pageSize),
        RequestHistory.countDocuments(),
        RequestHistory.countDocuments({status: "pending"}),
        RequestHistory.countDocuments({status: "success"}),
        RequestHistory.countDocuments({status: "error"}),
        RequestHistory.aggregate([
            {
                $group: {
                    _id: null,
                    tokens: {$sum: {$ifNull: ["$tokens", 0]}}
                }
            }
        ])
    ])

    const tokenTotal = tokenAgg[0]?.tokens ?? 0

    return {
        records: records.map(item => ({
            id: item._id,
            model: item.request?.model ?? item.modelId ?? "",
            bot: item.botId ?? "",
            requestTime: item.requestAt ? item.requestAt.toISOString() : null,
            responseTime: item.responseAt ? item.responseAt.toISOString() : null,
            status: item.status,
            token: item.tokens ?? 0,
            request: item.request ?? null,
            response: item.response ?? null
        })),
        total,
        stats: {
            total,
            pending: pendingCount,
            success: successCount,
            error: errorCount,
            tokens: tokenTotal
        }
    }
}
