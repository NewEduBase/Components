import dotenv from 'dotenv'

dotenv.config()

const required = ['MONGODB_URI']
const missingVars = required.filter(key => !process.env[key])

if (missingVars.length) {
	throw new Error(`❌ Kerakli o'zgaruvchilar yo'q: ${missingVars.join(', ')}`)
}

export const config = {
	PORT: Number(process.env.PORT),
	API_SECRET: process.env.API_SECRET,
	MONGODB_URI: process.env.MONGODB_URI,
	MONGODB_URI_ROLES: process.env.MONGODB_URI_ROLES,
	isDev: process.env.NODE_ENV !== 'production',
}

export default config
