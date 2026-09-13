import { Request, Response } from 'express';
import { usersService } from './users.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class UsersController {
  async getUsers(req: Request, res: Response) {
    try {
      const { page, pageSize, search, departmentId, roleId, status } = req.query;
      const currentUser = req.user!;

      const result = await usersService.getUsers({
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        search: search as string,
        departmentId: departmentId as string,
        roleId: roleId as string,
        status: status as string,
        currentUser
      });

      return successResponse(res, result.items, 'Lấy danh sách nhân sự thành công', 200, result.meta);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách người dùng', 400);
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await usersService.getUserById(id, currentUser);
      return successResponse(res, result, 'Lấy thông tin người dùng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết người dùng', 400);
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const { code, fullName, email, phone, dob, departmentId, managerId, roleIds, basicSalary, allowance, startDate, avatarUrl, status, password } = req.body;
      if (!code || !fullName || !email) {
        return errorResponse(res, 'Mã nhân viên, Họ tên và Email là bắt buộc', 400);
      }

      const currentUser = req.user!;
      const result = await usersService.createUser(
        {
          code,
          fullName,
          email,
          password,
          phone,
          dob,
          departmentId,
          managerId,
          roleIds,
          basicSalary,
          allowance,
          startDate,
          avatarUrl,
          status
        },
        currentUser
      );

      return successResponse(res, result, 'Tạo mới người dùng thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo người dùng', 400);
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await usersService.updateUser(id, req.body, currentUser);
      return successResponse(res, result, 'Cập nhật thông tin người dùng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật người dùng', 400);
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
        return errorResponse(res, 'Trạng thái phải là ACTIVE hoặc INACTIVE', 400);
      }

      const result = await usersService.updateStatus(id, status);
      return successResponse(res, result, 'Cập nhật trạng thái người dùng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật trạng thái', 400);
    }
  }

  async uploadAvatar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      if (!req.file) {
        return errorResponse(res, 'Vui lòng chọn file hình ảnh đại diện', 400);
      }
      const avatarUrl = `/uploads/${req.file.filename}`;
      const result = await usersService.updateUser(id, { avatarUrl }, currentUser);
      return successResponse(res, result, 'Tải lên ảnh đại diện thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tải lên ảnh đại diện', 400);
    }
  }
}

export const usersController = new UsersController();
