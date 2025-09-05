export const healthCheck = async(req, res) => {
    try {
        res.status(200).json({
            status: "ok",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            _links: {
                self: { href: '/health', method: 'GET' }
            }
        })
    } catch (err) {
        res.status(500).json({
            title: "Internal Server Error",
            status: 500,
            detail: err.message,
            instance: req.originalUrl
        })
    }
}