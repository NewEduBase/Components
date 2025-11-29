import express from 'express'
import compression from 'compression'
const apiRouter = express.Router()

import errorHandler from './middlewares/errorHandler.js'
import projectRouter from './routers/projectRouter.js'
import serviceRouter from './routers/serviceRouter.js'
import authRouter from './routers/authRoutes.js'

const app = express()
app.use(compression())
app.use(express.json({ limit: '10mb' }))

apiRouter.use('/project', projectRouter)
apiRouter.use('/service', serviceRouter)
apiRouter.use('/auth', authRouter)
app.use('/api/v1', apiRouter)
app.get('/health', (req, res) => res.json({ status: '✅ Server ishlayapti' }))

app.use(errorHandler)

export default app
