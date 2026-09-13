import { Request, Response } from 'express';
import { receiptVouchersService } from './receipt-vouchers.service';
import { successResponse, errorResponse } from '../../../common/utils/response';

export class ReceiptVouchersController {
  async getReceiptVouchers(req: Request, res: Response) {
    try {
      const { status, typeId, customerId, orderId, search, startDate, endDate } = req.query;
      const data = await receiptVouchersService.getReceiptVouchers({
        status: status as string,
        typeId: typeId as string,
        customerId: customerId as string,
        orderId: orderId as string,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      return successResponse(res, data, 'Lấy danh sách phiếu thu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách phiếu thu', 400);
    }
  }

  async getReceiptVoucherById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await receiptVouchersService.getReceiptVoucherById(id);
      return successResponse(res, data, 'Lấy chi tiết phiếu thu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết phiếu thu', 400);
    }
  }

  async createReceiptVoucher(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      let bodyData = req.body;

      if (req.file) {
        bodyData.fileUrl = `/uploads/${req.file.filename}`;
        bodyData.fileName = req.file.originalname;
      }

      if (typeof bodyData.allocations === 'string') {
        try {
          bodyData.allocations = JSON.parse(bodyData.allocations);
        } catch (e) {
          // ignore
        }
      }

      const data = await receiptVouchersService.createReceiptVoucher(bodyData, user?.id);
      return successResponse(res, data, 'Lập phiếu thu tiền thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lập phiếu thu tiền', 400);
    }
  }

  async updateReceiptVoucher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      let bodyData = req.body;

      if (req.file) {
        bodyData.fileUrl = `/uploads/${req.file.filename}`;
        bodyData.fileName = req.file.originalname;
      }

      const data = await receiptVouchersService.updateReceiptVoucher(id, bodyData);
      return successResponse(res, data, 'Cập nhật phiếu thu tiền thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật phiếu thu', 400);
    }
  }

  async approveReceiptVoucher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { action, rejectedReason } = req.body;

      if (!action || !['APPROVE', 'PAID', 'REJECT'].includes(action)) {
        return errorResponse(res, 'Hành động duyệt không hợp lệ (APPROVE, PAID, REJECT)', 400);
      }

      const data = await receiptVouchersService.approveReceiptVoucher(
        id,
        action,
        user?.id,
        rejectedReason
      );
      return successResponse(res, data, 'Phê duyệt phiếu thu & cập nhật công nợ thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi duyệt phiếu thu', 400);
    }
  }

  async overrideReceiptVoucher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const data = await receiptVouchersService.overrideReceiptVoucher(id, req.body, user, ipAddress);
      return successResponse(res, data, 'Tổng Giám Đốc mở khóa & cập nhật chứng từ thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi đặc quyền mở khóa sửa', 403);
    }
  }

  async deleteReceiptVoucher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await receiptVouchersService.deleteReceiptVoucher(id);
      return successResponse(res, null, 'Xóa phiếu thu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa phiếu thu', 400);
    }
  }
}

export const receiptVouchersController = new ReceiptVouchersController();
