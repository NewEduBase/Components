import Project from '../models/Projects.js'

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
		res.status(500).json({
			success: false,
			error: 'Proyekt tekshirilmadi',
		})
	}
}
