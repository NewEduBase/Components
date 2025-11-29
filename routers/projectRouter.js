import { Router } from 'express'
import projectController from '../controllers/projectController.js'

const router = Router()

router.post('/create', projectController.createProject)
router.get('/get-all', projectController.getProjects)
router.post('/user-details', projectController.getUserDetails)

router
	.route('/:projectId/users')
	.get(projectController.getProjectUsers)
	.post(projectController.createProjectUser)
	.put(projectController.updateProjectUser)
	.delete(projectController.deleteProjectUser)

export default router
