import { Router } from 'express';
import { inboundReceiptsController, inboundUpload } from './inbound-receipts.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('C_INBOUND_RECEIPTS', 'read'), inboundReceiptsController.getReceipts);
router.get('/next-code', requirePermission('C_INBOUND_RECEIPTS', 'read'), inboundReceiptsController.getNextCode);
router.get('/:id', requirePermission('C_INBOUND_RECEIPTS', 'read'), inboundReceiptsController.getReceiptById);

router.post('/', requirePermission('C_INBOUND_RECEIPTS', 'create'), inboundReceiptsController.createReceipt);
router.post(
  '/upload',
  requirePermission('C_INBOUND_RECEIPTS', 'create'),
  inboundUpload.single('file'),
  inboundReceiptsController.uploadFile
);

router.put('/:id', requirePermission('C_INBOUND_RECEIPTS', 'update'), inboundReceiptsController.updateReceipt);
router.post('/:id/verify', requirePermission('C_INBOUND_RECEIPTS', 'update'), inboundReceiptsController.verifyReceipt);
router.post('/:id/approve', requirePermission('C_INBOUND_RECEIPTS', 'update'), inboundReceiptsController.approveReceipt);
router.post('/:id/reject', requirePermission('C_INBOUND_RECEIPTS', 'update'), inboundReceiptsController.rejectReceipt);
router.post('/:id/cancel', requirePermission('C_INBOUND_RECEIPTS', 'update'), inboundReceiptsController.cancelReceipt);

router.delete('/:id', requirePermission('C_INBOUND_RECEIPTS', 'delete'), inboundReceiptsController.deleteReceipt);

export default router;
