import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { Prisma } from '@prisma/client';

import authRoutes from './modules/auth/auth.routes';
import departmentsRoutes from './modules/departments/departments.routes';
import usersRoutes from './modules/users/users.routes';
import rolesRoutes from './modules/roles/roles.routes';
import documentsRoutes from './modules/documents/documents.routes';

// Các tuyến API Phân hệ B & Master Data
import productsRoutes from './modules/products/products.routes';
import customersRoutes from './modules/customers/customers.routes';
import quotationsRoutes from './modules/quotations/quotations.routes';
import ordersRoutes from './modules/orders/orders.routes';
import salesOverviewRoutes from './modules/sales-overview/sales-overview.routes';
import salesReportsRoutes from './modules/sales-reports/sales-reports.routes';
import salesPlansRoutes from './modules/sales-plans/sales-plans.routes';

// Các tuyến API Phân hệ C (Kho & Hàng hóa)
import warehousesRoutes from './modules/warehouses/warehouses.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import productTypesRoutes from './modules/product-types/product-types.routes';
import suppliersRoutes from './modules/suppliers/suppliers.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';

// Các tuyến API Phân hệ E (Thu - Chi & Tài chính)
import expenseCategoriesRoutes from './modules/finances/expense-categories/expense-categories.routes';
import revenueTypesRoutes from './modules/finances/revenue-types/revenue-types.routes';
import paymentVouchersRoutes from './modules/finances/payment-vouchers/payment-vouchers.routes';
import receiptVouchersRoutes from './modules/finances/receipt-vouchers/receipt-vouchers.routes';
import cashflowReportsRoutes from './modules/finances/cashflow-reports/cashflow-reports.routes';

// Tuyến API Phân hệ F (Dashboard điều hành kinh doanh & lợi nhuận)
import dashboardRoutes from './modules/dashboard/dashboard.routes';

import { errorResponse } from './common/utils/response';

dotenv.config();

const app = express();

// Middleware toàn cục
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files cho thư mục uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    company: 'Công ty TNHH NK Nam Khánh',
    field: 'Chuyên cung cấp Văn phòng phẩm & Thiết bị văn phòng',
    service: 'CRM Nam Khánh Core API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Các tuyến API Phân hệ A
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/departments', departmentsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/documents', documentsRoutes);

// Các tuyến API Phân hệ B (Kinh doanh & Bán hàng) & Hàng hóa
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/customers', customersRoutes);
app.use('/api/v1/quotations', quotationsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/sales-overview', salesOverviewRoutes);
app.use('/api/v1/sales-reports', salesReportsRoutes);
app.use('/api/v1/sales-plans', salesPlansRoutes);

// Các tuyến API Phân hệ C (Kho & Hàng hóa)
app.use('/api/v1/warehouses', warehousesRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/product-types', productTypesRoutes);
app.use('/api/v1/suppliers', suppliersRoutes);
app.use('/api/v1/inventory', inventoryRoutes);

// Các tuyến API Phân hệ E (Thu - Chi & Tài chính Doanh nghiệp)
app.use('/api/v1/expense-categories', expenseCategoriesRoutes);
app.use('/api/v1/revenue-types', revenueTypesRoutes);
app.use('/api/v1/payment-vouchers', paymentVouchersRoutes);
app.use('/api/v1/receipt-vouchers', receiptVouchersRoutes);
app.use('/api/v1/cashflow-reports', cashflowReportsRoutes);

// Tuyến API Phân hệ F (Dashboard điều hành)
app.use('/api/v1/dashboard', dashboardRoutes);

// Bắt lỗi 404
app.use((req: Request, res: Response) => {
  errorResponse(res, `Không tìm thấy tài nguyên: [${req.method}] ${req.originalUrl}`, 404);
});

// Bắt lỗi toàn cục
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  // Never expose database credentials, Prisma queries, or stack traces to clients.
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err?.errorCode === 'P1000' ||
    err?.code === 'P2021'
  ) {
    return errorResponse(res, 'Không thể kết nối cơ sở dữ liệu. Vui lòng liên hệ quản trị viên.', 503);
  }

  errorResponse(res, err.status && err.status < 500 ? err.message : 'Lỗi máy chủ nội bộ', err.status || 500);
});

export default app;
