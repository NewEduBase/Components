import app from './app.js'
import { config } from './config/env.js'

const startServer = () => {
	try {
		app.listen(config.PORT, () => {
			console.log(`🚀 Server ${config.PORT}-portda ishga tushdi`)
			if (config.isDev) console.log('🔧 Dev mode aktiv')
		})
	} catch (err) {
		console.error('❌ Server xatosi:', err.message)
		process.exit(1)
	}
}

startServer()
