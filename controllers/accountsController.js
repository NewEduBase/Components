import { Role as Roles } from '../models/Accounts.js'
import { Account as Accounts } from '../models/Accounts.js'

const createAccount = async (req, res) => {
	try {
		const { name, phone, email, username, password } = req.body
		if (!name || !phone || !password) {
			return res
				.status(400)
				.json({ error: 'F.I.SH, Telefon raqami va parol kiritilishi shart' })
		}

		const existingAccount = await Accounts.findOne({ phone })
		const existingEmail = await Accounts.findOne({ email })
		const existingUsername = await Accounts.findOne({ username })
		if (existingAccount) {
			return res
				.status(400)
				.json({ error: 'Bu telefon raqami allaqachon mavjud' })
		}
		if (existingEmail) {
			return res.status(400).json({ error: 'Bu email allaqachon mavjud' })
		}
		if (existingUsername) {
			return res.status(400).json({ error: 'Bu username allaqachon mavjud' })
		}

		const account = await Accounts.create({
			name,
			phone,
			email,
			username,
			password,
		})

		res
			.status(201)
			.json({ message: 'Account muvaffaqiyatli yaratildi', account })
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
}

const getAccounts = async (req, res) => {
	try {
		const accounts = await Accounts.find()
		res.status(200).json(accounts)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
}

const createRole = async (req, res) => {
	try {
		const { name, roleBase, description, projects } = req.body
		if (!name || !roleBase) {
			return res
				.status(400)
				.json({ error: 'Role nomi va role asosi kiritilishi shart' })
		}

		const existingRole = await Roles.findOne({ roleBase })
		if (existingRole) {
			return res
				.status(400)
				.json({ error: 'Bu nomdagi role allaqachon mavjud' })
		}

		const role = await Roles.create({
			name,
			roleBase,
			description,
			projects,
		})

		res.status(201).json({ message: 'Role muvaffaqiyatli yaratildi', role })
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
}

const getRoles = async (req, res) => {
	try {
		const roles = await Roles.find()
		res.status(200).json(roles)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
}

export default {
	createRole,
	getRoles,
	createAccount,
	getAccounts,
}
