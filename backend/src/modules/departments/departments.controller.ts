import { Request, Response } from 'express';
import { departmentsService } from './departments.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class DepartmentsController {
  async getDepartments(req: Request, res: Response) {
    try {
      const format = (req.query.format as 'flat' | 'tree') || 'tree';
      const status = req.query.status as string;
      const search = req.query.search as string;

      const result = await departmentsService.getDepartments(format, status, search);
      return successResponse(res, result, 'Lấy danh sách đơn vị thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách đơn vị', 400);
    }
  }

  async getDepartmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await departmentsService.getDepartmentById(id);
      return successResponse(res, result, 'Lấy chi tiết đơn vị thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết đơn vị', 400);
    }
  }

  async createDepartment(req: Request, res: Response) {
    try {
      const { code, name, parentId, managerId, address, mission, avatarUrl, status } = req.body;
      if (!code || !name) {
        return errorResponse(res, 'Mã đơn vị và Tên đơn vị là bắt buộc', 400);
      }

      const result = await departmentsService.createDepartment({
        code,
        name,
        parentId,
        managerId,
        address,
        mission,
        avatarUrl,
        status
      });

      return successResponse(res, result, 'Tạo mới đơn vị phòng ban thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo mới đơn vị', 400);
    }
  }

  async updateDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await departmentsService.updateDepartment(id, req.body);
      return successResponse(res, result, 'Cập nhật thông tin đơn vị thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật đơn vị', 400);
    }
  }

  async deleteDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await departmentsService.deleteDepartment(id);
      return successResponse(res, null, 'Xóa đơn vị phòng ban thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi khi xóa đơn vị', 400);
    }
  }

  async uploadLogo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!req.file) {
        return errorResponse(res, 'Vui lòng chọn file hình ảnh', 400);
      }
      const avatarUrl = `/uploads/${req.file.filename}`;
      const result = await departmentsService.updateDepartment(id, { avatarUrl });
      return successResponse(res, result, 'Tải lên logo phòng ban thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tải lên logo', 400);
    }
  }
}

export const departmentsController = new DepartmentsController();
