import { Router } from 'express';
import { usersController } from './users.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';
import { imageUpload } from '../../common/utils/upload';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('A_USERS', 'read'), usersController.getUsers);
router.get('/:id', requirePermission('A_USERS', 'read'), usersController.getUserById);
router.post('/', requirePermission('A_USERS', 'create'), usersController.createUser);
router.put('/:id', requirePermission('A_USERS', 'update'), usersController.updateUser);
router.patch('/:id/status', requirePermission('A_USERS', 'update'), usersController.updateStatus);
router.post('/:id/upload-avatar', requirePermission('A_USERS', 'update'), imageUpload.single('file'), usersController.uploadAvatar);

export default router;

