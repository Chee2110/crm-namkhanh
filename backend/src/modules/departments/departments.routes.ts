import { Router } from 'express';
import { departmentsController } from './departments.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';
import { imageUpload } from '../../common/utils/upload';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('A_DEPARTMENTS', 'read'), departmentsController.getDepartments);
router.get('/:id', requirePermission('A_DEPARTMENTS', 'read'), departmentsController.getDepartmentById);
router.post('/', requirePermission('A_DEPARTMENTS', 'create'), departmentsController.createDepartment);
router.put('/:id', requirePermission('A_DEPARTMENTS', 'update'), departmentsController.updateDepartment);
router.post('/:id/upload-logo', requirePermission('A_DEPARTMENTS', 'update'), imageUpload.single('file'), departmentsController.uploadLogo);
router.delete('/:id', requirePermission('A_DEPARTMENTS', 'delete'), departmentsController.deleteDepartment);

export default router;

