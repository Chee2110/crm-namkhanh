import { Request, Response } from 'express';
import { rolesService } from './roles.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class RolesController {
  async getRoles(req: Request, res: Response) {
    try {
      const result = await rolesService.getRoles();
      return successResponse(res, result, 'Lấy danh sách vai trò thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách vai trò', 400);
    }
  }

  async getRoleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await rolesService.getRoleById(id);
      return successResponse(res, result, 'Lấy chi tiết vai trò thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết vai trò', 400);
    }
  }

  async createRole(req: Request, res: Response) {
    try {
      const { code, name, description } = req.body;
      if (!code || !name) {
        return errorResponse(res, 'Mã vai trò và Tên vai trò là bắt buộc', 400);
      }

      const result = await rolesService.createRole({ code, name, description });
      return successResponse(res, result, 'Tạo vai trò mới thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo vai trò', 400);
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await rolesService.updateRole(id, req.body);
      return successResponse(res, result, 'Cập nhật vai trò thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật vai trò', 400);
    }
  }

  async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await rolesService.deleteRole(id);
      return successResponse(res, null, 'Xóa vai trò thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa vai trò', 400);
    }
  }

  async getRolePermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await rolesService.getRolePermissions(id);
      return successResponse(res, result, 'Lấy ma trận phân quyền thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy ma trận phân quyền', 400);
    }
  }

  async updateRolePermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        return errorResponse(res, 'Dữ liệu phân quyền phải là một mảng', 400);
      }

      const result = await rolesService.updateRolePermissions(id, permissions);
      return successResponse(res, result, 'Cập nhật ma trận phân quyền thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật ma trận phân quyền', 400);
    }
  }

  async getModules(req: Request, res: Response) {
    try {
      const modules = rolesService.getModules();
      return successResponse(res, modules, 'Lấy danh mục các module thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh mục module', 400);
    }
  }
}

export const rolesController = new RolesController();
