import RequestHistory from "../models/requestHistoryModel.js"

export const getRequests = async (page = 1, size = 10) => {
    const pageNum = Number.isNaN(Number(page)) ? 1 : Number(page)
    const pageSize = Number.isNaN(Number(size)) ? 10 : Number(size)

    const skip = (pageNum - 1) * pageSize

    const [list, total, pendingCount, successCount, errorCount, tokenAgg] = await Promise.all([
        RequestHistory.find()
            .sort({requestAt: -1})
            .skip(skip)
            .limit(pageSize),
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

    const tokens = tokenAgg?.[0]?.tokens ?? 0

    return {
        list,
        total,
        summary: {
            total,
            pending: pendingCount,
            success: successCount,
            error: errorCount,
            tokens
        }
    }
}
