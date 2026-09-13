import { Request, Response } from 'express';
import { customersService } from './customers.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class CustomersController {
  async getCustomers(req: Request, res: Response) {
    try {
      const { search, customerType, source, managerId, status } = req.query;
      const user = (req as any).user;
      const dataScope = (req as any).dataScope || 'ALL';

      const result = await customersService.getCustomers({
        search: search as string,
        customerType: customerType as string,
        source: source as string,
        managerId: managerId as string,
        status: status as string,
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
      const { name, phone, taxCode, address, deliveryAddress, customerType, source, contactPerson, email, notes, managerId, code, status } = req.body;

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
          email,
          notes,
          managerId,
          code,
          status
        },
        user?.id
      );

      return successResponse(res, result, 'Tạo khách hàng mới thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo khách hàng', 400);
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
      const result = await customersService.deleteCustomer(id);
      return successResponse(res, result, 'Xóa khách hàng thành công');
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
}

export const customersController = new CustomersController();
