/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const MODULE_DEFINITIONS = [
  { code: 'A_DEPARTMENTS', name: 'Cơ cấu tổ chức', group: 'Hệ thống' },
  { code: 'A_USERS', name: 'Quản lý người dùng', group: 'Hệ thống' },
  { code: 'A_ROLES', name: 'Danh mục vai trò', group: 'Hệ thống' },
  { code: 'A_PERMISSIONS', name: 'Ma trận phân quyền', group: 'Hệ thống' },
  { code: 'A_DOCUMENTS', name: 'Hồ sơ giấy tờ & CO-CQ', group: 'Hệ thống' },
  { code: 'C_OVERVIEW', name: 'Tổng quan kho', group: 'Kho & Hàng hóa' },
  { code: 'C_WAREHOUSES', name: 'Quản lý kho vật lý', group: 'Kho & Hàng hóa' },
  { code: 'C_CATEGORIES', name: 'Danh mục hàng hóa', group: 'Kho & Hàng hóa' },
  { code: 'C_PRODUCT_TYPES', name: 'Loại hàng hóa', group: 'Kho & Hàng hóa' },
  { code: 'C_PRODUCTS', name: 'Quản lý sản phẩm SKU', group: 'Kho & Hàng hóa' },
  { code: 'C_SUPPLIERS', name: 'Danh sách Nhà cung cấp', group: 'Kho & Hàng hóa' },
  { code: 'C_REPORTS', name: 'Báo cáo tồn kho', group: 'Kho & Hàng hóa' },
  { code: 'B_CUSTOMERS', name: 'Quản lý Khách hàng', group: 'Kinh doanh' },
  { code: 'B_SALES_OVERVIEW', name: 'Doanh thu & sản lượng', group: 'Kinh doanh' },
  { code: 'B_QUOTATIONS', name: 'Quản lý Báo giá', group: 'Kinh doanh' },
  { code: 'B_ORDERS', name: 'Quản lý Đơn hàng', group: 'Kinh doanh' },
  { code: 'B_REPORTS', name: 'Báo cáo bán hàng & công nợ', group: 'Kinh doanh' },
  { code: 'B_SALES_PLANS', name: 'Kế hoạch kinh doanh', group: 'Kinh doanh' },
  { code: 'E_EXPENSES', name: 'Danh mục chi phí', group: 'Thu - Chi' },
  { code: 'E_PAYMENT_VOUCHERS', name: 'Lập phiếu chi & Duyệt', group: 'Thu - Chi' },
  { code: 'E_REVENUE_TYPES', name: 'Nhóm khoản thu', group: 'Thu - Chi' },
  { code: 'E_RECEIPT_VOUCHERS', name: 'Lập phiếu thu & Duyệt', group: 'Thu - Chi' },
  { code: 'E_CASHFLOW_REPORTS', name: 'Báo cáo dòng tiền', group: 'Thu - Chi' },
  { code: 'F_DASHBOARD_REVENUE', name: 'Dashboard Doanh thu', group: 'Dashboard' },
  { code: 'F_DASHBOARD_PROFIT', name: 'Dashboard Lợi nhuận', group: 'Dashboard' }
];

