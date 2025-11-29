import { Router } from 'express'
import authController from '../controllers/authController.js'
import { checkProject } from '../middlewares/projectMiddleware.js'

const router = Router()

router.post('/login', checkProject, authController.login)
router.get('/user-info/:userID', checkProject, authController.getMe)
router.put(
	'/update-details/:userID',
	checkProject,
	authController.updateDetails
)
router
	.route('/roles')
	.get(authController.getRoles)
	.post(authController.createRole)
	.put(authController.updateRole)
	.delete(authController.deleteRole)

router.post('/assign-role', authController.assignRole)
router.post('/remove-role', authController.removeRole)

export default router
