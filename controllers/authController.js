import { Account as Accounts, Role } from '../models/Accounts.js'
import Project from '../models/Projects.js'
import bcrypt from 'bcryptjs'

const login = async (req, res) => {
	try {
		const { login, password } = req.body
		const project = req.project
		if (!login || !password)
			return res.status(400).json({ error: 'Login va parol kiritilishi shart' })

		const account = await Accounts.findOne({
			$or: [{ phone: login }, { email: login }, { username: login }],
		})
			.populate({
				path: 'userBase.role',
				model: Role,
			})
			.populate({
				path: 'userBase.project',
				model: Project,
			})
			.lean()

		if (!account)
			return res.status(400).json({ error: 'Bunday foydalanuvchi mavjud emas' })

		const isUserInProject = account.userBase.some(
			base => base.project?._id?.toString() === project._id.toString()
		)
		if (!isUserInProject)
			return res
				.status(403)
				.json({ error: 'Foydalanuvchi bu loyihaga ulanmagan' })

		const isPasswordValid = await bcrypt.compare(password, account.password)
		if (!isPasswordValid)
			return res.status(400).json({ error: "Parol noto'g'ri" })

		const { password: _, ...safeAccount } = account
		res
			.status(200)
			.json({ success: true, message: 'Xush kelibsiz!', account: safeAccount })
	} catch (error) {
		console.error('Login Error:', error)
		res
			.status(500)
			.json({ success: false, message: 'Foydalanuvchi kirishda xatolik' })
	}
}

const getMe = async (req, res) => {
	try {
		const { userID } = req.params
		const account = await Accounts.findOne({ userID })
			.populate({
				path: 'userBase.role',
				model: Role,
			})
			.populate({
				path: 'userBase.project',
				model: Project,
			})
			.lean()

		if (!account)
			return res.status(404).json({ error: 'Bunday foydalanuvchi mavjud emas' })

		const { password: _, ...safeAccount } = account
		res.status(200).json({ success: true, user: safeAccount })
	} catch (error) {
		console.error('GetMe Error:', error)
		res.status(500).json({
			success: false,
			message: 'Foydalanuvchi ma`lumotlarini olishda xatolik',
		})
	}
}

const updateDetails = async (req, res) => {
	try {
		const { userID } = req.params
		const { name, username, email, phone } = req.body

		const account = await Accounts.findOne({ userID })
		if (!account) {
			return res.status(404).json({ error: 'Bunday foydalanuvchi mavjud emas' })
		}

		if (name) account.name = name
		if (username) account.username = username
		if (email) account.email = email
		if (phone) account.phone = phone

		await account.save()

		const updatedAccount = await Accounts.findOne({ userID })
			.populate({
				path: 'userBase.role',
				model: 'Role',
			})
			.populate({
				path: 'userBase.project',
				model: Project,
			})
			.lean()

		const { password: _, ...safeAccount } = updatedAccount
		res.status(200).json({ success: true, user: safeAccount })
	} catch (error) {
		console.error('Xatolik: ', error)
		if (error.code === 11000) {
			const field = Object.keys(error.keyPattern)[0]
			return res
				.status(400)
				.json({ error: { [field]: `Bu ${field} allaqachon band qilingan` } })
		}
		res.status(500).json({
			success: false,
			message: 'Foydalanuvchi ma`lumotlarini yangilashda xatolik',
		})
	}
}

const getRoles = async (req, res) => {
	try {
		const { project } = req.query
		let query = {}

		if (project) {
			const projectObj = await Project.findOne({ projectID: project }).lean()
			if (projectObj) {
				query = { projects: projectObj._id }
			} else {
				try {
					query = { projects: project }
				} catch (e) {
					return res.status(200).json({ success: true, data: [] })
				}
			}
		}

		const roles = await Role.find(query).lean()
		return res.status(200).json({ success: true, data: roles })
	} catch (error) {
		console.error('Xatolik: ', error)
		return res.status(500).json({
			success: false,
			message: 'Xatolik: Roles ma`lumotlarini olishda xatolik',
		})
	}
}

