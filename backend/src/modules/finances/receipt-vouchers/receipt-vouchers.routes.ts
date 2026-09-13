import { Router } from 'express';
import { receiptVouchersController } from './receipt-vouchers.controller';
import { voucherUpload } from '../payment-vouchers/payment-vouchers.controller';
import { authGuard } from '../../../common/guards/auth.guard';
import { requirePermission, requireRoles } from '../../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('E_RECEIPT_VOUCHERS', 'read'), receiptVouchersController.getReceiptVouchers);
router.get('/:id', requirePermission('E_RECEIPT_VOUCHERS', 'read'), receiptVouchersController.getReceiptVoucherById);
router.post(
  '/',
  requirePermission('E_RECEIPT_VOUCHERS', 'create'),
  voucherUpload.single('file'),
  receiptVouchersController.createReceiptVoucher
);
router.put(
  '/:id',
  requirePermission('E_RECEIPT_VOUCHERS', 'update'),
  voucherUpload.single('file'),
  receiptVouchersController.updateReceiptVoucher
);
router.patch(
  '/:id/approve',
  requirePermission('E_RECEIPT_VOUCHERS', 'update'),
  receiptVouchersController.approveReceiptVoucher
);
// Đặc quyền TGĐ
router.post(
  '/:id/override-edit',
  requireRoles('CEO', 'ADMIN'),
  receiptVouchersController.overrideReceiptVoucher
);
router.delete('/:id', requirePermission('E_RECEIPT_VOUCHERS', 'delete'), receiptVouchersController.deleteReceiptVoucher);

export default router;
