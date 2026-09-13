import { Router } from 'express';
import { paymentVouchersController, voucherUpload } from './payment-vouchers.controller';
import { authGuard } from '../../../common/guards/auth.guard';
import { requirePermission, requireRoles } from '../../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('E_PAYMENT_VOUCHERS', 'read'), paymentVouchersController.getPaymentVouchers);
router.get('/:id', requirePermission('E_PAYMENT_VOUCHERS', 'read'), paymentVouchersController.getPaymentVoucherById);
router.post(
  '/',
  requirePermission('E_PAYMENT_VOUCHERS', 'create'),
  voucherUpload.single('file'),
  paymentVouchersController.createPaymentVoucher
);
router.put(
  '/:id',
  requirePermission('E_PAYMENT_VOUCHERS', 'update'),
  voucherUpload.single('file'),
  paymentVouchersController.updatePaymentVoucher
);
router.patch(
  '/:id/approve',
  requirePermission('E_PAYMENT_VOUCHERS', 'update'),
  paymentVouchersController.approvePaymentVoucher
);
// Đặc quyền TGĐ
router.post(
  '/:id/override-edit',
  requireRoles('CEO', 'ADMIN'),
  paymentVouchersController.overridePaymentVoucher
);
router.delete('/:id', requirePermission('E_PAYMENT_VOUCHERS', 'delete'), paymentVouchersController.deletePaymentVoucher);

export default router;