const assignRole = async (req, res) => {
	try {
		const { user, roleID, projectID } = req.body

		if (!user || !roleID) {
			return res.status(400).json({ error: 'User va Role kiritilishi shart' })
		}
		const [account, role, projectObj] = await Promise.all([
			Accounts.findOne({ userID: user }),
			Role.findOne({ roleID }),
			Project.findOne({ projectID }),
		])

		if (!account)
			return res.status(404).json({ error: 'Foydalanuvchi topilmadi' })
		if (!role) return res.status(404).json({ error: 'Rol topilmadi' })
		if (!projectObj) return res.status(404).json({ error: 'Loyiha topilmadi' })

		const idx = account.userBase.findIndex(
			b => b.project.toString() === projectObj._id.toString()
		)
		if (idx > -1) account.userBase[idx].role = role._id
		else account.userBase.push({ project: projectObj._id, role: role._id })

		await account.save()
		return res.status(200).json({ success: true, message: 'Rol biriktirildi' })
	} catch (error) {
		console.error('Assign Role Error:', error)
		return res.status(500).json({ error: 'Rol biriktirishda xatolik' })
	}
}

const removeRole = async (req, res) => {
	try {
		const { user, projectID } = req.body

		if (!user || !projectID) {
			return res
				.status(400)
				.json({ error: 'User va Loyiha ID si kiritilishi shart' })
		}

		const [account, projectObj] = await Promise.all([
			Accounts.findOne({ userID: user }),
			Project.findOne({ projectID }),
		])

		if (!account)
			return res.status(404).json({ error: 'Foydalanuvchi topilmadi' })
		if (!projectObj) return res.status(404).json({ error: 'Loyiha topilmadi' })

		const idx = account.userBase.findIndex(
			b => b.project.toString() === projectObj._id.toString()
		)
		if (idx > -1) {
			account.userBase[idx].role = null
			await account.save()
			return res
				.status(200)
				.json({ success: true, message: 'Rol olib tashlandi' })
		}
		res.status(404).json({ error: 'Foydalanuvchi bu loyihada topilmadi' })
	} catch (error) {
		console.error('Remove Role Error:', error)
		return res.status(500).json({ error: 'Rolni olib tashlashda xatolik' })
	}
}

const createRole = async (req, res) => {
	try {
		const { name, roleBase, description, project } = req.body

		if (!name || !roleBase) {
			return res.status(400).json({ error: 'Nom va Base kiritilishi shart' })
		}

		const existingRole = await Role.findOne({ roleBase })
		if (existingRole) {
			return res.status(400).json({ error: 'Bu rol allaqachon mavjud' })
		}

		const newRole = new Role({
			name,
			roleBase,
			description,
		})

		if (project) {
			const projectObj = await Project.findOne({ projectID: project })
			if (projectObj) newRole.projects.push(projectObj._id)
		}

		await newRole.save()
		return res.status(201).json({ success: true, data: newRole })
	} catch (error) {
		console.error('Create Role Error:', error)
		return res.status(500).json({ error: 'Rol yaratishda xatolik' })
	}
}

const updateRole = async (req, res) => {
	try {
		const { roleID, name, description } = req.body
		const role = await Role.findOne({ roleID })
		if (!role) {
			return res.status(404).json({ error: 'Rol topilmadi' })
		}

		if (name) role.name = name
		if (description !== undefined) role.description = description

		await role.save()
		return res.status(200).json({ success: true, data: role })
	} catch (error) {
		console.error('Update Role Error:', error)
		return res.status(500).json({ error: 'Rolni yangilashda xatolik' })
	}
}

const deleteRole = async (req, res) => {
	try {
		const { roleID } = req.body
		const role = await Role.findOne({ roleID })
		if (!role) {
			return res.status(404).json({ error: 'Rol topilmadi' })
		}

		await Role.deleteOne({ roleID })
		return res.status(200).json({ success: true, message: 'Rol o`chirildi' })
	} catch (error) {
		console.error('Delete Role Error:', error)
		return res.status(500).json({ error: 'Rolni o`chirishda xatolik' })
	}
}

export default {
	login,
	getMe,
	updateDetails,
	getRoles,
	createRole,
	updateRole,
	deleteRole,
	assignRole,
	removeRole,
}
