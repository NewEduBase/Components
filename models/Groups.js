import mongoose from 'mongoose'
import getModel from '../config/database.js'
import { generateUniqueCode } from '../utils/generations.js'

const groupSchema = new mongoose.Schema(
	{
		groupID: { type: String, unique: true, index: true },
		name: { type: String, required: true },
		description: { type: String, default: '' },
		status: {
			type: String,
			enum: ['active', 'inactive', 'blocked'],
			default: 'active',
			index: true,
		},
		mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
		students: [
			{
				student: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
				ConnectedAt: { type: Date, default: Date.now },
			},
		],
		project: [
			{
				project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
				ConnectedAt: { type: Date, default: Date.now },
			},
		],
	},
	{ timestamps: true }
)

async function generateUniqueField(model, field, createValue) {
	for (let attempt = 0; attempt < 8; attempt++) {
		const value = await createValue()
		const exists = await model.exists({ [field]: value })
		if (!exists) return value
	}
	throw new Error(`Failed to generate unique ${field}`)
}

groupSchema.pre('save', async function () {
	if (!this.groupID) {
		this.groupID = await generateUniqueField(
			this.constructor,
			'groupID',
			async () => `EG-${generateUniqueCode(7)}`
		)
	}
})

export default getModel('Group', groupSchema)
