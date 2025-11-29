import mongoose from 'mongoose'
import { config } from './env.js'

// Connectionlarni xotirada saqlash uchun global obyekt
let cachedConnections = {
	project: null,
	account: null,
	group: null,
}

const createConnection = (uri, name) => {
	if (!uri) {
		throw new Error(`❌ ${name} database URI topilmadi`)
	}

	const conn = mongoose.createConnection(uri, {
		maxPoolSize: 1, // Serverless uchun 1 yetarli (resursni tejash)
		minPoolSize: 0,
		serverSelectionTimeoutMS: 15000, // 5 sekundda ulanmasa xato berish
		socketTimeoutMS: 45000,
		family: 4,
		bufferCommands: true, // Buyruqlarni buferlash (connection bo'lmaganda kutib turish uchun)
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
	let uri = config.MONGODB_URI
	let name = 'Projects'

	if (type === 'account') {
		uri = config.MONGODB_URI_ROLES
		name = 'Accounts'
	} else if (type === 'group') {
		uri = config.MONGODB_URI_GROUPS
		name = 'Groups'
	}

	// Agar ulanish mavjud bo'lsa va u faol bo'lsa (readyState === 1) yoki ulanayotgan bo'lsa (readyState === 2)
	if (
		cachedConnections[type] &&
		[1, 2].includes(cachedConnections[type].readyState)
	) {
		return cachedConnections[type]
	}

	// Eski ulanish mavjud bo'lsa lekin uzilgan bo'lsa, uni yopishga harakat qilamiz
	if (cachedConnections[type]) {
		try {
			cachedConnections[type].close().catch(() => {})
		} catch (e) {}
	}

	// Yangi ulanish yaratish
	cachedConnections[type] = createConnection(uri, name)
	return cachedConnections[type]
}

export const getModel = (name, schema) => {
	let type = 'project'
	if (['Role', 'Account'].includes(name)) {
		type = 'account'
	} else if (name === 'Group') {
		type = 'group'
	}

	// Modelni har safar chaqirilganda 'getConnection' orqali jonli ulanishga bog'laymiz
	const connection = getConnection(type)
	return connection.model(name, schema)
}

export default getModel
