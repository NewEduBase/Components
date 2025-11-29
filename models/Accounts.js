import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import getModel from '../config/database.js'
import { generateUniqueCode } from '../utils/generations.js'

async function generateUniqueField(model, field, createValue) {
	for (let i = 0; i < 8; i++) {
		const value = await createValue()
		const exists = await model.exists({ [field]: value })
		if (!exists) return value
	}
	throw new Error(`Failed to generate unique ${field}`)
}

const RoleSchema = new mongoose.Schema(
	{
		roleID: { type: String, unique: true, maxLength: 10 },
		name: { type: String, required: true },
		roleBase: { type: String, required: true, unique: true },
		description: { type: String, default: '' },
		projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
	},
	{ timestamps: true }
)

RoleSchema.pre('save', async function () {
	if (!this.roleID) {
		this.roleID = await generateUniqueField(
			this.constructor,
			'roleID',
			async () => `ER-${generateUniqueCode(7)}`
		)
	}
})

const AccountSchema = new mongoose.Schema(
	{
		userID: { type: String, unique: true },
		name: { type: String, required: true },
		phone: { type: String, required: true, unique: true },
		email: { type: String },
		username: { type: String, unique: true },
		password: { type: String, required: true },
		is_active: { type: Boolean, default: true },

		userBase: [
			{
				role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
				project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
				createdAt: { type: Date, default: Date.now },
			},
		],
	},
	{ timestamps: true }
)

AccountSchema.pre('save', async function () {
	if (!this.userID) {
		this.userID = await generateUniqueField(
			this.constructor,
			'userID',
			async () => `EA-${generateUniqueCode(7)}`
		)
	}
})

AccountSchema.pre('save', async function () {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 12)
	}

	if (typeof this.email === 'string' && this.email.trim() === '') {
		this.email = undefined
	}
})

AccountSchema.methods.comparePassword = async function (password) {
	return bcrypt.compare(password, this.password)
}

export const Role = getModel('Role', RoleSchema)
export const Account = getModel('Account', AccountSchema)
