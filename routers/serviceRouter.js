import { Router } from 'express'
import { getProjectData } from '../controllers/serviceController.js'
import { checkProject } from '../middlewares/projectMiddleware.js'

const router = Router()

router.post('/project-data', checkProject, getProjectData)

export default router
