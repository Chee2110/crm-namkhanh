import { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { inboundReceiptsService } from './inbound-receipts.service';
import { successResponse, errorResponse } from '../../common/utils/response';
import { uploadDir } from '../../common/utils/upload';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `inbound-${uniqueSuffix}${ext}`);
  }
});

const allowedMimes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const inboundUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận các định dạng file: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WEBP'));
    }
  }
});

export class InboundReceiptsController {
  async getReceipts(req: Request, res: Response) {
    try {
      const { search, type, status, warehouseId, supplierId, startDate, endDate } = req.query;

      const result = await inboundReceiptsService.getReceipts({
        search: search as string,
        type: type as string,
        status: status as string,
        warehouseId: warehouseId as string,
        supplierId: supplierId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });

      return successResponse(res, result, 'Lấy danh sách phiếu nhập kho thành công');
    } catch (err: any) {
      console.error('Lỗi getReceipts:', err);
      return errorResponse(res, err.message || 'Lỗi khi lấy danh sách phiếu nhập kho', 500);
    }
  }

  async getNextCode(req: Request, res: Response) {
    try {
      const nextCode = await inboundReceiptsService.getNextCode();
      return successResponse(res, { code: nextCode }, 'Lấy mã phiếu nhập tiếp theo thành công');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Lỗi khi sinh mã phiếu nhập kho', 500);
    }
  }

  async getReceiptById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await inboundReceiptsService.getReceiptById(id);
      return successResponse(res, receipt, 'Lấy chi tiết phiếu nhập kho thành công');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Lỗi khi lấy thông tin phiếu nhập kho', 404);
    }
  }

  async createReceipt(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return errorResponse(res, 'Yêu cầu xác thực danh tính', 401);

      const receipt = await inboundReceiptsService.createReceipt(req.body, userId);
      return successResponse(res, receipt, 'Tạo mới phiếu nhập kho thành công', 201);
    } catch (err: any) {
      console.error('Lỗi createReceipt:', err);
      return errorResponse(res, err.message || 'Không thể tạo phiếu nhập kho', 400);
    }
  }

  async updateReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) return errorResponse(res, 'Yêu cầu xác thực danh tính', 401);

      const updated = await inboundReceiptsService.updateReceipt(id, req.body, userId);
      return successResponse(res, updated, 'Cập nhật phiếu nhập kho thành công');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Không thể cập nhật phiếu nhập kho', 400);
    }
  }

  async verifyReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) return errorResponse(res, 'Yêu cầu xác thực danh tính', 401);

      const verified = await inboundReceiptsService.verifyReceipt(id, req.body, userId);
      return successResponse(res, verified, 'Kiểm tra thực tế hàng nhận thành công');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Không thể xác nhận kiểm hàng', 400);
    }
  }

  async approveReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) return errorResponse(res, 'Yêu cầu xác thực danh tính', 401);

      const { updateCostPrice, notes } = req.body || {};
      const approved = await inboundReceiptsService.approveReceipt(id, userId, { updateCostPrice, notes });
      return successResponse(res, approved, 'Phê duyệt phiếu nhập kho và tự động cộng tồn kho thành công');
    } catch (err: any) {
      console.error('Lỗi approveReceipt:', err);
      return errorResponse(res, err.message || 'Không thể phê duyệt phiếu nhập kho', 400);
    }
  }

  async rejectReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) return errorResponse(res, 'Yêu cầu xác thực danh tính', 401);

      const { reason } = req.body;
      if (!reason || !reason.trim()) {
        return errorResponse(res, 'Vui lòng cung cấp lý do từ chối', 400);
      }

      const rejected = await inboundReceiptsService.rejectReceipt(id, reason, userId);
      return successResponse(res, rejected, 'Từ chối duyệt phiếu nhập kho thành công');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Không thể từ chối phiếu nhập kho', 400);
    }
  }

  async cancelReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) return errorResponse(res, 'Yêu cầu xác thực danh tính', 401);

      const { reason } = req.body;
      if (!reason || !reason.trim()) {
        return errorResponse(res, 'Vui lòng cung cấp lý do hủy phiếu', 400);
      }

      const cancelled = await inboundReceiptsService.cancelReceipt(id, reason, userId);
      return successResponse(res, cancelled, 'Hủy phiếu nhập kho thành công');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Không thể hủy phiếu nhập kho', 400);
    }
  }

  async deleteReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) return errorResponse(res, 'Yêu cầu xác thực danh tính', 401);

      const result = await inboundReceiptsService.deleteReceipt(id, userId);
      return successResponse(res, result, 'Xóa phiếu nhập kho thành công');
    } catch (err: any) {
      return errorResponse(res, err.message || 'Không thể xóa phiếu nhập kho', 400);
    }
  }

  async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return errorResponse(res, 'Không tìm thấy file tải lên', 400);
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      return successResponse(
        res,
        {
          fileUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        },
        'Tải lên file chứng từ thành công'
      );
    } catch (err: any) {
      return errorResponse(res, err.message || 'Lỗi khi tải file', 500);
    }
  }
}

export const inboundReceiptsController = new InboundReceiptsController();
