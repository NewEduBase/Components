import Project from '../models/Projects.js'
import { Account } from '../models/Accounts.js'
import { ensureConnection } from '../config/database.js'

const createProject = async (req, res) => {
	try {
		await ensureConnection('project')
		const { name, description } = req.body

		if (!name) {
			return res.status(400).json({ error: 'Loyiha nomi kiritilishi shart' })
		}

		const existingProject = await Project.findOne({ name }).lean()
		if (existingProject) {
			return res
				.status(400)
				.json({ error: 'Bu nomdagi loyiha allaqachon mavjud' })
		}

		const project = await Project.create({ name, description })
		res
			.status(201)
			.json({ message: 'Loyiha muvaffaqiyatli yaratildi', project })
	} catch (error) {
		console.error('createProject error:', error)
		res.status(500).json({ error: error.message })
	}
}

const getProjects = async (req, res) => {
	try {
		await ensureConnection('project')
		const projects = await Project.find().lean()
		res.status(200).json(projects)
	} catch (error) {
		console.error('getProjects error:', error)
		res.status(500).json({ error: error.message })
	}
}

const getProjectUsers = async (req, res) => {
	try {
		await ensureConnection('project')
		await ensureConnection('account')

		const { projectId } = req.params
		const { filter } = req.query

		const project = await Project.findOne({ projectID: projectId }).lean()
		if (!project) return res.status(404).json({ error: 'Loyiha topilmadi' })

		if (filter === 'unrolled') {
			const accounts = await Account.find({
				$or: [
					{ 'userBase.project': { $ne: project._id } },
					{ userBase: { $elemMatch: { project: project._id, role: null } } },
				],
			}).lean()

			const users = accounts.map(a => ({
				userID: a.userID,
				name: a.name,
				phone: a.phone,
				email: a.email,
				username: a.username,
				role: null,
				assigned_at: null,
			}))

			return res.status(200).json({ success: true, data: users })
		}

		const accounts = await Account.find({ 'userBase.project': project._id })
			.populate({ path: 'userBase.role', select: 'name roleBase -_id' })
			.lean()

		const users = accounts.map(a => {
			const projectBase = a.userBase.find(
				b => b.project.toString() === project._id.toString()
			)
			return {
				userID: a.userID,
				name: a.name,
				phone: a.phone,
				email: a.email,
				username: a.username,
				role: projectBase?.role || null,
				assigned_at: projectBase?.createdAt || null,
			}
		})

		res.status(200).json({ success: true, data: users })
	} catch (error) {
		console.error('getProjectUsers error:', error)
		res.status(500).json({ error: error.message })
	}
}

const createProjectUser = async (req, res) => {
	try {
		await ensureConnection('project')
		await ensureConnection('account')

		const { projectId } = req.params
		const { name, phone, email, username, password, is_active } = req.body

		const project = await Project.findOne({ projectID: projectId }).lean()
		if (!project) return res.status(404).json({ error: 'Loyiha topilmadi' })

		let account = await Account.findOne({
			$or: [{ phone }, { username: username || 'non-existent-username' }],
		})

		if (account) {
			const isLinked = account.userBase.some(
				b => b.project.toString() === project._id.toString()
			)
			if (isLinked) {
				return res
					.status(400)
					.json({ error: 'Foydalanuvchi allaqachon loyihaga biriktirilgan' })
			}
			account.userBase.push({ project: project._id, role: null })
			await account.save()
		} else {
			account = new Account({
				name,
				phone,
				email: email?.trim() || undefined,
				username,
				password,
				is_active: is_active ?? true,
				userBase: [{ project: project._id, role: null }],
			})
			await account.save()
		}

		res.status(201).json({ success: true, data: account })
	} catch (error) {
		console.error('createProjectUser error:', error)
		res.status(500).json({ error: error.message })
	}
}

const updateProjectUser = async (req, res) => {
	try {
		await ensureConnection('account')

		const { userID, name, phone, email, username, password, is_active } =
			req.body

		const account = await Account.findOne({ userID })
		if (!account) {
			return res.status(404).json({ error: 'Foydalanuvchi topilmadi' })
		}

		if (name) account.name = name
		if (phone) account.phone = phone
		if (email !== undefined) account.email = email.trim() || undefined
		if (username !== undefined) account.username = username
		if (password) account.password = password
		if (is_active !== undefined) account.is_active = is_active

		await account.save()
		res.status(200).json({ success: true, data: account })
	} catch (error) {
		console.error('updateProjectUser error:', error)
		res.status(500).json({ error: error.message })
	}
}

const deleteProjectUser = async (req, res) => {
	try {
		await ensureConnection('project')
		await ensureConnection('account')

		const { projectId } = req.params
		const { userID } = req.body

		const project = await Project.findOne({ projectID: projectId }).lean()
		if (!project) return res.status(404).json({ error: 'Loyiha topilmadi' })

		const account = await Account.findOne({ userID })
		if (!account) {
			return res.status(404).json({ error: 'Foydalanuvchi topilmadi' })
		}

		account.userBase = account.userBase.filter(
			b => b.project.toString() !== project._id.toString()
		)
		await account.save()

		res.status(200).json({
			success: true,
			message: "Foydalanuvchi loyihadan o'chirildi",
		})
	} catch (error) {
		console.error('deleteProjectUser error:', error)
		res.status(500).json({ error: error.message })
	}
}

const getUserDetails = async (req, res) => {
	try {
		await ensureConnection('project')
		await ensureConnection('account')

		const { target_user_id } = req.body

		const account = await Account.findOne({ userID: target_user_id })
			.populate({ path: 'userBase.role', select: 'name roleBase -_id' })
			.lean()

		if (!account) {
			return res.status(404).json({ error: 'Foydalanuvchi topilmadi' })
		}

		const projectIds = account.userBase.map(b => b.project).filter(Boolean)
		const projectsList = await Project.find({
			_id: { $in: projectIds },
		}).lean()

		const projectsMap = projectsList.reduce(
			(acc, p) => ({ ...acc, [p._id]: p }),
			{}
		)

		const projects = account.userBase
			.map(b => {
				const p = projectsMap[b.project]
				if (!p) return null
				return {
					projectID: p.projectID,
					projectName: p.name,
					role: b.role?.name || 'Rolsiz',
					assigned_at: b.createdAt,
					is_visible: true,
				}
			})
			.filter(Boolean)

		const user = {
			userID: account.userID,
			name: account.name,
			username: account.username,
			phone: account.phone,
			email: account.email,
			created_at: account.createdAt,
			is_active: account.is_active,
		}

		res.status(200).json({ success: true, user, projects })
	} catch (error) {
		console.error('getUserDetails error:', error)
		res.status(500).json({ error: error.message })
	}
}

export default {
	createProject,
	getProjects,
	getProjectUsers,
	createProjectUser,
	updateProjectUser,
	deleteProjectUser,
	getUserDetails,
}