const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU SEED DỮ LIỆU CRM NAM KHÁNH ---');

  // 1. Tạo Roles cốt lõi
  const rolesData = [
    { code: 'ADMIN', name: 'Quản trị hệ thống (Admin)', description: 'Toàn quyền cấu hình và quản trị hệ thống', isSystem: true },
    { code: 'CEO', name: 'Tổng Giám đốc (CEO)', description: 'Toàn quyền giám sát công ty, xem lương và mở khóa chứng từ', isSystem: true },
    { code: 'SALES_DIR', name: 'Trưởng phòng Kinh doanh', description: 'Quản lý toàn bộ nhân viên và khách hàng phòng kinh doanh', isSystem: true },
    { code: 'SALES', name: 'Nhân viên Kinh doanh', description: 'Chăm sóc khách hàng và lên đơn hàng cá nhân', isSystem: true },
    { code: 'ACCOUNTANT', name: 'Kế toán tài chính', description: 'Quản lý thu chi, công nợ và duyệt phiếu', isSystem: true },
    { code: 'WAREHOUSE', name: 'Thủ kho & Vận chuyển', description: 'Quản lý danh mục hàng hóa, kho vật lý và tồn kho', isSystem: true },
  ];

  const roleMap = new Map<string, string>();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, isSystem: r.isSystem },
      create: r
    });
    roleMap.set(r.code, role.id);
    console.log(`✓ Đã tạo Role: ${r.code}`);
  }

  // 2. Thiết lập Ma trận phân quyền mặc định
  for (const [code, roleId] of roleMap.entries()) {
    for (const mod of MODULE_DEFINITIONS) {
      let canRead = false;
      let canCreate = false;
      let canUpdate = false;
      let canDelete = false;
      let dataScope = 'PERSONAL';

      if (code === 'ADMIN' || code === 'CEO') {
        canRead = true;
        canCreate = true;
        canUpdate = true;
        canDelete = true;
        dataScope = 'ALL';
      } else if (code === 'SALES_DIR') {
        canRead = true;
        if (mod.group === 'Kinh doanh' || mod.group === 'Dashboard' || mod.code === 'A_DOCUMENTS') {
          canCreate = true;
          canUpdate = true;
          canDelete = mod.code !== 'B_ORDERS'; // Không cho xóa đơn
          dataScope = 'DEPARTMENT';
        }
      } else if (code === 'SALES') {
        if (['B_CUSTOMERS', 'B_QUOTATIONS', 'B_ORDERS', 'A_DOCUMENTS', 'C_PRODUCTS'].includes(mod.code)) {
          canRead = true;
          canCreate = true;
          canUpdate = true;
          canDelete = false;
          dataScope = 'PERSONAL';
        }
      } else if (code === 'ACCOUNTANT') {
        if (mod.group === 'Thu - Chi' || ['B_ORDERS', 'B_REPORTS', 'A_DOCUMENTS'].includes(mod.code)) {
          canRead = true;
          canCreate = true;
          canUpdate = true;
          canDelete = false;
          dataScope = 'ALL';
        }
      } else if (code === 'WAREHOUSE') {
        if (mod.group === 'Kho & Hàng hóa' || ['B_ORDERS', 'A_DOCUMENTS'].includes(mod.code)) {
          canRead = true;
          canCreate = true;
          canUpdate = true;
          canDelete = false;
          dataScope = 'ALL';
        }
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_moduleCode: {
            roleId,
            moduleCode: mod.code
          }
        },
        update: { canRead, canCreate, canUpdate, canDelete, dataScope },
        create: { roleId, moduleCode: mod.code, canRead, canCreate, canUpdate, canDelete, dataScope }
      });
    }
  }
  console.log('✓ Đã thiết lập Ma trận phân quyền RBAC 25 Modules cho 6 Roles');

  // 3. Tạo Cơ cấu tổ chức phòng ban (Cây 3 cấp)
  const bgd = await prisma.department.upsert({
    where: { code: 'BGD' },
    update: {
      mission: 'Hoạch định chiến lược và điều hành toàn diện hệ thống phân phối văn phòng phẩm'
    },
    create: {
      code: 'BGD',
      name: 'Ban Giám Đốc Nam Khánh',
      address: 'Trụ sở chính Hà Nội',
      mission: 'Hoạch định chiến lược và điều hành toàn diện hệ thống phân phối văn phòng phẩm',
      status: 'ACTIVE'
    }
  });

  const kkd = await prisma.department.upsert({
    where: { code: 'KKD' },
    update: {
      parentId: bgd.id,
      mission: 'Phát triển thị trường, cung ứng văn phòng phẩm cho doanh nghiệp, cơ quan & trường học'
    },
    create: {
      code: 'KKD',
      name: 'Khối Kinh Doanh & Tiếp Thị',
      parentId: bgd.id,
      address: 'Tầng 3 - Trụ sở Nam Khánh',
      mission: 'Phát triển thị trường, cung ứng văn phòng phẩm cho doanh nghiệp, cơ quan & trường học',
      status: 'ACTIVE'
    }
  });

  const pkd1 = await prisma.department.upsert({
    where: { code: 'PKD1' },
    update: {
      parentId: kkd.id,
      mission: 'Phụ trách cung ứng văn phòng phẩm trọn gói cho khối doanh nghiệp, ngân hàng & cơ quan'
    },
    create: {
      code: 'PKD1',
      name: 'Phòng Kinh Doanh 1 (Khách Hàng Doanh Nghiệp)',
      parentId: kkd.id,
      address: 'Tầng 3 - P.301',
      mission: 'Phụ trách cung ứng văn phòng phẩm trọn gói cho khối doanh nghiệp, ngân hàng & cơ quan',
      status: 'ACTIVE'
    }
  });

  const pkd2 = await prisma.department.upsert({
    where: { code: 'PKD2' },
    update: {
      parentId: kkd.id,
      mission: 'Phát triển mạng lưới đại lý văn phòng phẩm, trường học và chuỗi cửa hàng bán lẻ'
    },
    create: {
      code: 'PKD2',
      name: 'Phòng Kinh Doanh 2 (Đại Lý & Bán Lẻ)',
      parentId: kkd.id,
      address: 'Tầng 3 - P.302',
      mission: 'Phát triển mạng lưới đại lý văn phòng phẩm, trường học và chuỗi cửa hàng bán lẻ',
      status: 'ACTIVE'
    }
  });

  const pkt = await prisma.department.upsert({
    where: { code: 'PKT' },
    update: {
      parentId: bgd.id,
      mission: 'Quản trị dòng tiền, kiểm soát công nợ khách hàng và thu chi phân phối'
    },
    create: {
      code: 'PKT',
      name: 'Phòng Tài Chính - Kế Toán',
      parentId: bgd.id,
      address: 'Tầng 2 - P.202',
      mission: 'Quản trị dòng tiền, kiểm soát công nợ khách hàng và thu chi phân phối',
      status: 'ACTIVE'
    }
  });

  const pkho = await prisma.department.upsert({
    where: { code: 'PKHO' },
    update: {
      parentId: bgd.id,
      mission: 'Tổng kho Văn phòng phẩm & Giấy in Nam Khánh - Lưu kho và điều phối giao nhận nhanh'
    },
    create: {
      code: 'PKHO',
      name: 'Phòng Quản Lý Kho & Vận Chuyển',
      parentId: bgd.id,
      address: 'Tổng kho Gia Lâm, Hà Nội',
      mission: 'Tổng kho Văn phòng phẩm & Giấy in Nam Khánh - Lưu kho và điều phối giao nhận nhanh',
      status: 'ACTIVE'
    }
  });

  // Tạo Kho vật lý mẫu cho Nam Khánh
  await prisma.warehouse.upsert({
    where: { code: 'KHO-TONG' },
    update: {
      name: 'Tổng kho Văn phòng phẩm Nam Khánh (Gia Lâm)',
      address: 'Cụm Kho Bãi Gia Lâm, Hà Nội',
      departmentId: pkho.id
    },
    create: {
      code: 'KHO-TONG',
      name: 'Tổng kho Văn phòng phẩm Nam Khánh (Gia Lâm)',
      address: 'Cụm Kho Bãi Gia Lâm, Hà Nội',
      departmentId: pkho.id
    }
  });

  await prisma.warehouse.upsert({
    where: { code: 'KHO-TRUNG-TAM' },
    update: {
      name: 'Kho phân phối & Giao nhanh Nội thành Nam Khánh',
      address: 'Quận Hai Bà Trưng, Hà Nội',
      departmentId: pkho.id
    },
    create: {
      code: 'KHO-TRUNG-TAM',
      name: 'Kho phân phối & Giao nhanh Nội thành Nam Khánh',
      address: 'Quận Hai Bà Trưng, Hà Nội',
      departmentId: pkho.id
    }
  });

  console.log('✓ Đã tạo Cây cơ cấu tổ chức 3 cấp & Hệ thống Tổng kho VPP Nam Khánh');

  // 4. Tạo Tài khoản Người dùng duy nhất: Admin
  const targetEmail = 'dinhhchi2110@gmail.com';
  const passwordHash = await bcrypt.hash('Dhc2110@', 10);

  const adminRole = roleMap.get('ADMIN')!;
  const ceoRole = roleMap.get('CEO')!;

  const adminUser = await prisma.user.upsert({
    where: { email: targetEmail },
    update: {
      code: 'ADMIN',
      fullName: 'Quản Trị Viên Hệ Thống',
      passwordHash,
      departmentId: bgd.id,
      status: 'ACTIVE'
    },
    create: {
      code: 'ADMIN',
      fullName: 'Quản Trị Viên Hệ Thống',
      email: targetEmail,
      phone: '0988111222',
      passwordHash,
      departmentId: bgd.id,
      basicSalary: 30000000,
      allowance: 5000000,
      status: 'ACTIVE',
      startDate: new Date('2024-01-01')
    }
  });

  // Gán role ADMIN & CEO
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole
    }
  });

  if (ceoRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: ceoRole
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: ceoRole
      }
    });
  }

  // Xoá mọi tài khoản demo khác nếu có
  await prisma.user.deleteMany({
    where: { email: { not: targetEmail } }
  });

  console.log(`✓ Đã thiết lập duy nhất 1 tài khoản Admin: ${adminUser.fullName} (${adminUser.email})`);

  // Cập nhật Trưởng phòng / Người quản lý cho các đơn vị
  await prisma.department.update({ where: { id: bgd.id }, data: { managerId: adminUser.id } });
  await prisma.department.update({ where: { id: kkd.id }, data: { managerId: adminUser.id } });
  await prisma.department.update({ where: { id: pkd1.id }, data: { managerId: adminUser.id } });
  await prisma.department.update({ where: { id: pkd2.id }, data: { managerId: adminUser.id } });
  await prisma.department.update({ where: { id: pkt.id }, data: { managerId: adminUser.id } });
  await prisma.department.update({ where: { id: pkho.id }, data: { managerId: adminUser.id } });

  // 5. Tạo Hồ sơ giấy tờ mẫu (A.5)
  const sampleDocs = [
    {
      code: 'HD-MAU-01',
      title: 'Hợp đồng nguyên tắc cung ứng văn phòng phẩm trọn gói 2026',
      type: 'CONTRACT',
      fileUrl: '/uploads/sample_contract_vpp_2026.pdf',
      fileName: 'hop_dong_nguyen_tac_vpp_nam_khanh_2026.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      uploadedById: adminUser?.id
    },
    {
      code: 'HD-MAU-02',
      title: 'Hợp đồng phân phối văn phòng phẩm cho hệ thống đại lý cấp 1',
      type: 'CONTRACT',
      fileUrl: '/uploads/sample_distributor_contract.docx',
      fileName: 'hop_dong_dai_ly_phan_phoi_vpp.docx',
      fileSize: 524288,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedById: adminUser?.id
    },
    {
      code: 'CQ-2026-01',
      title: 'Chứng nhận ủy quyền phân phối & CO-CQ Giấy in, Bút viết, Văn phòng phẩm',
      type: 'CERTIFICATE',
      fileUrl: '/uploads/chung_chi_co_cq_giay_in_vpp.pdf',
      fileName: 'co_cq_giay_in_but_viet_nam_khanh.pdf',
      fileSize: 2097152,
      mimeType: 'application/pdf',
      uploadedById: adminUser?.id
    },
    {
      code: 'NL-2026-02',
      title: 'Hồ sơ năng lực nhà cung cấp Văn phòng phẩm & Thiết bị văn phòng Nam Khánh 2026',
      type: 'CERTIFICATE',
      fileUrl: '/uploads/ho_so_nang_luc_vpp_nam_khanh.pdf',
      fileName: 'ho_so_nang_luc_vpp_nam_khanh_2026.pdf',
      fileSize: 3145728,
      mimeType: 'application/pdf',
      uploadedById: adminUser?.id
    }
  ];

  for (const doc of sampleDocs) {
    await prisma.legalDocument.upsert({
      where: { code: doc.code },
      update: {
        title: doc.title,
        fileName: doc.fileName
      },
      create: doc
    });
    console.log(`✓ Đã tạo Tài liệu mẫu (A.5): [${doc.type}] ${doc.title}`);
  }

  // 6. TẠO MASTER DATA PHÂN HỆ C: KHO & HÀNG HÓA VĂN PHÒNG PHẨM
  const khoTong = await prisma.warehouse.findUnique({ where: { code: 'KHO-TONG' } });
  const khoTrungTam = await prisma.warehouse.findUnique({ where: { code: 'KHO-TRUNG-TAM' } });

  // 6.1 Tạo 5 Nhà cung cấp VPP lớn
  const suppliersData = [
    {
      code: 'NCC-DOUBLEA',
      name: 'Công ty TNHH Double A (Việt Nam)',
      phone: '02439743888',
      email: 'contact@doublea.com.vn',
      address: 'Tầng 15 Tòa nhà Vincom, 191 Bà Triệu, Hai Bà Trưng, Hà Nội',
      taxCode: '0101823940',
      contactPerson: 'Bà Trần Kim Oanh (Giám đốc Phân phối)',
      notes: 'Nhà sản xuất độc quyền giấy in Double A cao cấp không kẹt giấy'
    },
    {
      code: 'NCC-THIENLONG',
      name: 'Công ty Cổ phần Tập đoàn Thiên Long',
      phone: '02837505555',
      email: 'banhang@thienlong.vn',
      address: 'Lô 6-8-10-12, Đường số 3, KCN Tân Tạo, Q. Bình Tân, TP.HCM',
      taxCode: '0301464830',
      contactPerson: 'Ông Nguyễn Văn Hùng (Trưởng kênh B2B Miền Bắc)',
      notes: 'Cung cấp bút viết, mực dấu, dụng cụ học sinh và văn phòng phẩm'
    },
    {
      code: 'NCC-KINGJIM',
      name: 'Công ty TNHH King Jim (Việt Nam)',
      phone: '02743782888',
      email: 'sales@kingjim.com.vn',
      address: 'Đường D9, KCN Mỹ Phước 3, Bến Cát, Bình Dương',
      taxCode: '3700778899',
      contactPerson: 'Ông Sato Kenji (Đại diện kinh doanh)',
      notes: 'Chuyên sản xuất File bìa còng, bìa nút, sổ lưu trữ hồ sơ công sở'
    },
    {
      code: 'NCC-BAIBANG',
      name: 'Tổng Công ty Giấy Việt Nam (Bãi Bằng)',
      phone: '02103829222',
      email: 'kinhdoanh@baibang.com.vn',
      address: 'Thị trấn Phong Châu, Huyện Phù Ninh, Phú Thọ',
      taxCode: '2600109999',
      contactPerson: 'Ông Đỗ Quốc Huy (Phụ trách thị trường HN)',
      notes: 'Thương hiệu giấy in nội địa uy tín, độ trắng sáng ổn định'
    },
    {
      code: 'NCC-CASIO',
      name: 'Công ty CP XNK Bình Tây (BITEX - NPP Casio/Max)',
      phone: '02839699999',
      email: 'info@bitex.com.vn',
      address: '110-112 Hậu Giang, Phường 6, Quận 6, TP.HCM',
      taxCode: '0301449839',
      contactPerson: 'Bà Lê Thúy Hằng (Quản lý dự án)',
      notes: 'Phân phối chính hãng máy tính Casio và máy bấm kim Max Nhật Bản'
    }
  ];

  const supplierMap = new Map<string, any>();
  for (const s of suppliersData) {
    const sup = await prisma.supplier.upsert({
      where: { code: s.code },
      update: s,
      create: s
    });
    supplierMap.set(s.code, sup);
  }
  console.log('✓ Đã tạo 5 Nhà cung cấp Văn phòng phẩm');

  // 6.2 Tạo 5 Danh mục hàng hóa Cấp 1
  const categoriesData = [
    {
      code: 'DM-GIAY',
      name: 'Giấy in văn phòng',
      warehouseId: khoTong?.id,
      description: 'Giấy photocopy, giấy in vi tính liên tục, giấy bóng kính bìa các loại'
    },
    {
      code: 'DM-BUT',
      name: 'Bút viết & Mực',
      warehouseId: khoTong?.id,
      description: 'Bút bi, bút gel, bút lông bảng, bút dạ quang và mực dấu chuyên dụng'
    },
    {
      code: 'DM-BIA',
      name: 'File bìa còng & Lưu trữ',
      warehouseId: khoTong?.id,
      description: 'File còng bật, bìa lá, bìa nút, cặp tài liệu lưu trữ chứng từ lâu năm'
    },
    {
      code: 'DM-DUNGCU',
      name: 'Dụng cụ văn phòng',
      warehouseId: khoTrungTam?.id,
      description: 'Băng dính dán thùng, bấm kim, kim bấm, kẹp bướm, kéo và dao rọc giấy'
    },
    {
      code: 'DM-MAY',
      name: 'Thiết bị & Máy văn phòng',
      warehouseId: khoTrungTam?.id,
      description: 'Máy tính tài chính Casio, máy in hóa đơn, máy hủy tài liệu công sở'
    }
  ];

  const categoryMap = new Map<string, any>();
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { code: cat.code },
      update: cat,
      create: cat
    });
    categoryMap.set(cat.code, c);
  }
  console.log('✓ Đã tạo 5 Danh mục hàng hóa VPP Cấp 1');

  // 6.3 Tạo 10 Loại hàng hóa Cấp 2
  const typesData = [
    { code: 'LH-GIAY-A4', name: 'Giấy in khổ A4', categoryCode: 'DM-GIAY', unit: 'Ream', description: 'Định lượng 70gsm, 80gsm tiêu chuẩn' },
    { code: 'LH-GIAY-A3', name: 'Giấy in khổ A3', categoryCode: 'DM-GIAY', unit: 'Ream', description: 'Giấy in bản vẽ, sơ đồ A3' },
    { code: 'LH-BUT-BI', name: 'Bút bi & Bút Gel', categoryCode: 'DM-BUT', unit: 'Hộp', description: 'Bút viết hàng ngày cho nhân viên' },
    { code: 'LH-BUT-KY', name: 'Bút ký cao cấp', categoryCode: 'DM-BUT', unit: 'Cây', description: 'Bút ký hợp đồng, bút dạ kim' },
    { code: 'LH-BIA-CONG', name: 'File bìa còng 5cm-7cm', categoryCode: 'DM-BIA', unit: 'Cái', description: 'Lưu trữ tài liệu kế toán dày' },
    { code: 'LH-BIA-NUT', name: 'Bìa lá & Bìa nút', categoryCode: 'DM-BIA', unit: 'Xấp', description: 'Bảo quản hồ sơ phân loại nhỏ' },
    { code: 'LH-BAM-KIM', name: 'Máy bấm kim & Kim bấm', categoryCode: 'DM-DUNGCU', unit: 'Cái', description: 'Bấm kim số 10, số 3, trợ lực' },
    { code: 'LH-BANG-DINH', name: 'Băng dính & Dao cắt', categoryCode: 'DM-DUNGCU', unit: 'Cuộn', description: 'Băng dính OPP dán thùng carton' },
    { code: 'LH-MAY-TINH', name: 'Máy tính cầm tay kế toán', categoryCode: 'DM-MAY', unit: 'Cái', description: 'Máy tính 12 số, máy tài chính' },
    { code: 'LH-MAY-HUY', name: 'Máy hủy tài liệu & Đóng gáy', categoryCode: 'DM-MAY', unit: 'Máy', description: 'Hủy giấy văn phòng bảo mật' }
  ];

  const typeMap = new Map<string, any>();
  for (const t of typesData) {
    const cat = categoryMap.get(t.categoryCode);
    const pt = await prisma.productType.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        categoryId: cat?.id || '',
        unit: t.unit,
        description: t.description
      },
      create: {
        code: t.code,
        name: t.name,
        categoryId: cat?.id || '',
        unit: t.unit,
        description: t.description
      }
    });
    typeMap.set(t.code, pt);
  }
  console.log('✓ Đã tạo 10 Loại hàng hóa VPP Cấp 2');

  // 6.4 Tạo Master Data 10 Sản phẩm Văn phòng phẩm chi tiết
  const sampleProducts = [
    {
      code: 'SP-GIAY-01',
      barcode: '8858742900123',
      name: 'Giấy in Double A A4 70gsm (Chính hãng)',
      category: 'Giấy in văn phòng',
      unit: 'Ream',
      costPrice: 68000,
      sellingPrice: 82000,
      vatRate: 8,
      stockQuantity: 1500,
      minStockLevel: 200,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get('DM-GIAY')?.id,
      productTypeId: typeMap.get('LH-GIAY-A4')?.id,
      supplierId: supplierMap.get('NCC-DOUBLEA')?.id,
      color: 'Trắng 148 CIE',
      length: 297,
      width: 210,
      height: 50,
      weight: 2.5,
      description: 'Giấy in cao cấp không kẹt giấy, độ trắng sáng 148-151 CIE, đóng gói 500 tờ/ream, 5 ream/thùng'
    },
    {
      code: 'SP-GIAY-02',
      barcode: '8991389201991',
      name: 'Giấy in PaperOne A4 80gsm',
      category: 'Giấy in văn phòng',
      unit: 'Ream',
      costPrice: 78000,
      sellingPrice: 95000,
      vatRate: 8,
      stockQuantity: 1200,
      minStockLevel: 150,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get('DM-GIAY')?.id,
      productTypeId: typeMap.get('LH-GIAY-A4')?.id,
      supplierId: supplierMap.get('NCC-DOUBLEA')?.id,
      color: 'Trắng 160 CIE',
      length: 297,
      width: 210,
      height: 55,
      weight: 2.8,
      description: 'Giấy in định lượng 80gsm chuyên dùng in hợp đồng, chứng từ quan trọng và in 2 mặt'
    },
    {
      code: 'SP-GIAY-03',
      barcode: '8935012304567',
      name: 'Giấy in Bãi Bằng Hồng Tem Vàng A4 70gsm',
      category: 'Giấy in văn phòng',
      unit: 'Ream',
      costPrice: 52000,
      sellingPrice: 65000,
      vatRate: 8,
      stockQuantity: 800,
      minStockLevel: 100,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get('DM-GIAY')?.id,
      productTypeId: typeMap.get('LH-GIAY-A4')?.id,
      supplierId: supplierMap.get('NCC-BAIBANG')?.id,
      color: 'Trắng 84-90 ISO',
      length: 297,
      width: 210,
      height: 48,
      weight: 2.2,
      description: 'Giấy in nội địa chất lượng cao, độ mịn đồng đều, tiết kiệm chi phí cho doanh nghiệp'
    },
    {
      code: 'SP-BUT-01',
      barcode: '8935001802711',
      name: 'Bút bi Thiên Long TL-027 0.5mm (Xanh/Đen/Đỏ)',
      category: 'Bút viết & Mực',
      unit: 'Hộp',
      costPrice: 70000,
      sellingPrice: 95000,
      vatRate: 8,
      stockQuantity: 500,
      minStockLevel: 50,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get('DM-BUT')?.id,
      productTypeId: typeMap.get('LH-BUT-BI')?.id,
      supplierId: supplierMap.get('NCC-THIENLONG')?.id,
      color: 'Xanh, Đen, Đỏ',
      description: 'Hộp 20 cây bút bi mực trơn êm, nét viết thanh mảnh, mực đạt chuẩn an toàn quốc tế'
    },
    {
      code: 'SP-BUT-02',
      barcode: '4902506070777',
      name: 'Bút ký Pentel EnerGel BL57 0.7mm',
      category: 'Bút viết & Mực',
      unit: 'Cây',
      costPrice: 42000,
      sellingPrice: 58000,
      vatRate: 8,
      stockQuantity: 350,
      minStockLevel: 30,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get('DM-BUT')?.id,
      productTypeId: typeMap.get('LH-BUT-KY')?.id,
      supplierId: supplierMap.get('NCC-THIENLONG')?.id,
      color: 'Xanh đậm',
      description: 'Bút gel mực nhanh khô không lem, đầu bi hợp kim siêu bền, chuyên dùng ký kết văn bản'
    },
    {
      code: 'SP-BIA-01',
      barcode: '4971660007890',
      name: 'File còng bật Kingjim 7cm A4 (Hai mặt xi)',
      category: 'File bìa còng & Lưu trữ',
      unit: 'Cái',
      costPrice: 48000,
      sellingPrice: 65000,
      vatRate: 8,
      stockQuantity: 600,
      minStockLevel: 50,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get('DM-BIA')?.id,
      productTypeId: typeMap.get('LH-BIA-CONG')?.id,
      supplierId: supplierMap.get('NCC-KINGJIM')?.id,
      color: 'Xanh dương Kingjim',
      length: 318,
      width: 280,
      height: 70,
      description: 'Còng sắt mạ niken chống gỉ, gáy 7cm chứa tối đa 500 tờ A4, lưu trữ chứng từ kế toán'
    },
    {
      code: 'SP-BIA-02',
      barcode: '4977564012345',
      name: 'Bìa lá Plus A4 trong suốt (Độ dày 0.2mm)',
      category: 'File bìa còng & Lưu trữ',
      unit: 'Xấp',
      costPrice: 55000,
      sellingPrice: 75000,
      vatRate: 8,
      stockQuantity: 400,
      minStockLevel: 40,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get('DM-BIA')?.id,
      productTypeId: typeMap.get('LH-BIA-NUT')?.id,
      supplierId: supplierMap.get('NCC-KINGJIM')?.id,
      color: 'Trong suốt',
      description: 'Xấp 100 lá nhựa PP trong suốt, bảo quản tài liệu sạch đẹp không bám bụi'
    },
    {
      code: 'SP-DC-01',
      barcode: '4902870012348',
      name: 'Máy bấm kim Max HD-10 Nhật Bản',
      category: 'Dụng cụ văn phòng',
      unit: 'Cái',
      costPrice: 62000,
      sellingPrice: 85000,
      vatRate: 8,
      stockQuantity: 300,
      minStockLevel: 25,
      warehouseId: khoTrungTam?.id,
      categoryId: categoryMap.get('DM-DUNGCU')?.id,
      productTypeId: typeMap.get('LH-BAM-KIM')?.id,
      supplierId: supplierMap.get('NCC-CASIO')?.id,
      color: 'Xanh, Xám',
      description: 'Máy bấm kim số 10 lực bấm nhẹ, thân bọc nhựa ABS cao cấp, bấm được 20 tờ'
    },
    {
      code: 'SP-DC-02',
      barcode: '8936012890123',
      name: 'Băng dính dán thùng OPP 4.8cm x 100Y (Trong/Đục)',
      category: 'Dụng cụ văn phòng',
      unit: 'Cuộn',
      costPrice: 15000,
      sellingPrice: 22000,
      vatRate: 8,
      stockQuantity: 1000,
      minStockLevel: 100,
      warehouseId: khoTrungTam?.id,
      categoryId: categoryMap.get('DM-DUNGCU')?.id,
      productTypeId: typeMap.get('LH-BANG-DINH')?.id,
      supplierId: supplierMap.get('NCC-THIENLONG')?.id,
      color: 'Trong / Vàng đục',
      description: 'Độ dính 50 mic, màng dai dẻo chịu lực tốt, phục vụ đóng thùng đóng kiện'
    },
    {
      code: 'SP-MAY-01',
      barcode: '4549526605000',
      name: 'Máy tính tài chính Casio FX-580VN X',
      category: 'Thiết bị & Máy văn phòng',
      unit: 'Cái',
      costPrice: 520000,
      sellingPrice: 660000,
      vatRate: 10,
      stockQuantity: 150,
      minStockLevel: 15,
      warehouseId: khoTrungTam?.id,
      categoryId: categoryMap.get('DM-MAY')?.id,
      productTypeId: typeMap.get('LH-MAY-TINH')?.id,
      supplierId: supplierMap.get('NCC-CASIO')?.id,
      color: 'Đen carbon',
      description: '521 tính năng, màn hình LCD độ phân giải cao, hỗ trợ kiểm toán và tính toán kế toán'
    }
  ];

  const productMap = new Map<string, any>();
  for (const p of sampleProducts) {
    const prod = await prisma.product.upsert({
      where: { code: p.code },
      update: p,
      create: p
    });
    productMap.set(p.code, prod);
  }
  console.log('✓ Đã cập nhật 10 Sản phẩm VPP liên kết đầy đủ Kho, Danh mục, Loại hàng & Nhà cung cấp');

  // 7. Tạo Khách hàng mẫu (B.1)
  const salesUser = adminUser;
  const salesDir = adminUser;

  const sampleCustomers = [
    {
      code: 'KH001',
      name: 'Công ty Cổ phần Tập Đoàn Công Nghệ CMC',
      phone: '02437689000',
      taxCode: '0100244112',
      address: 'Tòa nhà CMC, Phố Duy Tân, Cầu Giấy, Hà Nội',
      deliveryAddress: 'Tầng 12 Tòa nhà CMC, Phố Duy Tân, Cầu Giấy, Hà Nội',
      customerType: 'ENTERPRISE',
      source: 'REFERRAL',
      contactPerson: 'Anh Hoàng Hải (Trưởng phòng Hành chính)',
      email: 'hai.hoang@cmc.com.vn',
      notes: 'Khách hàng ký hợp đồng nguyên tắc cung ứng VPP định kỳ mỗi tháng từ 20-30 triệu',
      managerId: salesUser?.id,
      status: 'ACTIVE'
    },
    {
      code: 'KH002',
      name: 'Ngân Hàng TMCP Ngoại Thương Việt Nam (Vietcombank) - CN Thăng Long',
      phone: '02438313733',
      taxCode: '0100112437',
      address: '98 Hoàng Quốc Việt, Nghĩa Đô, Cầu Giấy, Hà Nội',
      deliveryAddress: 'Kho Hành chính Vietcombank Thăng Long',
      customerType: 'ENTERPRISE',
      source: 'SELF_FOUND',
      contactPerson: 'Chị Nguyễn Phương Thảo (Phó phòng Quản trị)',
      email: 'thaonp.tlg@vietcombank.com.vn',
      notes: 'Nhu cầu lớn về giấy in A4 80gsm PaperOne và File còng lưu hồ sơ tín dụng',
      managerId: salesUser?.id,
      status: 'ACTIVE'
    },
    {
      code: 'KH003',
      name: 'Trường THPT Chuyên Hà Nội - Amsterdam',
      phone: '02438463096',
      taxCode: '0101438992',
      address: 'Số 1 đường Hoàng Minh Giám, Cầu Giấy, Hà Nội',
      deliveryAddress: 'Phòng Thiết bị Văn phòng - Tầng 1 Nhà A',
      customerType: 'SCHOOL',
      source: 'EXHIBITION',
      contactPerson: 'Thầy Lê Quang Đạt',
      email: 'vanphong@hn-ams.edu.vn',
      notes: 'Cung cấp giấy in đề thi, bút bi, đồ dùng phòng học và máy tính văn phòng',
      managerId: salesDir?.id,
      status: 'ACTIVE'
    },
    {
      code: 'KH004',
      name: 'Nhà sách & Văn Phòng Phẩm Minh Đức',
      phone: '0913988222',
      taxCode: '8345920192',
      address: '142 Nguyễn Trãi, Thanh Xuân, Hà Nội',
      deliveryAddress: 'Kho phân phối Minh Đức - 142 Nguyễn Trãi',
      customerType: 'HOUSEHOLD',
      source: 'SELF_FOUND',
      contactPerson: 'Chị Trần Thị Minh',
      email: 'vppminhduc@gmail.com',
      notes: 'Đại lý phân phối cấp 1, nhập số lượng lớn giấy in và bút viết theo quý',
      managerId: salesDir?.id,
      status: 'ACTIVE'
    },
    {
      code: 'KH005',
      name: 'Bệnh Viện Bạch Mai - Phòng Hành Chính Quản Trị',
      phone: '02438693731',
      taxCode: '0100778899',
      address: '78 Giải Phóng, Phương Mai, Đống Đa, Hà Nội',
      deliveryAddress: 'Kho vật tư văn phòng - Tầng hầm Nhà P',
      customerType: 'ORGANIZATION',
      source: 'OTHER',
      contactPerson: 'Bác sĩ Vũ Tuấn Anh',
      email: 'vattu@bachmai.gov.vn',
      notes: 'Cung cấp giấy in bệnh án, bìa hồ sơ bệnh nhân, bút viết y tế',
      managerId: salesUser?.id,
      status: 'ACTIVE'
    }
  ];

  const customerMap = new Map<string, any>();
  for (const c of sampleCustomers) {
    const cust = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: c,
      create: c
    });
    customerMap.set(c.code, cust);
  }
  console.log('✓ Đã tạo 5 Khách hàng doanh nghiệp & đại lý thực tế');

  // 8. Tạo Báo giá mẫu (B.3)
  const custCMC = customerMap.get('KH001');
  const custVCB = customerMap.get('KH002');

  if (custCMC && salesUser) {
    const p1 = productMap.get('SP-GIAY-01')!;
    const p2 = productMap.get('SP-BUT-01')!;
    const p3 = productMap.get('SP-BIA-01')!;

    const q1 = await prisma.quotation.upsert({
      where: { code: 'BG-2026-0001' },
      update: { status: 'CONFIRMED' },
      create: {
        code: 'BG-2026-0001',
        customerId: custCMC.id,
        managerId: salesUser.id,
        date: new Date('2026-03-01'),
        validUntil: new Date('2026-03-31'),
        status: 'CONFIRMED',
        subtotal: 24000000,
        vatRate: 8,
        vatAmount: 1920000,
        totalAmount: 25920000,
        notes: 'Báo giá cung ứng giấy in và văn phòng phẩm tháng 03/2026 cho toàn bộ các khối phòng ban CMC',
        items: {
          create: [
            {
              productId: p1.id,
              productCode: p1.code,
              productName: p1.name,
              unit: p1.unit,
              quantity: 200,
              unitPrice: 82000,
              amount: 16400000,
              vatRate: 8,
              total: 17712000
            },
            {
              productId: p2.id,
              productCode: p2.code,
              productName: p2.name,
              unit: p2.unit,
              quantity: 50,
              unitPrice: 95000,
              amount: 4750000,
              vatRate: 8,
              total: 5130000
            },
            {
              productId: p3.id,
              productCode: p3.code,
              productName: p3.name,
              unit: p3.unit,
              quantity: 44,
              unitPrice: 65000,
              amount: 2850000,
              vatRate: 8,
              total: 3078000
            }
          ]
        }
      }
    });

    // 9. Tạo Đơn hàng mẫu (B.4) từ Báo giá q1
    await prisma.order.upsert({
      where: { code: 'DH-2026-0001' },
      update: {},
      create: {
        code: 'DH-2026-0001',
        customerId: custCMC.id,
        quotationId: q1.id,
        managerId: salesUser.id,
        orderDate: new Date('2026-03-02'),
        deliveryDate: new Date('2026-03-04'),
        deliveryAddress: custCMC.deliveryAddress,
        contactPerson: custCMC.contactPerson,
        phone: custCMC.phone,
        deliveryStatus: 'DELIVERED',
        paymentStatus: 'PARTIAL_PAID',
        invoiceStatus: 'ISSUED',
        subtotal: 24000000,
        vatRate: 8,
        vatAmount: 1920000,
        totalAmount: 25920000,
        paidAmount: 20000000,
        remainingAmount: 5920000,
        notes: 'Đã giao hàng đầy đủ kèm phiếu xuất kho. Khách hàng đã thanh toán đợt 1 20 triệu, còn nợ 5.92 triệu',
        items: {
          create: [
            {
              productId: p1.id,
              productCode: p1.code,
              productName: p1.name,
              unit: p1.unit,
              quantity: 200,
              unitPrice: 82000,
              amount: 16400000,
              vatRate: 8,
              total: 17712000
            },
            {
              productId: p2.id,
              productCode: p2.code,
              productName: p2.name,
              unit: p2.unit,
              quantity: 50,
              unitPrice: 95000,
              amount: 4750000,
              vatRate: 8,
              total: 5130000
            },
            {
              productId: p3.id,
              productCode: p3.code,
              productName: p3.name,
              unit: p3.unit,
              quantity: 44,
              unitPrice: 65000,
              amount: 2850000,
              vatRate: 8,
              total: 3078000
            }
          ]
        }
      }
    });
  }

  if (custVCB && salesUser) {
    const p1 = productMap.get('SP-GIAY-02')!;
    const p2 = productMap.get('SP-BIA-01')!;

    await prisma.quotation.upsert({
      where: { code: 'BG-2026-0002' },
      update: {},
      create: {
        code: 'BG-2026-0002',
        customerId: custVCB.id,
        managerId: salesUser.id,
        date: new Date('2026-03-05'),
        validUntil: new Date('2026-04-05'),
        status: 'SENT',
        subtotal: 17000000,
        vatRate: 8,
        vatAmount: 1360000,
        totalAmount: 18360000,
        notes: 'Báo giá lô giấy in PaperOne 80gsm và File còng Kingjim phục vụ lưu trữ hồ sơ thẻ ngân hàng',
        items: {
          create: [
            {
              productId: p1.id,
              productCode: p1.code,
              productName: p1.name,
              unit: p1.unit,
              quantity: 150,
              unitPrice: 95000,
              amount: 14250000,
              vatRate: 8,
              total: 15390000
            },
            {
              productId: p2.id,
              productCode: p2.code,
              productName: p2.name,
              unit: p2.unit,
              quantity: 42,
              unitPrice: 65000,
              amount: 2750000,
              vatRate: 8,
              total: 2970000
            }
          ]
        }
      }
    });

    await prisma.order.upsert({
      where: { code: 'DH-2026-0002' },
      update: {},
      create: {
        code: 'DH-2026-0002',
        customerId: custVCB.id,
        managerId: salesUser.id,
        orderDate: new Date('2026-03-06'),
        deliveryDate: new Date('2026-03-08'),
        deliveryAddress: custVCB.deliveryAddress,
        contactPerson: custVCB.contactPerson,
        phone: custVCB.phone,
        deliveryStatus: 'DELIVERING',
        paymentStatus: 'PAID',
        invoiceStatus: 'ISSUED',
        subtotal: 17000000,
        vatRate: 8,
        vatAmount: 1360000,
        totalAmount: 18360000,
        paidAmount: 18360000,
        remainingAmount: 0,
        notes: 'Khách hàng chuyển khoản thanh toán 100% trước khi giao hàng. Đang vận chuyển xe tải.',
        items: {
          create: [
            {
              productId: p1.id,
              productCode: p1.code,
              productName: p1.name,
              unit: p1.unit,
              quantity: 150,
              unitPrice: 95000,
              amount: 14250000,
              vatRate: 8,
              total: 15390000
            },
            {
              productId: p2.id,
              productCode: p2.code,
              productName: p2.name,
              unit: p2.unit,
              quantity: 42,
              unitPrice: 65000,
              amount: 2750000,
              vatRate: 8,
              total: 2970000
            }
          ]
        }
      }
    });
  }

  // 10. Tạo Kế hoạch kinh doanh mẫu (B.6)
  if (salesDir) {
    const existingPlan = await prisma.salesPlan.findFirst({ where: { periodValue: 'Q1/2026' } });
    if (!existingPlan) {
      await prisma.salesPlan.create({
        data: {
          title: 'Kế hoạch kinh doanh phân phối Văn phòng phẩm Quý 1/2026',
          periodType: 'QUARTER',
          periodValue: 'Q1/2026',
          year: 2026,
          createdById: salesDir.id,
          notes: 'Mục tiêu trọng tâm: Đẩy mạnh sản lượng Giấy in văn phòng và mở rộng mạng lưới khách hàng doanh nghiệp, ngân hàng',
          status: 'ACTIVE',
          items: {
            create: [
              {
                category: 'Giấy in văn phòng',
                unit: 'Ream',
                targetQuantity: 3000,
                targetRevenue: 240000000,
                actualQuantity: 2850,
                actualRevenue: 228000000
              },
              {
                category: 'Bút viết & Mực',
                unit: 'Hộp',
                targetQuantity: 800,
                targetRevenue: 76000000,
                actualQuantity: 720,
                actualRevenue: 68400000
              },
              {
                category: 'File bìa còng & Lưu trữ',
                unit: 'Cái',
                targetQuantity: 1200,
                targetRevenue: 78000000,
                actualQuantity: 1100,
                actualRevenue: 71500000
              },
              {
                category: 'Dụng cụ văn phòng',
                unit: 'Cái',
                targetQuantity: 600,
                targetRevenue: 45000000,
                actualQuantity: 520,
                actualRevenue: 39000000
              },
              {
                category: 'Thiết bị & Máy văn phòng',
                unit: 'Cái',
                targetQuantity: 80,
                targetRevenue: 52000000,
                actualQuantity: 75,
                actualRevenue: 48750000
              }
            ]
          }
        }
      });
      console.log('✓ Đã tạo Kế hoạch kinh doanh mẫu (B.6)');
    }
  }

  // 10. Seed Phân hệ E: Quản lý Thu - Chi & Tài chính
  console.log('--- SEED PHÂN HỆ E: TÀI CHÍNH & THU CHI ---');
  
  // 10.1 Danh mục & Loại chi phí
  const cpVanPhong = await prisma.expenseCategory.upsert({
    where: { code: 'CP-VP' },
    update: {},
    create: {
      code: 'CP-VP',
      name: 'Chi phí Quản lý Văn phòng',
      description: 'Tiền thuê mặt bằng, điện nước, internet, vật tư văn phòng nội bộ',
      status: 'ACTIVE'
    }
  });

  const cpBanHang = await prisma.expenseCategory.upsert({
    where: { code: 'CP-BH' },
    update: {},
    create: {
      code: 'CP-BH',
      name: 'Chi phí Bán hàng & Vận chuyển',
      description: 'Xăng xe giao hàng, cước vận chuyển, tiếp khách, hoa hồng kinh doanh',
      status: 'ACTIVE'
    }
  });

  const cpNhanSu = await prisma.expenseCategory.upsert({
    where: { code: 'CP-NS' },
    update: {},
    create: {
      code: 'CP-NS',
      name: 'Chi phí Nhân sự & Đào tạo',
      description: 'Phụ cấp ăn trưa, công tác phí, hoạt động đào tạo, teambuilding',
      status: 'ACTIVE'
    }
  });

  const lcpThueNha = await prisma.expenseType.upsert({
    where: { code: 'LCP-THUE-NHA' },
    update: {},
    create: {
      code: 'LCP-THUE-NHA',
      name: 'Tiền thuê văn phòng & kho bãi',
      categoryId: cpVanPhong.id,
      description: 'Thanh toán định kỳ hàng tháng'
    }
  });

  const lcpDienNuoc = await prisma.expenseType.upsert({
    where: { code: 'LCP-DIEN-NUOC' },
    update: {},
    create: {
      code: 'LCP-DIEN-NUOC',
      name: 'Tiền điện, nước & Internet viễn thông',
      categoryId: cpVanPhong.id
    }
  });

  const lcpVanChuyen = await prisma.expenseType.upsert({
    where: { code: 'LCP-VAN-CHUYEN' },
    update: {},
    create: {
      code: 'LCP-VAN-CHUYEN',
      name: 'Cước vận chuyển & Xăng xe giao hàng VPP',
      categoryId: cpBanHang.id
    }
  });

  const lcpTiepKhach = await prisma.expenseType.upsert({
    where: { code: 'LCP-TIEP-KHACH' },
    update: {},
    create: {
      code: 'LCP-TIEP-KHACH',
      name: 'Chi phí tiếp khách & Đàm phán hợp đồng',
      categoryId: cpBanHang.id
    }
  });

  console.log('✓ Đã tạo Danh mục & Loại chi phí (E.I.1)');

  // 10.2 Nhóm loại khoản thu
  const ktBanHang = await prisma.revenueType.upsert({
    where: { code: 'KT-BAN-HANG' },
    update: {},
    create: {
      code: 'KT-BAN-HANG',
      name: 'Thu tiền bán hàng Văn phòng phẩm',
      description: 'Thu tiền khách hàng thanh toán đơn hàng VPP'
    }
  });

  const ktInAn = await prisma.revenueType.upsert({
    where: { code: 'KT-DICH-VU-IN' },
    update: {},
    create: {
      code: 'KT-DICH-VU-IN',
      name: 'Thu dịch vụ in ấn & đóng cuốn',
      description: 'Gia công đóng bìa còng, in ấn tài liệu'
    }
  });

  const ktHoanUng = await prisma.revenueType.upsert({
    where: { code: 'KT-HOAN-UNG' },
    update: {},
    create: {
      code: 'KT-HOAN-UNG',
      name: 'Thu hoàn ứng công tác phí',
      description: 'Nhân viên hoàn ứng sau khi hoàn tất công tác'
    }
  });

  console.log('✓ Đã tạo Nhóm loại khoản thu (E.II.1)');

  // Lấy tài khoản admin để gán người lập/duyệt
  const financeKetoan = adminUser;
  const financeCeo = adminUser;
  const sampleCustomer = await prisma.customer.findFirst();
  const sampleOrder = await prisma.order.findFirst();

  // 10.3 Phiếu chi mẫu
  await prisma.paymentVoucher.upsert({
    where: { code: 'PC-2026-0001' },
    update: {},
    create: {
      code: 'PC-2026-0001',
      voucherDate: new Date('2026-03-01'),
      categoryId: cpVanPhong.id,
      typeId: lcpThueNha.id,
      recipient: 'Công ty CP Đầu Tư Địa Ốc Cầu Giấy',
      phone: '0988112233',
      address: 'Tầng 3, Tòa nhà Cầu Giấy, Hà Nội',
      reason: 'Thanh toán tiền thuê văn phòng trụ sở chính Tháng 03/2026',
      amount: 15000000,
      paymentMethod: 'BANK_TRANSFER',
      invoiceNumber: 'HD-THUE-0326',
      status: 'PAID',
      createdById: financeKetoan?.id,
      approvedById: financeCeo?.id,
      approvedAt: new Date('2026-03-01T10:00:00Z'),
      notes: 'Đã hoàn tất chuyển khoản Vietcombank'
    }
  });

  await prisma.paymentVoucher.upsert({
    where: { code: 'PC-2026-0002' },
    update: {},
    create: {
      code: 'PC-2026-0002',
      voucherDate: new Date('2026-03-05'),
      categoryId: cpBanHang.id,
      typeId: lcpVanChuyen.id,
      recipient: 'Nguyễn Văn Hùng (Đội xe giao hàng)',
      phone: '0912345678',
      reason: 'Thanh toán xăng xe và phí cầu đường giao hàng tuần 1 tháng 3',
      amount: 2350000,
      paymentMethod: 'CASH',
      status: 'PAID',
      createdById: financeKetoan?.id,
      approvedById: financeKetoan?.id,
      approvedAt: new Date('2026-03-05T14:30:00Z')
    }
  });

  await prisma.paymentVoucher.upsert({
    where: { code: 'PC-2026-0003' },
    update: {},
    create: {
      code: 'PC-2026-0003',
      voucherDate: new Date('2026-03-08'),
      categoryId: cpBanHang.id,
      typeId: lcpTiepKhach.id,
      recipient: 'Trần Văn Nam (Phòng Kinh Doanh)',
      phone: '0903456789',
      reason: 'Tiếp khách đàm phán hợp đồng cung cấp VPP khối cơ quan',
      amount: 3200000,
      paymentMethod: 'CASH',
      status: 'APPROVED',
      createdById: financeKetoan?.id,
      approvedById: financeCeo?.id,
      approvedAt: new Date('2026-03-08T16:00:00Z'),
      notes: 'Đã duyệt chi, chờ xuất quỹ'
    }
  });

  console.log('✓ Đã tạo Phiếu chi tiền mẫu (E.I.2)');

  // 10.4 Phiếu thu mẫu
  if (sampleCustomer) {
    await prisma.receiptVoucher.upsert({
      where: { code: 'PT-2026-0001' },
      update: {},
      create: {
        code: 'PT-2026-0001',
        voucherDate: new Date('2026-03-03'),
        typeId: ktBanHang.id,
        payer: sampleCustomer.contactPerson || sampleCustomer.name,
        phone: sampleCustomer.phone,
        address: sampleCustomer.address || 'Hà Nội',
        reason: `Thu tiền thanh toán đơn hàng VPP của ${sampleCustomer.name}`,
        amount: 8500000,
        paymentMethod: 'BANK_TRANSFER',
        invoiceNumber: 'UNC-TCB-88392',
        status: 'PAID',
        customerId: sampleCustomer.id,
        orderId: sampleOrder?.id || null,
        createdById: financeKetoan?.id,
        approvedById: financeKetoan?.id,
        approvedAt: new Date('2026-03-03T11:00:00Z'),
        notes: 'Tiền đã về tài khoản Techcombank Nam Khánh'
      }
    });

    await prisma.receiptVoucher.upsert({
      where: { code: 'PT-2026-0002' },
      update: {},
      create: {
        code: 'PT-2026-0002',
        voucherDate: new Date('2026-03-09'),
        typeId: ktBanHang.id,
        payer: 'Phạm Thị Lan',
        phone: '0977665544',
        address: 'Thanh Xuân, Hà Nội',
        reason: 'Đặt cọc 50% đơn hàng vật tư và giấy in văn phòng quý 1',
        amount: 5000000,
        paymentMethod: 'CASH',
        status: 'PENDING',
        customerId: sampleCustomer.id,
        createdById: financeKetoan?.id
      }
    });
    console.log('✓ Đã tạo Phiếu thu tiền mẫu (E.II.2)');
  }

  console.log('--- HOÀN THÀNH SEED DỮ LIỆU THÀNH CÔNG! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
