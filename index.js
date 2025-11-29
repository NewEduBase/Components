import app from './app.js'
import { config } from './config/env.js'

const startServer = () => {
	try {
		const server = app.listen(config.PORT, () => {
			console.log(`🚀 Server ${config.PORT}-portda ishga tushdi`)
			if (config.isDev) console.log('🔧 Dev mode aktiv')
		})

		process.on('SIGTERM', () => {
			console.log('📛 SIGTERM received, shutting down gracefully')
			server.close(() => {
				console.log('✅ Server closed')
				process.exit(0)
			})
		})

		process.on('SIGINT', () => {
			console.log('📛 SIGINT received, shutting down gracefully')
			server.close(() => {
				console.log('✅ Server closed')
				process.exit(0)
			})
		})
	} catch (err) {
		console.error('❌ Server xatosi:', err.message)
		process.exit(1)
	}
}

startServer()
