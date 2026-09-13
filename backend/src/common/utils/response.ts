import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
  errors?: any;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Thao tác thành công',
  statusCode = 200,
  meta?: ApiResponse['meta']
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta
  });
};

export const errorResponse = (
  res: Response,
  message = 'Có lỗi xảy ra',
  statusCode = 400,
  errors?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
