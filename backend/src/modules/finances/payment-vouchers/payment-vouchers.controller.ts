import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { paymentVouchersService } from './payment-vouchers.service';
import { successResponse, errorResponse } from '../../../common/utils/response';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `voucher-${uniqueSuffix}${ext}`);
  }
});

export const voucherUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

export class PaymentVouchersController {
  async getPaymentVouchers(req: Request, res: Response) {
    try {
      const { status, categoryId, typeId, search, startDate, endDate } = req.query;
      const data = await paymentVouchersService.getPaymentVouchers({
        status: status as string,
        categoryId: categoryId as string,
        typeId: typeId as string,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      return successResponse(res, data, 'Lấy danh sách phiếu chi thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách phiếu chi', 400);
    }
  }

  async getPaymentVoucherById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await paymentVouchersService.getPaymentVoucherById(id);
      return successResponse(res, data, 'Lấy chi tiết phiếu chi thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết phiếu chi', 400);
    }
  }

  async createPaymentVoucher(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      let bodyData = req.body;

      if (req.file) {
        bodyData.fileUrl = `/uploads/${req.file.filename}`;
        bodyData.fileName = req.file.originalname;
      }

      const data = await paymentVouchersService.createPaymentVoucher(bodyData, user?.id);
      return successResponse(res, data, 'Lập phiếu chi tiền thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lập phiếu chi tiền', 400);
    }
  }

  async updatePaymentVoucher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      let bodyData = req.body;

      if (req.file) {
        bodyData.fileUrl = `/uploads/${req.file.filename}`;
        bodyData.fileName = req.file.originalname;
      }

      const data = await paymentVouchersService.updatePaymentVoucher(id, bodyData);
      return successResponse(res, data, 'Cập nhật phiếu chi tiền thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật phiếu chi', 400);
    }
  }

  async approvePaymentVoucher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { action, rejectedReason } = req.body;

      if (!action || !['APPROVE', 'PAID', 'REJECT'].includes(action)) {
        return errorResponse(res, 'Hành động phê duyệt không hợp lệ (APPROVE, PAID, REJECT)', 400);
      }

      const data = await paymentVouchersService.approvePaymentVoucher(
        id,
        action,
        user?.id,
        rejectedReason
      );
      return successResponse(res, data, 'Phê duyệt phiếu chi thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi phê duyệt phiếu chi', 400);
    }
  }

  async overridePaymentVoucher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const data = await paymentVouchersService.overridePaymentVoucher(id, req.body, user, ipAddress);
      return successResponse(res, data, 'Tổng Giám Đốc mở khóa & cập nhật chứng từ thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi đặc quyền mở khóa sửa', 403);
    }
  }

  async deletePaymentVoucher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await paymentVouchersService.deletePaymentVoucher(id);
      return successResponse(res, null, 'Xóa phiếu chi thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa phiếu chi', 400);
    }
  }
}

export const paymentVouchersController = new PaymentVouchersController();
