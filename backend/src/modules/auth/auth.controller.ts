import { Request, Response } from 'express';
import { authService } from './auth.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return errorResponse(res, 'Vui lòng nhập đầy đủ Email và Mật khẩu', 400);
      }

      const result = await authService.login(email, password);
      return successResponse(res, result, 'Đăng nhập thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi đăng nhập', 400);
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'Chưa xác thực', 401);
      }

      const result = await authService.getMe(userId);
      return successResponse(res, result, 'Lấy thông tin tài khoản thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy thông tin tài khoản', 400);
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return errorResponse(res, 'Vui lòng nhập Email để khôi phục mật khẩu', 400);
      }

      const result = await authService.forgotPassword(email);
      return successResponse(res, result, 'Yêu cầu khôi phục mật khẩu đã được xử lý');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xử lý quên mật khẩu', 400);
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { email, newPassword, otp } = req.body;
      if (!email || !newPassword) {
        return errorResponse(res, 'Vui lòng cung cấp đầy đủ Email và Mật khẩu mới', 400);
      }

      const result = await authService.resetPassword(email, newPassword, otp);
      return successResponse(res, result, 'Đặt lại mật khẩu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi đặt lại mật khẩu', 400);
    }
  }

  async googleLogin(req: Request, res: Response) {
    try {
      const { email, fullName } = req.body;
      if (!email) {
        return errorResponse(res, 'Vui lòng cung cấp email Google để đăng nhập', 400);
      }

      const result = await authService.googleLogin(email, fullName);
      return successResponse(res, result, 'Đăng nhập Google Workspace SSO thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi đăng nhập Google SSO', 400);
    }
  }
}

export const authController = new AuthController();
