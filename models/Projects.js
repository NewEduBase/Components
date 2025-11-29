import mongoose from 'mongoose'
import { generateUniqueCode, generateHashedCode } from '../utils/generations.js'
import getModel from '../config/database.js'

const ProjectSchema = new mongoose.Schema(
	{
		projectID: { type: String, unique: true, index: true },
		name: { type: String, required: true, unique: true, index: true },
		description: { type: String, default: '' },
		status: {
			type: String,
			enum: ['active', 'inactive', 'blocked'],
			default: 'active',
			index: true,
		},
		apiKey: { type: String, unique: true, index: true },
	},
	{ timestamps: true }
)

async function generateUniqueField(model, field, createValue) {
	for (let i = 0; i < 8; i++) {
		const value = await createValue()
		const exists = await model.exists({ [field]: value })
		if (!exists) return value
	}
	throw new Error(`Failed to generate unique ${field}`)
}

ProjectSchema.pre('save', async function () {
	if (!this.projectID) {
		this.projectID = await generateUniqueField(
			this.constructor,
			'projectID',
			async () => `EP-${generateUniqueCode(7)}`
		)
	}

	if (!this.apiKey) {
		this.apiKey = await generateUniqueField(
			this.constructor,
			'apiKey',
			async () => {
				const randomPart = generateUniqueCode(16)
				const raw = `${process.env.API_SECRET}-${randomPart}`
				return generateHashedCode(raw)
			}
		)
	}
})

export default getModel('Project', ProjectSchema)
