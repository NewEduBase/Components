import { Account, Role } from '../models/Accounts.js'
import { ensureConnection } from '../config/database.js'

export const getProjectData = async (req, res) => {
	try {
		await ensureConnection('account')

		const project = req.project

		if (!project) {
			return res
				.status(404)
				.json({ success: false, message: 'Loyiha topilmadi' })
		}

		const [roles, accounts] = await Promise.all([
			Role.find({ projects: project._id }).lean(),
			Account.find({ 'userBase.project': project._id })
				.populate({
					path: 'userBase.role',
					select: 'name roleBase -_id',
				})
				.lean(),
		])

		const mappedAccounts = accounts.map(account => {
			const projectBase = account.userBase.find(
				base => base.project.toString() === project._id.toString()
			)
			return {
				userID: account.userID,
				name: account.name,
				phone: account.phone,
				email: account.email,
				username: account.username,
				role: projectBase?.role || null,
				assigned_at: projectBase?.createdAt || null,
			}
		})

		res.status(200).json({
			success: true,
			data: {
				project: {
					name: project.name,
					projectID: project.projectID,
					description: project.description,
				},
				roles,
				accounts: mappedAccounts,
			},
		})
	} catch (error) {
		console.error('Error in getProjectData:', error)
		res.status(500).json({
			success: false,
			message: 'Server xatoligi',
		})
	}
}
