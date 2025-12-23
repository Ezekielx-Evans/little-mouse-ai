import {getRequests} from "../services/requestService.js"

export const getRequestList = async (req, res) => {
    try {
        const {page = 1, size = 10} = req.query
        const data = await getRequests(page, size)

        res.json({
            success: true,
            data
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
