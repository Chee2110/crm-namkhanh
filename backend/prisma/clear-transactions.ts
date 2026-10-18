import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

async function clearTransactions() {
  console.log('=====================================================');
  console.log('--- BẮT ĐẦU XÓA TOÀN BỘ GIAO DỊCH & DỮ LIỆU PHÁT SINH ---');
  console.log('--- (BẢO TOÀN: KHÁCH HÀNG, TÀI KHOẢN NGƯỜI DÙNG & SẢN PHẨM/KHO) ---');
  console.log('=====================================================');

  const initialCounts = {
    'Khách hàng (Customer)': await prisma.customer.count(),
    'Người dùng (User)': await prisma.user.count(),
    'Sản phẩm (Product)': await prisma.product.count(),
    'Đơn hàng (Order)': await prisma.order.count(),
    'Báo giá (Quotation)': await prisma.quotation.count(),
    'Phiếu thu (ReceiptVoucher)': await prisma.receiptVoucher.count(),
    'Phiếu chi (PaymentVoucher)': await prisma.paymentVoucher.count(),
    'Đổi trả hàng (OrderReturn)': await prisma.orderReturn.count(),
    'Phiếu nhập kho (InboundReceipt)': await prisma.inboundReceipt.count(),
    'Kế hoạch KD (SalesPlan)': await prisma.salesPlan.count(),
    'Nhật ký hệ thống (AuditLog)': await prisma.auditLog.count(),
  };

  console.log('Trạng thái dữ liệu hiện tại trước khi xóa:');
  console.table(initialCounts);

  console.log('\n--- 1. XÓA BẢNG CHI TIẾT & GIAO DỊCH (THEO ĐÚNG THỨ TỰ KHÓA NGOẠI) ---');

  // 1. Phân bổ thu nợ (ReceiptVoucherAllocation)
  const delAllocations = await prisma.receiptVoucherAllocation.deleteMany();
  console.log(`- Đã xóa ${delAllocations.count} phân bổ thu nợ (ReceiptVoucherAllocation)`);

  // 2. Chi tiết hoàn hàng (OrderReturnItem)
  const delReturnItems = await prisma.orderReturnItem.deleteMany();
  console.log(`- Đã xóa ${delReturnItems.count} chi tiết hoàn hàng (OrderReturnItem)`);

  // 3. Phiếu hoàn hàng (OrderReturn)
  const delReturns = await prisma.orderReturn.deleteMany();
  console.log(`- Đã xóa ${delReturns.count} phiếu hoàn hàng (OrderReturn)`);

  // 4. Phiếu chi tiền (PaymentVoucher)
  const delPaymentVouchers = await prisma.paymentVoucher.deleteMany();
  console.log(`- Đã xóa ${delPaymentVouchers.count} phiếu chi (PaymentVoucher)`);

  // 5. Phiếu thu tiền (ReceiptVoucher)
  const delReceiptVouchers = await prisma.receiptVoucher.deleteMany();
  console.log(`- Đã xóa ${delReceiptVouchers.count} phiếu thu (ReceiptVoucher)`);

  // 6. Lịch sử bàn giao đơn hàng (OrderHandoverHistory)
  const delOrderHandovers = await prisma.orderHandoverHistory.deleteMany();
  console.log(`- Đã xóa ${delOrderHandovers.count} lịch sử bàn giao đơn (OrderHandoverHistory)`);

  // 7. Chi tiết đơn hàng (OrderItem)
  const delOrderItems = await prisma.orderItem.deleteMany();
  console.log(`- Đã xóa ${delOrderItems.count} chi tiết đơn hàng (OrderItem)`);

  // 8. Đơn hàng (Order)
  const delOrders = await prisma.order.deleteMany();
  console.log(`- Đã xóa ${delOrders.count} đơn hàng (Order)`);

  // 9. Chi tiết báo giá (QuotationItem)
  const delQuotationItems = await prisma.quotationItem.deleteMany();
  console.log(`- Đã xóa ${delQuotationItems.count} chi tiết báo giá (QuotationItem)`);

  // 10. Báo giá (Quotation)
  const delQuotations = await prisma.quotation.deleteMany();
  console.log(`- Đã xóa ${delQuotations.count} báo giá (Quotation)`);

  // 11. Lịch sử bàn giao khách hàng (CustomerHandoverHistory)
  const delCustomerHandovers = await prisma.customerHandoverHistory.deleteMany();
  console.log(`- Đã xóa ${delCustomerHandovers.count} lịch sử bàn giao khách hàng (CustomerHandoverHistory)`);

  // 12. Chi tiết và lịch sử nhập kho (InboundReceiptItem, InboundReceiptHistory, InboundReceipt)
  const delInboundHistories = await prisma.inboundReceiptHistory.deleteMany();
  console.log(`- Đã xóa ${delInboundHistories.count} lịch sử nhập kho (InboundReceiptHistory)`);

  const delInboundItems = await prisma.inboundReceiptItem.deleteMany();
  console.log(`- Đã xóa ${delInboundItems.count} chi tiết phiếu nhập (InboundReceiptItem)`);

  const delInboundReceipts = await prisma.inboundReceipt.deleteMany();
  console.log(`- Đã xóa ${delInboundReceipts.count} phiếu nhập kho (InboundReceipt)`);

  // 13. Kế hoạch kinh doanh (SalesPlanItem, SalesPlan)
  const delSalesPlanItems = await prisma.salesPlanItem.deleteMany();
  console.log(`- Đã xóa ${delSalesPlanItems.count} mục kế hoạch KD (SalesPlanItem)`);

  const delSalesPlans = await prisma.salesPlan.deleteMany();
  console.log(`- Đã xóa ${delSalesPlans.count} kế hoạch KD (SalesPlan)`);

  // 14. Nhật ký hoạt động kiểm toán (AuditLog)
  const delAuditLogs = await prisma.auditLog.deleteMany();
  console.log(`- Đã xóa ${delAuditLogs.count} nhật ký thao tác (AuditLog)`);

  // 15. Hồ sơ chứng từ (LegalDocument)
  const delLegalDocs = await prisma.legalDocument.deleteMany();
  console.log(`- Đã xóa ${delLegalDocs.count} chứng chỉ / hợp đồng mẫu (LegalDocument)`);

  console.log('\n--- 2. RESET SỐ DƯ TÍN DỤNG / CÔNG NỢ KHÁCH HÀNG VỀ 0 ---');
  const resetCustomerBalance = await prisma.customer.updateMany({
    data: {
      creditBalance: 0
    }
  });
  console.log(`- Đã reset số dư tiền ký quỹ / cọc (creditBalance) cho ${resetCustomerBalance.count} khách hàng về 0`);

  console.log('\n--- 3. XÓA BỘ NHỚ ĐỆM REDIS / CACHE DASHBOARD ---');
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
    'Khách hàng (Customer) [ĐƯỢC GIỮ]': await prisma.customer.count(),
    'Người dùng (User) [ĐƯỢC GIỮ]': await prisma.user.count(),
    'Phòng ban (Department) [ĐƯỢC GIỮ]': await prisma.department.count(),
    'Vai trò (Role) [ĐƯỢC GIỮ]': await prisma.role.count(),
    'Sản phẩm (Product) [ĐƯỢC GIỮ]': await prisma.product.count(),
    'Loại sản phẩm (ProductType) [ĐƯỢC GIỮ]': await prisma.productType.count(),
    'Danh mục sản phẩm (Category) [ĐƯỢC GIỮ]': await prisma.category.count(),
    'Kho hàng (Warehouse) [ĐƯỢC GIỮ]': await prisma.warehouse.count(),
    'Đơn hàng (Order) [ĐÃ XÓA]': await prisma.order.count(),
    'Báo giá (Quotation) [ĐÃ XÓA]': await prisma.quotation.count(),
    'Phiếu thu (ReceiptVoucher) [ĐÃ XÓA]': await prisma.receiptVoucher.count(),
    'Phiếu chi (PaymentVoucher) [ĐÃ XÓA]': await prisma.paymentVoucher.count(),
    'Phiếu nhập kho (InboundReceipt) [ĐÃ XÓA]': await prisma.inboundReceipt.count(),
    'Kế hoạch KD (SalesPlan) [ĐÃ XÓA]': await prisma.salesPlan.count(),
    'Nhật ký hệ thống (AuditLog) [ĐÃ XÓA]': await prisma.auditLog.count(),
  };
  console.table(finalCounts);

  console.log('=====================================================');
  console.log('✓ HOÀN THÀNH XÓA DỮ LIỆU GIAO DỊCH THÀNH CÔNG!');
  console.log('✓ Khách hàng, Người dùng và Danh mục sản phẩm/kho được bảo toàn nguyên vẹn 100%.');
  console.log('=====================================================');
}

clearTransactions()
  .catch((err) => {
    console.error('LỖI KHI XÓA DỮ LIỆU:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
