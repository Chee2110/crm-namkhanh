import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('=====================================================');
  console.log('--- BẮT ĐẦU XÓA DỮ LIỆU ĐỂ TRỞ THÀNH WEB TRẮNG ---');
  console.log('=====================================================');

  const adminEmail = 'dinhhchi2110@gmail.com';

  // 1. Kiểm tra Admin user trước khi làm bất kỳ thao tác nào
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!adminUser) {
    throw new Error(`KHÔNG TÌM THẤY TÀI KHOẢN ADMIN: ${adminEmail}! Dừng để bảo vệ an toàn hệ thống.`);
  }

  console.log(`✓ Đã xác định tài khoản Admin duy nhất được giữ lại: ${adminUser.fullName} (${adminUser.email})`);

  // Gỡ bỏ liên kết managerId của User trỏ đến các user khác để tránh FK error
  await prisma.user.updateMany({
    data: { managerId: null }
  });

  // Gỡ bỏ managerId của các Department trỏ đến các user khác
  await prisma.department.updateMany({
    data: { managerId: adminUser.id }
  });

  // 2. Xóa toàn bộ dữ liệu nghiệp vụ & giao dịch (Theo đúng thứ tự phụ thuộc Khóa ngoại)
  console.log('--- 1. XÓA DỮ LIỆU GIAO DỊCH, CHỨNG TỪ & NHẬT KÝ ---');

  const deletedAllocations = await prisma.receiptVoucherAllocation.deleteMany();
  console.log(`- Đã xóa ${deletedAllocations.count} phân bổ thu nợ (ReceiptVoucherAllocation)`);

  const deletedOrderReturnItems = await prisma.orderReturnItem.deleteMany();
  console.log(`- Đã xóa ${deletedOrderReturnItems.count} chi tiết hoàn hàng (OrderReturnItem)`);

  const deletedOrderReturns = await prisma.orderReturn.deleteMany();
  console.log(`- Đã xóa ${deletedOrderReturns.count} phiếu hoàn hàng (OrderReturn)`);

  const deletedPaymentVouchers = await prisma.paymentVoucher.deleteMany();
  console.log(`- Đã xóa ${deletedPaymentVouchers.count} phiếu chi (PaymentVoucher)`);

  const deletedReceiptVouchers = await prisma.receiptVoucher.deleteMany();
  console.log(`- Đã xóa ${deletedReceiptVouchers.count} phiếu thu (ReceiptVoucher)`);

  const deletedOrderHandovers = await prisma.orderHandoverHistory.deleteMany();
  console.log(`- Đã xóa ${deletedOrderHandovers.count} lịch sử bàn giao đơn (OrderHandoverHistory)`);

  const deletedOrderItems = await prisma.orderItem.deleteMany();
  console.log(`- Đã xóa ${deletedOrderItems.count} chi tiết đơn hàng (OrderItem)`);

  const deletedOrders = await prisma.order.deleteMany();
  console.log(`- Đã xóa ${deletedOrders.count} đơn hàng (Order)`);

  const deletedQuotationItems = await prisma.quotationItem.deleteMany();
  console.log(`- Đã xóa ${deletedQuotationItems.count} chi tiết báo giá (QuotationItem)`);

  const deletedQuotations = await prisma.quotation.deleteMany();
  console.log(`- Đã xóa ${deletedQuotations.count} báo giá (Quotation)`);

  const deletedCustomerHandovers = await prisma.customerHandoverHistory.deleteMany();
  console.log(`- Đã xóa ${deletedCustomerHandovers.count} lịch sử bàn giao KH (CustomerHandoverHistory)`);

  const deletedCustomers = await prisma.customer.deleteMany();
  console.log(`- Đã xóa ${deletedCustomers.count} khách hàng (Customer)`);

  const deletedInboundHistories = await prisma.inboundReceiptHistory.deleteMany();
  console.log(`- Đã xóa ${deletedInboundHistories.count} lịch sử nhập kho (InboundReceiptHistory)`);

  const deletedInboundItems = await prisma.inboundReceiptItem.deleteMany();
  console.log(`- Đã xóa ${deletedInboundItems.count} chi tiết nhập kho (InboundReceiptItem)`);

  const deletedInboundReceipts = await prisma.inboundReceipt.deleteMany();
  console.log(`- Đã xóa ${deletedInboundReceipts.count} phiếu nhập kho (InboundReceipt)`);

  const deletedSalesPlanItems = await prisma.salesPlanItem.deleteMany();
  console.log(`- Đã xóa ${deletedSalesPlanItems.count} mục kế hoạch kinh doanh (SalesPlanItem)`);

  const deletedSalesPlans = await prisma.salesPlan.deleteMany();
  console.log(`- Đã xóa ${deletedSalesPlans.count} kế hoạch kinh doanh (SalesPlan)`);

  const deletedAuditLogs = await prisma.auditLog.deleteMany();
  console.log(`- Đã xóa ${deletedAuditLogs.count} nhật ký hoạt động (AuditLog)`);

  const deletedLegalDocs = await prisma.legalDocument.deleteMany();
  console.log(`- Đã xóa ${deletedLegalDocs.count} hồ sơ pháp lý mẫu (LegalDocument)`);

  // 3. Xóa toàn bộ danh mục sản phẩm, loại hàng, danh mục hàng, nhà cung cấp
  console.log('--- 2. XÓA DANH MỤC HÀNG HÓA & NHÀ CUNG CẤP ---');
  const deletedProducts = await prisma.product.deleteMany();
  console.log(`- Đã xóa ${deletedProducts.count} sản phẩm SKU (Product)`);

  const deletedProductTypes = await prisma.productType.deleteMany();
  console.log(`- Đã xóa ${deletedProductTypes.count} loại hàng hóa (ProductType)`);

  const deletedCategories = await prisma.category.deleteMany();
  console.log(`- Đã xóa ${deletedCategories.count} danh mục hàng hóa (Category)`);

  const deletedSuppliers = await prisma.supplier.deleteMany();
  console.log(`- Đã xóa ${deletedSuppliers.count} nhà cung cấp (Supplier)`);

  // 4. Dọn dẹp danh mục Thu - Chi (giữ lại cấu hình chuẩn từ seed)
  console.log('--- 3. DỌN DẸP DANH MỤC TÀI CHÍNH ---');
  const standardExpenseCodes = ['CP-VP', 'CP-BH', 'CP-NS'];
  const standardExpenseTypeCodes = ['LCP-THUE-NHA', 'LCP-DIEN-NUOC', 'LCP-VAN-CHUYEN', 'LCP-TIEP-KHACH'];
  const standardRevenueCodes = ['KT-BAN-HANG', 'KT-IN-AN', 'KT-HOAN-UNG'];

  const deletedExpenseTypes = await prisma.expenseType.deleteMany({
    where: { code: { notIn: standardExpenseTypeCodes } }
  });
  console.log(`- Đã xóa ${deletedExpenseTypes.count} loại chi phí rác`);

  const deletedExpenseCats = await prisma.expenseCategory.deleteMany({
    where: { code: { notIn: standardExpenseCodes } }
  });
  console.log(`- Đã xóa ${deletedExpenseCats.count} danh mục chi phí rác`);

  const deletedRevenueTypes = await prisma.revenueType.deleteMany({
    where: { code: { notIn: standardRevenueCodes } }
  });
  console.log(`- Đã xóa ${deletedRevenueTypes.count} nhóm khoản thu rác`);

  // 5. Dọn dẹp Kho vật lý: Chỉ giữ lại 2 kho chuẩn KHO-TONG & KHO-TRUNG-TAM
  console.log('--- 4. DỌN DẸP KHO VẬT LÝ ---');
  const standardWarehouseCodes = ['KHO-TONG', 'KHO-TRUNG-TAM'];
  const deletedWarehouses = await prisma.warehouse.deleteMany({
    where: { code: { notIn: standardWarehouseCodes } }
  });
  console.log(`- Đã xóa ${deletedWarehouses.count} kho demo phụ`);

  // 6. Dọn dẹp Cơ cấu tổ chức: Giữ lại 6 phòng ban chuẩn
  console.log('--- 5. DỌN DẸP PHÒNG BAN ---');
  const standardDeptCodes = ['BGD', 'KKD', 'PKD1', 'PKD2', 'PKT', 'PKHO'];
  const deletedDepts = await prisma.department.deleteMany({
    where: { code: { notIn: standardDeptCodes } }
  });
  console.log(`- Đã xóa ${deletedDepts.count} phòng ban/nhóm demo`);

  // Đảm bảo department của Admin trỏ về BGD
  const bgdDept = await prisma.department.findUnique({ where: { code: 'BGD' } });
  if (bgdDept) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { departmentId: bgdDept.id }
    });
  }

  // 7. Xóa toàn bộ Người dùng demo (giữ duy nhất adminUser)
  console.log('--- 6. DỌN DẸP TÀI KHOẢN NGƯỜI DÙNG ---');
  // Xóa user_roles của các user demo
  const otherUsers = await prisma.user.findMany({
    where: { email: { not: adminEmail } },
    select: { id: true }
  });
  const otherUserIds = otherUsers.map(u => u.id);

  if (otherUserIds.length > 0) {
    const deletedUserRoles = await prisma.userRole.deleteMany({
      where: { userId: { in: otherUserIds } }
    });
    console.log(`- Đã xóa ${deletedUserRoles.count} liên kết vai trò của user demo`);

    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: otherUserIds } }
    });
    console.log(`- Đã xóa ${deletedUsers.count} tài khoản demo (Chỉ giữ lại Admin)`);
  }

  // 8. Dọn dẹp Vai trò (Role)
  console.log('--- 7. DỌN DẸP VAI TRÒ & PHÂN QUYỀN ---');
  const standardRoleCodes = ['ADMIN', 'CEO', 'SALES_DIR', 'SALES', 'ACCOUNTANT', 'WAREHOUSE'];
  const deletedRoles = await prisma.role.deleteMany({
    where: { code: { notIn: standardRoleCodes } }
  });
  console.log(`- Đã xóa ${deletedRoles.count} vai trò demo`);

  // Đảm bảo Admin có vai trò ADMIN và CEO
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const ceoRole = await prisma.role.findUnique({ where: { code: 'CEO' } });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      create: { userId: adminUser.id, roleId: adminRole.id },
      update: {}
    });
  }
  if (ceoRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: ceoRole.id } },
      create: { userId: adminUser.id, roleId: ceoRole.id },
      update: {}
    });
  }

  console.log('=====================================================');
  console.log('✓ HOÀN TẤT LÀM SẠCH DỮ LIỆU - HỆ THỐNG ĐÃ SẴN SÀNG ĐỂ TEST!');
  console.log('=====================================================');
}

clearDatabase()
  .catch((err) => {
    console.error('LỖI KHI XÓA DỮ LIỆU:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
