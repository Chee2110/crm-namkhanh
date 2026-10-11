import { Request, Response } from 'express';
import { customersService } from './customers.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class CustomersController {
  async getCustomers(req: Request, res: Response) {
    try {
      const { search, customerType, source, managerId, status, highDebtOnly, minDebt } = req.query;
      const user = (req as any).user;
      const dataScope = (req as any).dataScope || 'ALL';

      const result = await customersService.getCustomers({
        search: search as string,
        customerType: customerType as string,
        source: source as string,
        managerId: managerId as string,
        status: status as string,
        highDebtOnly: highDebtOnly === 'true',
        minDebt: minDebt !== undefined && minDebt !== null && minDebt !== '' ? Number(minDebt) : undefined,
        dataScope,
        currentUserId: user?.id,
        departmentId: user?.departmentId
      });

      return successResponse(res, result, 'Lấy danh sách khách hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách khách hàng', 400);
    }
  }

  async getCustomerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await customersService.getCustomerById(id);
      return successResponse(res, result, 'Lấy thông tin khách hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy thông tin khách hàng', 400);
    }
  }

  async createCustomer(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { name, phone, taxCode, address, deliveryAddress, customerType, source, contactPerson, contactPhone, email, notes, managerId, code, status, creditLimit, maxDebtDays } = req.body;

      if (!name || !phone) {
        return errorResponse(res, 'Tên khách hàng và Số điện thoại là bắt buộc', 400);
      }

      const result = await customersService.createCustomer(
        {
          name,
          phone,
          taxCode,
          address,
          deliveryAddress,
          customerType,
          source,
          contactPerson,
          contactPhone,
          email,
          notes,
          managerId,
          code,
          status,
          creditLimit,
          maxDebtDays
        },
        user?.id
      );

      return successResponse(res, result, 'Tạo khách hàng mới thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo khách hàng', 400);
    }
  }

  async importCustomers(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { rows } = req.body || {};

      if (!Array.isArray(rows) || rows.length === 0) {
        return errorResponse(res, 'Không có dữ liệu khách hàng để nhập', 400);
      }
      if (rows.length > 1000) {
        return errorResponse(res, 'Mỗi lần gửi tối đa 1000 dòng', 400);
      }

      const result = await customersService.importCustomers(rows, user?.id);
      return successResponse(
        res,
        result,
        `Đã nhập ${result.successCount}/${result.total} khách hàng`
      );
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi nhập danh sách khách hàng', 400);
    }
  }

  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await customersService.updateCustomer(id, req.body);
      return successResponse(res, result, 'Cập nhật thông tin khách hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật khách hàng', 400);
    }
  }

  async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result: any = await customersService.deleteCustomer(id);
      const msg = result.isSoftDeleted
        ? 'Khách hàng đã có đơn hàng/báo giá phát sinh nên hệ thống chuyển trạng thái sang Tạm dừng (INACTIVE)'
        : 'Xóa vĩnh viễn khách hàng thành công';
      return successResponse(res, result, msg);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa khách hàng', 400);
    }
  }

  async handoverCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { toUserId, reason } = req.body;

      if (!toUserId || !reason) {
        return errorResponse(res, 'Nhân viên nhận bàn giao và lý do bàn giao là bắt buộc', 400);
      }

      const result = await customersService.handoverCustomer(id, toUserId, reason, user?.id);
      return successResponse(res, result, 'Bàn giao khách hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi bàn giao khách hàng', 400);
    }
  }

  async getCustomerTimeline(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await customersService.getCustomerTimeline(id);
      return successResponse(res, result, 'Lấy lịch sử giao dịch khách hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy timeline khách hàng', 400);
    }
  }

  async getCustomerDebtStatement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await customersService.getCustomerDebtStatement(id);
      return successResponse(res, result, 'Lấy biên bản đối chiếu công nợ thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy đối chiếu công nợ', 400);
    }
  }
}

export const customersController = new CustomersController();
