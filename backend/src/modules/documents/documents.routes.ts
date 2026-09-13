import { Router } from 'express';
import { documentsController, documentUpload } from './documents.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('A_DOCUMENTS', 'read'), documentsController.getDocuments);
router.get('/:id', requirePermission('A_DOCUMENTS', 'read'), documentsController.getDocumentById);
router.get('/:id/download', requirePermission('A_DOCUMENTS', 'read'), documentsController.downloadDocument);
router.post(
  '/',
  requirePermission('A_DOCUMENTS', 'create'),
  documentUpload.single('file'),
  documentsController.createDocument
);
router.delete('/:id', requirePermission('A_DOCUMENTS', 'delete'), documentsController.deleteDocument);

export default router;
