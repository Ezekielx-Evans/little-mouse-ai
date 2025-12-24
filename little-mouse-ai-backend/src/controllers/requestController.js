import {getRequestHistoryList} from "../services/requestService.js"

/**
 * 获取请求历史记录列表（分页）。
 *
 * @example
 * // 前端请求示例：
 * GET /request/history?page=1&size=10
 */
export const getRequestHistory = async (req, res) => {
    try {
        const {page, size} = req.query
        const result = await getRequestHistoryList({page, size})

        res.json({
            success: true,
            data: result
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
