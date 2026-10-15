export interface SystemModuleDefinition {
  code: string;
  name: string;
  group: string;
  description?: string;
}

export const ORDERED_GROUPS = [
  'TỔNG QUAN & ĐIỀU HÀNH',
  'KINH DOANH & BÁN HÀNG',
  'KHO & HÀNG HÓA',
  'QUẢN TRỊ NỀN TẢNG',
  'TÀI CHÍNH & THU CHI'
] as const;

export const SYSTEM_MODULES: SystemModuleDefinition[] = [
  // 1. TỔNG QUAN & ĐIỀU HÀNH
  {
    code: 'F_DASHBOARD',
    name: 'Dashboard điều hành tổng quan',
    group: 'TỔNG QUAN & ĐIỀU HÀNH',
    description: 'Trang tổng quan KPI, chỉ số kinh doanh và tài chính doanh nghiệp'
  },
  {
    code: 'F_DASHBOARD_REVENUE',
    name: 'Dashboard Doanh thu & Sản lượng',
    group: 'TỔNG QUAN & ĐIỀU HÀNH',
    description: 'Biểu đồ phân tích doanh thu và sản lượng theo kỳ/ngành hàng'
  },
  {
    code: 'F_DASHBOARD_PROFIT',
    name: 'Dashboard Lợi nhuận',
    group: 'TỔNG QUAN & ĐIỀU HÀNH',
    description: 'Biểu đồ phân tích biên lợi nhuận gộp, chi phí và lợi nhuận ròng'
  },

  // 2. KINH DOANH & BÁN HÀNG
  {
    code: 'B_CUSTOMERS',
    name: 'Quản lý Khách hàng',
    group: 'KINH DOANH & BÁN HÀNG',
    description: 'Hồ sơ khách hàng, phân loại, hạn mức tín dụng và công nợ'
  },
  {
    code: 'B_QUOTATIONS',
    name: 'Quản lý Báo giá',
    group: 'KINH DOANH & BÁN HÀNG',
    description: 'Lập báo giá gửi khách, in báo giá, chuyển đổi thành đơn hàng'
  },
  {
    code: 'B_ORDERS',
    name: 'Quản lý Đơn hàng',
    group: 'KINH DOANH & BÁN HÀNG',
    description: 'Tạo đơn bán, duyệt đơn, bàn giao hàng hóa và trả hàng'
  },
  {
    code: 'B_SALES_OVERVIEW',
    name: 'Doanh thu & Sản lượng',
    group: 'KINH DOANH & BÁN HÀNG',
    description: 'Báo cáo doanh số bán hàng và sản lượng theo nhân viên/khu vực'
  },
  {
    code: 'B_REPORTS',
    name: 'Báo cáo Doanh thu & Công nợ',
    group: 'KINH DOANH & BÁN HÀNG',
    description: 'Báo cáo chi tiết công nợ phải thu, tuổi nợ và đối soát nợ'
  },
  {
    code: 'B_SALES_PLANS',
    name: 'Kế hoạch Kinh doanh',
    group: 'KINH DOANH & BÁN HÀNG',
    description: 'Lập kế hoạch chỉ tiêu KPI doanh số, sản lượng và so sánh thực tế'
  },

  // 3. KHO & HÀNG HÓA
  {
    code: 'C_OVERVIEW',
    name: 'Tổng quan kho',
    group: 'KHO & HÀNG HÓA',
    description: 'Thống kê tổng tồn, giá trị tồn kho và cảnh báo hàng sắp hết'
  },
  {
    code: 'C_INBOUND_RECEIPTS',
    name: 'Quản lý Nhập kho',
    group: 'KHO & HÀNG HÓA',
    description: 'Lập phiếu nhập kho, kiểm hàng, duyệt nhập và in phiếu'
  },
  {
    code: 'C_WAREHOUSES',
    name: 'Quản lý kho vật lý',
    group: 'KHO & HÀNG HÓA',
    description: 'Danh sách các kho vật lý, địa điểm lưu kho và vị trí'
  },
  {
    code: 'C_PRODUCTS',
    name: 'Quản lý sản phẩm SKU',
    group: 'KHO & HÀNG HÓA',
    description: 'Danh mục SKU sản phẩm, giá bán, giá nhập, tồn kho, quy cách'
  },
  {
    code: 'C_CATEGORIES',
    name: 'Danh mục hàng hóa',
    group: 'KHO & HÀNG HÓA',
    description: 'Phân loại nhóm ngành hàng, danh mục hàng hóa kinh doanh'
  },
  {
    code: 'C_PRODUCT_TYPES',
    name: 'Loại hàng hóa',
    group: 'KHO & HÀNG HÓA',
    description: 'Đặc tính, loại hình sản phẩm và quy chuẩn hàng'
  },
  {
    code: 'C_SUPPLIERS',
    name: 'Danh sách Nhà cung cấp',
    group: 'KHO & HÀNG HÓA',
    description: 'Hồ sơ nhà cung cấp, công nợ phải trả và thông tin liên hệ'
  },
  {
    code: 'C_REPORTS',
    name: 'Báo cáo tồn kho',
    group: 'KHO & HÀNG HÓA',
    description: 'Báo cáo xuất nhập tồn, thẻ kho và giá trị luân chuyển'
  },

  // 4. QUẢN TRỊ NỀN TẢNG
  {
    code: 'A_DEPARTMENTS',
    name: 'Cơ cấu tổ chức phòng ban',
    group: 'QUẢN TRỊ NỀN TẢNG',
    description: 'Sơ đồ tổ chức, cơ cấu phòng ban và ban giám đốc'
  },
  {
    code: 'A_USERS',
    name: 'Quản lý người dùng',
    group: 'QUẢN TRỊ NỀN TẢNG',
    description: 'Tài khoản nhân sự, phân vai trò và trạng thái truy cập'
  },
  {
    code: 'A_ROLES',
    name: 'Danh mục vai trò',
    group: 'QUẢN TRỊ NỀN TẢNG',
    description: 'Danh sách các nhóm vai trò và chức danh trong doanh nghiệp'
  },
  {
    code: 'A_PERMISSIONS',
    name: 'Ma trận phân quyền',
    group: 'QUẢN TRỊ NỀN TẢNG',
    description: 'Cấu hình chi tiết quyền Xem/Thêm/Sửa/Xóa và phạm vi dữ liệu'
  },
  {
    code: 'A_DOCUMENTS',
    name: 'Hồ sơ giấy tờ & CO-CQ',
    group: 'QUẢN TRỊ NỀN TẢNG',
    description: 'Hồ sơ tài liệu, hợp đồng mẫu, chứng nhận CO-CQ pháp lý'
  },
  {
    code: 'A_SETTINGS',
    name: 'Cài đặt hệ thống',
    group: 'QUẢN TRỊ NỀN TẢNG',
    description: 'Cấu hình hệ thống, bảo mật, thông tin doanh nghiệp'
  },

  // 5. TÀI CHÍNH & THU CHI
  {
    code: 'E_FINANCES',
    name: 'Quản lý Thu - Chi & Dòng tiền',
    group: 'TÀI CHÍNH & THU CHI',
    description: 'Trang điều hành tài chính, quản lý tổng thu chi và quỹ'
  },
  {
    code: 'E_RECEIPT_VOUCHERS',
    name: 'Lập phiếu thu & Duyệt',
    group: 'TÀI CHÍNH & THU CHI',
    description: 'Phiếu thu tiền mặt/ngân hàng, đối soát công nợ đơn hàng'
  },
  {
    code: 'E_PAYMENT_VOUCHERS',
    name: 'Lập phiếu chi & Duyệt',
    group: 'TÀI CHÍNH & THU CHI',
    description: 'Phiếu chi thanh toán nhà cung cấp, chi phí nội bộ và duyệt chi'
  },
  {
    code: 'E_EXPENSES',
    name: 'Danh mục chi phí',
    group: 'TÀI CHÍNH & THU CHI',
    description: 'Định khoản các khoản mục chi phí hoạt động nội bộ'
  },
  {
    code: 'E_REVENUE_TYPES',
    name: 'Nhóm khoản thu',
    group: 'TÀI CHÍNH & THU CHI',
    description: 'Phân loại các nguồn thu tài chính doanh nghiệp'
  },
  {
    code: 'E_CASHFLOW_REPORTS',
    name: 'Báo cáo dòng tiền',
    group: 'TÀI CHÍNH & THU CHI',
    description: 'Báo cáo lưu chuyển tiền tệ và cân đối thu chi theo chu kỳ'
  }
];
