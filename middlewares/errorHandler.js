export const errorHandler = (err, req, res, next) => {
	const status = err.response?.status || err.statusCode || 500
	const message = err.response?.data?.error || err.message || 'Server xatosi'

	if (process.env.NODE_ENV !== 'production') {
		console.error('Error:', { status, message, error: err })
	}

	if (err.request && !err.response) {
		return res.status(503).json({
			success: false,
			error: "Xizmatga bog'lanib bo'lmadi. Tarmoq xatosi.",
		})
	}

	res.status(status).json({ success: false, error: message })
}

export default errorHandler
