import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

async function clearTransactions() {
  console.log('=====================================================');
  console.log('--- BẮT ĐẦU XÓA TOÀN BỘ DỮ LIỆU TRÊN WEB ---');
  console.log('--- (CHỈ GIỮ LẠI: QUẢN TRỊ NỀN TẢNG & KHÁCH HÀNG) ---');
  console.log('=====================================================');

  const initialCounts = {
    '[GIỮ] Cơ cấu tổ chức (Department)': await prisma.department.count(),
    '[GIỮ] Người dùng (User)': await prisma.user.count(),
    '[GIỮ] Vai trò (Role)': await prisma.role.count(),
    '[GIỮ] Phân quyền (RolePermission)': await prisma.rolePermission.count(),
    '[GIỮ] Hồ sơ & CO-CQ (LegalDocument)': await prisma.legalDocument.count(),
    '[GIỮ] Khách hàng (Customer)': await prisma.customer.count(),
    '[XÓA] Sản phẩm (Product)': await prisma.product.count(),
    '[XÓA] Nhóm loại (ProductGroup)': await prisma.productGroup.count(),
    '[XÓA] Kho vật lý (Warehouse)': await prisma.warehouse.count(),
    '[XÓA] Nhà cung cấp (Supplier)': await prisma.supplier.count(),
    '[XÓA] Đơn hàng (Order)': await prisma.order.count(),
    '[XÓA] Báo giá (Quotation)': await prisma.quotation.count(),
    '[XÓA] Phiếu thu (ReceiptVoucher)': await prisma.receiptVoucher.count(),
    '[XÓA] Phiếu chi (PaymentVoucher)': await prisma.paymentVoucher.count(),
    '[XÓA] Phiếu nhập kho (InboundReceipt)': await prisma.inboundReceipt.count(),
    '[XÓA] Kế hoạch KD (SalesPlan)': await prisma.salesPlan.count(),
  };

  console.log('Trạng thái dữ liệu hiện tại trước khi xóa:');
  console.table(initialCounts);

  console.log('\n--- 1. XÓA GIAO DỊCH KINH DOANH, TÀI CHÍNH & NHẬP KHO ---');

  // 1. Phân bổ thu nợ (ReceiptVoucherAllocation)
  const delAllocations = await prisma.receiptVoucherAllocation.deleteMany();
  console.log(`- Đã xóa ${delAllocations.count} phân bổ thu nợ (ReceiptVoucherAllocation)`);

  // 2. Chi tiết & Phiếu hoàn hàng (OrderReturnItem, OrderReturn)
  const delReturnItems = await prisma.orderReturnItem.deleteMany();
  const delReturns = await prisma.orderReturn.deleteMany();
  console.log(`- Đã xóa ${delReturns.count} phiếu hoàn hàng & ${delReturnItems.count} dòng chi tiết`);

  // 3. Phiếu chi & Phiếu thu (PaymentVoucher, ReceiptVoucher)
  const delPaymentVouchers = await prisma.paymentVoucher.deleteMany();
  const delReceiptVouchers = await prisma.receiptVoucher.deleteMany();
  console.log(`- Đã xóa ${delPaymentVouchers.count} phiếu chi & ${delReceiptVouchers.count} phiếu thu`);

  // 4. Lịch sử bàn giao, Chi tiết & Đơn hàng (OrderHandoverHistory, OrderItem, Order)
  const delOrderHandovers = await prisma.orderHandoverHistory.deleteMany();
  const delOrderItems = await prisma.orderItem.deleteMany();
  const delOrders = await prisma.order.deleteMany();
  console.log(`- Đã xóa ${delOrders.count} đơn hàng, ${delOrderItems.count} chi tiết & ${delOrderHandovers.count} lịch sử bàn giao`);

  // 5. Chi tiết & Báo giá (QuotationItem, Quotation)
  const delQuotationItems = await prisma.quotationItem.deleteMany();
  const delQuotations = await prisma.quotation.deleteMany();
  console.log(`- Đã xóa ${delQuotations.count} báo giá & ${delQuotationItems.count} chi tiết báo giá`);

  // 6. Nhập kho (InboundReceiptHistory, InboundReceiptItem, InboundReceipt)
  const delInboundHistories = await prisma.inboundReceiptHistory.deleteMany();
  const delInboundItems = await prisma.inboundReceiptItem.deleteMany();
  const delInboundReceipts = await prisma.inboundReceipt.deleteMany();
  console.log(`- Đã xóa ${delInboundReceipts.count} phiếu nhập kho, ${delInboundItems.count} chi tiết & ${delInboundHistories.count} lịch sử`);

  // 7. Kế hoạch kinh doanh (SalesPlanItem, SalesPlan)
  const delSalesPlanItems = await prisma.salesPlanItem.deleteMany();
  const delSalesPlans = await prisma.salesPlan.deleteMany();
  console.log(`- Đã xóa ${delSalesPlans.count} kế hoạch KD & ${delSalesPlanItems.count} mục chi tiết`);

  console.log('\n--- 2. XÓA DỮ LIỆU KHO & HÀNG HÓA (SẢN PHẨM, NHÓM LOẠI, NCC, KHO) ---');

  const delProducts = await prisma.product.deleteMany();
  console.log(`- Đã xóa ${delProducts.count} sản phẩm (Product)`);

  const delProductGroups = await prisma.productGroup.deleteMany();
  console.log(`- Đã xóa ${delProductGroups.count} nhóm loại (ProductGroup)`);

  const delProductTypes = await prisma.productType.deleteMany();
  console.log(`- Đã xóa ${delProductTypes.count} loại hàng hóa (ProductType)`);

  const delCategories = await prisma.category.deleteMany();
  console.log(`- Đã xóa ${delCategories.count} danh mục hàng hóa (Category)`);

  const delSuppliers = await prisma.supplier.deleteMany();
  console.log(`- Đã xóa ${delSuppliers.count} nhà cung cấp (Supplier)`);

  const delWarehouses = await prisma.warehouse.deleteMany();
  console.log(`- Đã xóa ${delWarehouses.count} kho vật lý (Warehouse)`);

  // Tạo lại kho mặc định NK01 - Kho số 1 để sẵn sàng nhập Excel hàng hóa mới
  await prisma.warehouse.create({
    data: {
      code: 'NK01',
      name: 'Kho số 1',
      status: 'ACTIVE'
    }
  });
  console.log(`- Đã khởi tạo lại kho mặc định: NK01 - Kho số 1`);

  // 8. Nhật ký hoạt động (AuditLog)
  const delAuditLogs = await prisma.auditLog.deleteMany();
  console.log(`- Đã xóa ${delAuditLogs.count} nhật ký thao tác (AuditLog)`);

  console.log('\n--- 3. RESET SỐ DƯ TÍN DỤNG / ĐẶT CỌC CỦA KHÁCH HÀNG VỀ 0 ---');
  const resetCustomerBalance = await prisma.customer.updateMany({
    data: {
      creditBalance: 0
    }
  });
  console.log(`- Đã reset số dư tiền cọc (creditBalance) cho ${resetCustomerBalance.count} khách hàng về 0`);

  console.log('\n--- 4. XÓA BỘ NHỚ ĐỆM REDIS / CACHE DASHBOARD ---');
  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });
    await redis.connect();
    await redis.flushall();
    console.log(`- Đã làm sạch toàn bộ Redis cache thành công`);
    redis.disconnect();
  } catch (err: any) {
    console.log(`- Lưu ý: Bỏ qua dọn dẹp Redis (${err.message})`);
  }

  console.log('\n=====================================================');
  console.log('--- KIỂM TRA SỐ LIỆU HỆ THỐNG SAU KHI DỌN DẸP ---');
  const finalCounts = {
    '[GIỮ] Cơ cấu tổ chức (Department)': await prisma.department.count(),
    '[GIỮ] Người dùng (User)': await prisma.user.count(),
    '[GIỮ] Vai trò (Role)': await prisma.role.count(),
    '[GIỮ] Phân quyền (RolePermission)': await prisma.rolePermission.count(),
    '[GIỮ] Hồ sơ & CO-CQ (LegalDocument)': await prisma.legalDocument.count(),
    '[GIỮ] Khách hàng (Customer)': await prisma.customer.count(),
    '[MẶC ĐỊNH] Kho NK01 (Warehouse)': await prisma.warehouse.count(),
    '[ĐÃ XÓA] Sản phẩm (Product)': await prisma.product.count(),
    '[ĐÃ XÓA] Nhóm loại (ProductGroup)': await prisma.productGroup.count(),
    '[ĐÃ XÓA] Nhà cung cấp (Supplier)': await prisma.supplier.count(),
    '[ĐÃ XÓA] Đơn hàng (Order)': await prisma.order.count(),
    '[ĐÃ XÓA] Báo giá (Quotation)': await prisma.quotation.count(),
    '[ĐÃ XÓA] Phiếu thu (ReceiptVoucher)': await prisma.receiptVoucher.count(),
    '[ĐÃ XÓA] Phiếu chi (PaymentVoucher)': await prisma.paymentVoucher.count(),
    '[ĐÃ XÓA] Phiếu nhập kho (InboundReceipt)': await prisma.inboundReceipt.count(),
    '[ĐÃ XÓA] Kế hoạch KD (SalesPlan)': await prisma.salesPlan.count(),
  };
  console.table(finalCounts);

  console.log('=====================================================');
  console.log('✓ HOÀN THÀNH XÓA DỮ LIỆU THÀNH CÔNG!');
  console.log('✓ Toàn bộ phân hệ QUẢN TRỊ NỀN TẢNG và KHÁCH HÀNG được giữ nguyên 100%.');
  console.log('=====================================================');
}

clearTransactions()
  .catch((err) => {
    console.error('LỖI KHI XÓA DỮ LIỆU:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
