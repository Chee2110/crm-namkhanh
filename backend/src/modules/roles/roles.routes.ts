import { Router } from 'express';
import { rolesController } from './roles.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

// Module list
router.get('/modules', rolesController.getModules);

// Roles CRUD
router.get('/', requirePermission('A_ROLES', 'read'), rolesController.getRoles);
router.get('/:id', requirePermission('A_ROLES', 'read'), rolesController.getRoleById);
router.post('/', requirePermission('A_ROLES', 'create'), rolesController.createRole);
router.put('/:id', requirePermission('A_ROLES', 'update'), rolesController.updateRole);
router.delete('/:id', requirePermission('A_ROLES', 'delete'), rolesController.deleteRole);

// RBAC Permissions Matrix (A.4)
router.get('/:id/permissions', requirePermission('A_PERMISSIONS', 'read'), rolesController.getRolePermissions);
router.put('/:id/permissions', requirePermission('A_PERMISSIONS', 'update'), rolesController.updateRolePermissions);

export default router;
