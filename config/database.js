import mongoose from 'mongoose'
import { config } from './env.js'

let cachedConnections = global.mongooseConnections || {}
global.mongooseConnections = cachedConnections

const getConnection = (uri, name) => {
	if (!uri) {
		throw new Error(`❌ ${name} database URI topilmadi`)
	}

	if (cachedConnections[name] && cachedConnections[name].readyState === 1) {
		return cachedConnections[name]
	}

	const conn = mongoose.createConnection(uri, {
		maxPoolSize: 2, // Serverless uchun 10 shart emas, 2 yetarli
		serverSelectionTimeoutMS: 5000, // 5 soniyada ulanmasa xato bersin (10 kuttirmaslik uchun)
		socketTimeoutMS: 45000,
		family: 4, // IPv4 ni majburlash (ba'zida IPv6 muammo chiqaradi)
		bufferCommands: false, // MUHIM: Ulanish bo'lmasa kutib o'tirmasdan darrov xato chiqarish yoki qayta ulanish
	})

	conn.on('connected', () => {
		console.log(`✅ ${name} bazasi ulandi`)
	})

	conn.on('error', err => {
		console.error(`❌ ${name} bazasi xatosi:`, err.message)
	})

	// Keshga saqlaymiz
	cachedConnections[name] = conn
	return conn
}

export const getModel = (name, schema) => {
	let type = 'project'
	let uri = config.MONGODB_URI
	let connName = 'Projects'

	if (['Role', 'Account'].includes(name)) {
		type = 'account'
		uri = config.MONGODB_URI_ROLES
		connName = 'Accounts'
	} else if (name === 'Group') {
		type = 'group'
		uri = config.MONGODB_URI_GROUPS
		connName = 'Groups'
	}

	schema.set('bufferCommands', false)
	schema.set('autoCreate', false) // Productionda ortiqcha so'rovni kamaytirish

	const connection = getConnection(uri, connName)
	return connection.model(name, schema)
}

export default getModel
