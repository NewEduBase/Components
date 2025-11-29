import Project from '../models/Projects.js'
import { ensureConnection } from '../config/database.js'

export const checkProject = async (req, res, next) => {
	try {
		const apiKey =
			req.headers['x-api-key'] ?? req.body.apiKey ?? req.query.apiKey

		if (!apiKey) {
			return res.status(400).json({
				success: false,
				error: 'Api kalit sozni kiriting',
			})
		}

		// Ensure database connection is ready
		await ensureConnection('project')

		const project = await Project.findOne({ apiKey }).lean().exec()

		if (!project) {
			return res.status(401).json({
				success: false,
				error: 'Api kalit topilmadi',
			})
		}

		if (project.status !== 'active') {
			return res.status(403).json({
				success: false,
				error: 'Proyekt faol emas',
			})
		}

		req.project = project
		next()
	} catch (err) {
		console.error('❌ Project middleware xatosi:', err.message)

		// Return appropriate error based on error type
		if (err.message.includes('timeout')) {
			return res.status(503).json({
				success: false,
				error: 'Database ulanish vaqti tugadi',
			})
		}

		res.status(500).json({
			success: false,
			error: 'Proyekt tekshirilmadi',
		})
	}
}
