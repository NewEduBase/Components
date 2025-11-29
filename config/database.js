import mongoose from 'mongoose'
import { config } from './env.js'

const connections = {
	project: null,
	account: null,
}

const createConnection = (uri, name) => {
	if (!uri) {
		throw new Error(`❌ ${name} database URI topilmadi`)
	}

	const conn = mongoose.createConnection(uri, {
		maxPoolSize: 10,
		minPoolSize: 2,
	})

	conn.on('connected', () => {
		console.log(`✅ ${name} bazasi ulandi`)
	})

	conn.on('error', err => {
		console.error(`❌ ${name} bazasi xatosi:`, err.message)
	})

	return conn
}

export const getConnection = type => {
	if (!connections[type]) {
		if (type === 'project') {
			connections[type] = createConnection(config.MONGODB_URI, 'Projects')
		} else if (type === 'account') {
			connections[type] = createConnection(config.MONGODB_URI_ROLES, 'Accounts')
		} else if (type === 'group') {
			connections[type] = createConnection(config.MONGODB_URI_GROUPS, 'Groups')
		}
	}
	return connections[type]
}

export const getModel = (name, schema) => {
	let type = 'project'

	if (['Role', 'Account'].includes(name)) {
		type = 'account'
	} else if (name === 'Group') {
		type = 'group'
	}

	return getConnection(type).model(name, schema)
}

export default getModel
