import mongoose from 'mongoose'
import { config } from './env.js'

const connections = {
	project: null,
	account: null,
	group: null,
}

const connectionStates = {
	project: 'disconnected',
	account: 'disconnected',
	group: 'disconnected',
}

const createConnection = (uri, name) => {
	if (!uri) {
		throw new Error(`❌ ${name} database URI topilmadi`)
	}

	const conn = mongoose.createConnection(uri, {
		maxPoolSize: 10,
		minPoolSize: 2,
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
		family: 4, // Use IPv4, skip IPv6
		retryWrites: true,
		w: 'majority',
	})

	conn.on('connected', () => {
		connectionStates[name.toLowerCase()] = 'connected'
		console.log(`✅ ${name} bazasi ulandi`)
	})

	conn.on('disconnected', () => {
		connectionStates[name.toLowerCase()] = 'disconnected'
		console.log(`⚠️  ${name} bazasi ulanmadi`)
	})

	conn.on('error', err => {
		connectionStates[name.toLowerCase()] = 'error'
		console.error(`❌ ${name} bazasi xatosi:`, err.message)
	})

	conn.on('reconnected', () => {
		connectionStates[name.toLowerCase()] = 'connected'
		console.log(`🔄 ${name} bazasi qayta ulandi`)
	})

	return conn
}

export const getConnection = type => {
	if (!connections[type]) {
		try {
			if (type === 'project') {
				connections[type] = createConnection(config.MONGODB_URI, 'Projects')
			} else if (type === 'account') {
				connections[type] = createConnection(
					config.MONGODB_URI_ROLES,
					'Accounts'
				)
			} else if (type === 'group') {
				connections[type] = createConnection(
					config.MONGODB_URI_GROUPS,
					'Groups'
				)
			}
		} catch (error) {
			console.error(
				`❌ Connection yaratishda xatolik [${type}]:`,
				error.message
			)
			throw error
		}
	}
	return connections[type]
}

export const ensureConnection = async type => {
	const connection = getConnection(type)

	if (connection.readyState === 1) return connection

	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error(`Connection timeout for ${type}`))
		}, 10000)

		connection.once('open', () => {
			clearTimeout(timeout)
			resolve(connection)
		})

		connection.once('error', err => {
			clearTimeout(timeout)
			reject(err)
		})
	})
}

export const getModel = (name, schema) => {
	let type = 'project'
	if (['Role', 'Account'].includes(name)) {
		type = 'account'
	} else if (name === 'Group') {
		type = 'group'
	}

	const connection = getConnection(type)
	return connection.model(name, schema)
}

export default getModel
