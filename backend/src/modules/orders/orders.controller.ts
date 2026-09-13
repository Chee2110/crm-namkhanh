import { Request, Response } from 'express';
import { ordersService } from './orders.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class OrdersController {
  async getOrders(req: Request, res: Response) {
    try {
      const { customerId, managerId, deliveryStatus, paymentStatus, invoiceStatus, search } = req.query;
      const user = (req as any).user;
      const dataScope = (req as any).dataScope || 'ALL';

      const result = await ordersService.getOrders({
        customerId: customerId as string,
        managerId: managerId as string,
        deliveryStatus: deliveryStatus as string,
        paymentStatus: paymentStatus as string,
        invoiceStatus: invoiceStatus as string,
        search: search as string,
        dataScope,
        currentUserId: user?.id,
        departmentId: user?.departmentId
      });

      return successResponse(res, result, 'Lấy danh sách đơn hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách đơn hàng', 400);
    }
  }

  async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ordersService.getOrderById(id);
      return successResponse(res, result, 'Lấy chi tiết đơn hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết đơn hàng', 400);
    }
  }

  async createOrder(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { customerId, quotationId, deliveryAddress, contactPerson, phone, orderDate, deliveryDate, deliveryStatus, paymentStatus, invoiceStatus, paidAmount, notes, vatRate, items } = req.body;

      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return errorResponse(res, 'Vui lòng chọn khách hàng và ít nhất 1 sản phẩm', 400);
      }

      const result = await ordersService.createOrder(
        {
          customerId,
          quotationId,
          deliveryAddress,
          contactPerson,
          phone,
          orderDate,
          deliveryDate,
          deliveryStatus,
          paymentStatus,
          invoiceStatus,
          paidAmount,
          notes,
          vatRate,
          items
        },
        user?.id
      );

      return successResponse(res, result, 'Tạo đơn hàng mới thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo đơn hàng', 400);
    }
  }

  async updateOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ordersService.updateOrder(id, req.body);
      return successResponse(res, result, 'Cập nhật đơn hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật đơn hàng', 400);
    }
  }

  async handoverOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { toUserId, reason } = req.body;

      if (!toUserId || !reason) {
        return errorResponse(res, 'Nhân viên nhận bàn giao và lý do là bắt buộc', 400);
      }

      const result = await ordersService.handoverOrder(id, toUserId, reason, user?.id);
      return successResponse(res, result, 'Bàn giao đơn hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi bàn giao đơn hàng', 400);
    }
  }

  async deleteOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ordersService.deleteOrder(id);
      return successResponse(res, result, 'Xóa đơn hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa đơn hàng', 400);
    }
  }

  // Nghiệp vụ Mục IX: Hủy đơn & Hoàn tiền
  async cancelOrderWithRefund(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { refundMethod, refundReason } = req.body;

      if (refundMethod && !['CASH_REFUND', 'CREDIT_BALANCE'].includes(refundMethod)) {
        return errorResponse(res, 'Phương thức hoàn tiền không hợp lệ (CASH_REFUND, CREDIT_BALANCE)', 400);
      }

      const result = await ordersService.cancelOrderWithRefund(
        id,
        refundMethod || 'CREDIT_BALANCE',
        refundReason,
        user?.id
      );

      return successResponse(res, result, 'Hủy đơn hàng và xử lý hoàn tiền thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi hủy đơn hàng và hoàn tiền', 400);
    }
  }

  // Nghiệp vụ Mục IX: Điều chỉnh tăng/giảm tiền đơn hàng (+/-)
  async adjustOrderAmount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { adjustedAmount, reason } = req.body;

      if (adjustedAmount === undefined) {
        return errorResponse(res, 'Số tiền điều chỉnh là bắt buộc', 400);
      }

      const result = await ordersService.adjustOrderAmount(id, Number(adjustedAmount), reason || 'Điều chỉnh sau bán');
      return successResponse(res, result, 'Điều chỉnh giá trị đơn hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi điều chỉnh giá trị đơn hàng', 400);
    }
  }

  // Nghiệp vụ Mục IX.1: Đổi trả hàng / Nhập kho hoàn trả từng phần
  async createOrderReturn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { returnDate, reason, refundMethod, items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return errorResponse(res, 'Danh sách sản phẩm hoàn trả không được để trống', 400);
      }
      if (!reason) {
        return errorResponse(res, 'Lý do trả hàng là bắt buộc', 400);
      }

      const result = await ordersService.createOrderReturn(
        id,
        {
          returnDate,
          reason,
          refundMethod: refundMethod || 'DEDUCT_DEBT',
          items
        },
        user?.id
      );

      return successResponse(res, result, 'Lập phiếu đổi trả hàng và cập nhật kho thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi khi lập phiếu đổi trả hàng', 400);
    }
  }

  async getOrderReturns(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ordersService.getOrderReturns(id);
      return successResponse(res, result, 'Lấy danh sách phiếu đổi trả hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách phiếu đổi trả', 400);
    }
  }
}

export const ordersController = new OrdersController();

