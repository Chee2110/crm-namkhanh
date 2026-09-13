"use strict";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const MODULE_DEFINITIONS = [
  { code: "A_DEPARTMENTS", name: "C\u01A1 c\u1EA5u t\u1ED5 ch\u1EE9c", group: "H\u1EC7 th\u1ED1ng" },
  { code: "A_USERS", name: "Qu\u1EA3n l\xFD ng\u01B0\u1EDDi d\xF9ng", group: "H\u1EC7 th\u1ED1ng" },
  { code: "A_ROLES", name: "Danh m\u1EE5c vai tr\xF2", group: "H\u1EC7 th\u1ED1ng" },
  { code: "A_PERMISSIONS", name: "Ma tr\u1EADn ph\xE2n quy\u1EC1n", group: "H\u1EC7 th\u1ED1ng" },
  { code: "A_DOCUMENTS", name: "H\u1ED3 s\u01A1 gi\u1EA5y t\u1EDD & CO-CQ", group: "H\u1EC7 th\u1ED1ng" },
  { code: "C_OVERVIEW", name: "T\u1ED5ng quan kho", group: "Kho & H\xE0ng h\xF3a" },
  { code: "C_WAREHOUSES", name: "Qu\u1EA3n l\xFD kho v\u1EADt l\xFD", group: "Kho & H\xE0ng h\xF3a" },
  { code: "C_CATEGORIES", name: "Danh m\u1EE5c h\xE0ng h\xF3a", group: "Kho & H\xE0ng h\xF3a" },
  { code: "C_PRODUCT_TYPES", name: "Lo\u1EA1i h\xE0ng h\xF3a", group: "Kho & H\xE0ng h\xF3a" },
  { code: "C_PRODUCTS", name: "Qu\u1EA3n l\xFD s\u1EA3n ph\u1EA9m SKU", group: "Kho & H\xE0ng h\xF3a" },
  { code: "C_SUPPLIERS", name: "Danh s\xE1ch Nh\xE0 cung c\u1EA5p", group: "Kho & H\xE0ng h\xF3a" },
  { code: "C_REPORTS", name: "B\xE1o c\xE1o t\u1ED3n kho", group: "Kho & H\xE0ng h\xF3a" },
  { code: "B_CUSTOMERS", name: "Qu\u1EA3n l\xFD Kh\xE1ch h\xE0ng", group: "Kinh doanh" },
  { code: "B_SALES_OVERVIEW", name: "Doanh thu & s\u1EA3n l\u01B0\u1EE3ng", group: "Kinh doanh" },
  { code: "B_QUOTATIONS", name: "Qu\u1EA3n l\xFD B\xE1o gi\xE1", group: "Kinh doanh" },
  { code: "B_ORDERS", name: "Qu\u1EA3n l\xFD \u0110\u01A1n h\xE0ng", group: "Kinh doanh" },
  { code: "B_REPORTS", name: "B\xE1o c\xE1o b\xE1n h\xE0ng & c\xF4ng n\u1EE3", group: "Kinh doanh" },
  { code: "B_SALES_PLANS", name: "K\u1EBF ho\u1EA1ch kinh doanh", group: "Kinh doanh" },
  { code: "E_EXPENSES", name: "Danh m\u1EE5c chi ph\xED", group: "Thu - Chi" },
  { code: "E_PAYMENT_VOUCHERS", name: "L\u1EADp phi\u1EBFu chi & Duy\u1EC7t", group: "Thu - Chi" },
  { code: "E_REVENUE_TYPES", name: "Nh\xF3m kho\u1EA3n thu", group: "Thu - Chi" },
  { code: "E_RECEIPT_VOUCHERS", name: "L\u1EADp phi\u1EBFu thu & Duy\u1EC7t", group: "Thu - Chi" },
  { code: "E_CASHFLOW_REPORTS", name: "B\xE1o c\xE1o d\xF2ng ti\u1EC1n", group: "Thu - Chi" },
  { code: "F_DASHBOARD_REVENUE", name: "Dashboard Doanh thu", group: "Dashboard" },
  { code: "F_DASHBOARD_PROFIT", name: "Dashboard L\u1EE3i nhu\u1EADn", group: "Dashboard" }
];
const prisma = new PrismaClient();
async function main() {
  console.log("--- B\u1EAET \u0110\u1EA6U SEED D\u1EEE LI\u1EC6U CRM NAM KH\xC1NH ---");
  const rolesData = [
    { code: "ADMIN", name: "Qu\u1EA3n tr\u1ECB h\u1EC7 th\u1ED1ng (Admin)", description: "To\xE0n quy\u1EC1n c\u1EA5u h\xECnh v\xE0 qu\u1EA3n tr\u1ECB h\u1EC7 th\u1ED1ng", isSystem: true },
    { code: "CEO", name: "T\u1ED5ng Gi\xE1m \u0111\u1ED1c (CEO)", description: "To\xE0n quy\u1EC1n gi\xE1m s\xE1t c\xF4ng ty, xem l\u01B0\u01A1ng v\xE0 m\u1EDF kh\xF3a ch\u1EE9ng t\u1EEB", isSystem: true },
    { code: "SALES_DIR", name: "Tr\u01B0\u1EDFng ph\xF2ng Kinh doanh", description: "Qu\u1EA3n l\xFD to\xE0n b\u1ED9 nh\xE2n vi\xEAn v\xE0 kh\xE1ch h\xE0ng ph\xF2ng kinh doanh", isSystem: true },
    { code: "SALES", name: "Nh\xE2n vi\xEAn Kinh doanh", description: "Ch\u0103m s\xF3c kh\xE1ch h\xE0ng v\xE0 l\xEAn \u0111\u01A1n h\xE0ng c\xE1 nh\xE2n", isSystem: true },
    { code: "ACCOUNTANT", name: "K\u1EBF to\xE1n t\xE0i ch\xEDnh", description: "Qu\u1EA3n l\xFD thu chi, c\xF4ng n\u1EE3 v\xE0 duy\u1EC7t phi\u1EBFu", isSystem: true },
    { code: "WAREHOUSE", name: "Th\u1EE7 kho & V\u1EADn chuy\u1EC3n", description: "Qu\u1EA3n l\xFD danh m\u1EE5c h\xE0ng h\xF3a, kho v\u1EADt l\xFD v\xE0 t\u1ED3n kho", isSystem: true }
  ];
  const roleMap = /* @__PURE__ */ new Map();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, isSystem: r.isSystem },
      create: r
    });
    roleMap.set(r.code, role.id);
    console.log(`\u2713 \u0110\xE3 t\u1EA1o Role: ${r.code}`);
  }
  for (const [code, roleId] of roleMap.entries()) {
    for (const mod of MODULE_DEFINITIONS) {
      let canRead = false;
      let canCreate = false;
      let canUpdate = false;
      let canDelete = false;
      let dataScope = "PERSONAL";
      if (code === "ADMIN" || code === "CEO") {
        canRead = true;
        canCreate = true;
        canUpdate = true;
        canDelete = true;
        dataScope = "ALL";
      } else if (code === "SALES_DIR") {
        canRead = true;
        if (mod.group === "Kinh doanh" || mod.group === "Dashboard" || mod.code === "A_DOCUMENTS") {
          canCreate = true;
          canUpdate = true;
          canDelete = mod.code !== "B_ORDERS";
          dataScope = "DEPARTMENT";
        }
      } else if (code === "SALES") {
        if (["B_CUSTOMERS", "B_QUOTATIONS", "B_ORDERS", "A_DOCUMENTS", "C_PRODUCTS"].includes(mod.code)) {
          canRead = true;
          canCreate = true;
          canUpdate = true;
          canDelete = false;
          dataScope = "PERSONAL";
        }
      } else if (code === "ACCOUNTANT") {
        if (mod.group === "Thu - Chi" || ["B_ORDERS", "B_REPORTS", "A_DOCUMENTS"].includes(mod.code)) {
          canRead = true;
          canCreate = true;
          canUpdate = true;
          canDelete = false;
          dataScope = "ALL";
        }
      } else if (code === "WAREHOUSE") {
        if (mod.group === "Kho & H\xE0ng h\xF3a" || ["B_ORDERS", "A_DOCUMENTS"].includes(mod.code)) {
          canRead = true;
          canCreate = true;
          canUpdate = true;
          canDelete = false;
          dataScope = "ALL";
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
  console.log("\u2713 \u0110\xE3 thi\u1EBFt l\u1EADp Ma tr\u1EADn ph\xE2n quy\u1EC1n RBAC 25 Modules cho 6 Roles");
  const bgd = await prisma.department.upsert({
    where: { code: "BGD" },
    update: {
      mission: "Ho\u1EA1ch \u0111\u1ECBnh chi\u1EBFn l\u01B0\u1EE3c v\xE0 \u0111i\u1EC1u h\xE0nh to\xE0n di\u1EC7n h\u1EC7 th\u1ED1ng ph\xE2n ph\u1ED1i v\u0103n ph\xF2ng ph\u1EA9m"
    },
    create: {
      code: "BGD",
      name: "Ban Gi\xE1m \u0110\u1ED1c Nam Kh\xE1nh",
      address: "Tr\u1EE5 s\u1EDF ch\xEDnh H\xE0 N\u1ED9i",
      mission: "Ho\u1EA1ch \u0111\u1ECBnh chi\u1EBFn l\u01B0\u1EE3c v\xE0 \u0111i\u1EC1u h\xE0nh to\xE0n di\u1EC7n h\u1EC7 th\u1ED1ng ph\xE2n ph\u1ED1i v\u0103n ph\xF2ng ph\u1EA9m",
      status: "ACTIVE"
    }
  });
  const kkd = await prisma.department.upsert({
    where: { code: "KKD" },
    update: {
      parentId: bgd.id,
      mission: "Ph\xE1t tri\u1EC3n th\u1ECB tr\u01B0\u1EDDng, cung \u1EE9ng v\u0103n ph\xF2ng ph\u1EA9m cho doanh nghi\u1EC7p, c\u01A1 quan & tr\u01B0\u1EDDng h\u1ECDc"
    },
    create: {
      code: "KKD",
      name: "Kh\u1ED1i Kinh Doanh & Ti\u1EBFp Th\u1ECB",
      parentId: bgd.id,
      address: "T\u1EA7ng 3 - Tr\u1EE5 s\u1EDF Nam Kh\xE1nh",
      mission: "Ph\xE1t tri\u1EC3n th\u1ECB tr\u01B0\u1EDDng, cung \u1EE9ng v\u0103n ph\xF2ng ph\u1EA9m cho doanh nghi\u1EC7p, c\u01A1 quan & tr\u01B0\u1EDDng h\u1ECDc",
      status: "ACTIVE"
    }
  });
  const pkd1 = await prisma.department.upsert({
    where: { code: "PKD1" },
    update: {
      parentId: kkd.id,
      mission: "Ph\u1EE5 tr\xE1ch cung \u1EE9ng v\u0103n ph\xF2ng ph\u1EA9m tr\u1ECDn g\xF3i cho kh\u1ED1i doanh nghi\u1EC7p, ng\xE2n h\xE0ng & c\u01A1 quan"
    },
    create: {
      code: "PKD1",
      name: "Ph\xF2ng Kinh Doanh 1 (Kh\xE1ch H\xE0ng Doanh Nghi\u1EC7p)",
      parentId: kkd.id,
      address: "T\u1EA7ng 3 - P.301",
      mission: "Ph\u1EE5 tr\xE1ch cung \u1EE9ng v\u0103n ph\xF2ng ph\u1EA9m tr\u1ECDn g\xF3i cho kh\u1ED1i doanh nghi\u1EC7p, ng\xE2n h\xE0ng & c\u01A1 quan",
      status: "ACTIVE"
    }
  });
  const pkd2 = await prisma.department.upsert({
    where: { code: "PKD2" },
    update: {
      parentId: kkd.id,
      mission: "Ph\xE1t tri\u1EC3n m\u1EA1ng l\u01B0\u1EDBi \u0111\u1EA1i l\xFD v\u0103n ph\xF2ng ph\u1EA9m, tr\u01B0\u1EDDng h\u1ECDc v\xE0 chu\u1ED7i c\u1EEDa h\xE0ng b\xE1n l\u1EBB"
    },
    create: {
      code: "PKD2",
      name: "Ph\xF2ng Kinh Doanh 2 (\u0110\u1EA1i L\xFD & B\xE1n L\u1EBB)",
      parentId: kkd.id,
      address: "T\u1EA7ng 3 - P.302",
      mission: "Ph\xE1t tri\u1EC3n m\u1EA1ng l\u01B0\u1EDBi \u0111\u1EA1i l\xFD v\u0103n ph\xF2ng ph\u1EA9m, tr\u01B0\u1EDDng h\u1ECDc v\xE0 chu\u1ED7i c\u1EEDa h\xE0ng b\xE1n l\u1EBB",
      status: "ACTIVE"
    }
  });
  const pkt = await prisma.department.upsert({
    where: { code: "PKT" },
    update: {
      parentId: bgd.id,
      mission: "Qu\u1EA3n tr\u1ECB d\xF2ng ti\u1EC1n, ki\u1EC3m so\xE1t c\xF4ng n\u1EE3 kh\xE1ch h\xE0ng v\xE0 thu chi ph\xE2n ph\u1ED1i"
    },
    create: {
      code: "PKT",
      name: "Ph\xF2ng T\xE0i Ch\xEDnh - K\u1EBF To\xE1n",
      parentId: bgd.id,
      address: "T\u1EA7ng 2 - P.202",
      mission: "Qu\u1EA3n tr\u1ECB d\xF2ng ti\u1EC1n, ki\u1EC3m so\xE1t c\xF4ng n\u1EE3 kh\xE1ch h\xE0ng v\xE0 thu chi ph\xE2n ph\u1ED1i",
      status: "ACTIVE"
    }
  });
  const pkho = await prisma.department.upsert({
    where: { code: "PKHO" },
    update: {
      parentId: bgd.id,
      mission: "T\u1ED5ng kho V\u0103n ph\xF2ng ph\u1EA9m & Gi\u1EA5y in Nam Kh\xE1nh - L\u01B0u kho v\xE0 \u0111i\u1EC1u ph\u1ED1i giao nh\u1EADn nhanh"
    },
    create: {
      code: "PKHO",
      name: "Ph\xF2ng Qu\u1EA3n L\xFD Kho & V\u1EADn Chuy\u1EC3n",
      parentId: bgd.id,
      address: "T\u1ED5ng kho Gia L\xE2m, H\xE0 N\u1ED9i",
      mission: "T\u1ED5ng kho V\u0103n ph\xF2ng ph\u1EA9m & Gi\u1EA5y in Nam Kh\xE1nh - L\u01B0u kho v\xE0 \u0111i\u1EC1u ph\u1ED1i giao nh\u1EADn nhanh",
      status: "ACTIVE"
    }
  });
  await prisma.warehouse.upsert({
    where: { code: "KHO-TONG" },
    update: {
      name: "T\u1ED5ng kho V\u0103n ph\xF2ng ph\u1EA9m Nam Kh\xE1nh (Gia L\xE2m)",
      address: "C\u1EE5m Kho B\xE3i Gia L\xE2m, H\xE0 N\u1ED9i",
      departmentId: pkho.id
    },
    create: {
      code: "KHO-TONG",
      name: "T\u1ED5ng kho V\u0103n ph\xF2ng ph\u1EA9m Nam Kh\xE1nh (Gia L\xE2m)",
      address: "C\u1EE5m Kho B\xE3i Gia L\xE2m, H\xE0 N\u1ED9i",
      departmentId: pkho.id
    }
  });
  await prisma.warehouse.upsert({
    where: { code: "KHO-TRUNG-TAM" },
    update: {
      name: "Kho ph\xE2n ph\u1ED1i & Giao nhanh N\u1ED9i th\xE0nh Nam Kh\xE1nh",
      address: "Qu\u1EADn Hai B\xE0 Tr\u01B0ng, H\xE0 N\u1ED9i",
      departmentId: pkho.id
    },
    create: {
      code: "KHO-TRUNG-TAM",
      name: "Kho ph\xE2n ph\u1ED1i & Giao nhanh N\u1ED9i th\xE0nh Nam Kh\xE1nh",
      address: "Qu\u1EADn Hai B\xE0 Tr\u01B0ng, H\xE0 N\u1ED9i",
      departmentId: pkho.id
    }
  });
  console.log("\u2713 \u0110\xE3 t\u1EA1o C\xE2y c\u01A1 c\u1EA5u t\u1ED5 ch\u1EE9c 3 c\u1EA5p & H\u1EC7 th\u1ED1ng T\u1ED5ng kho VPP Nam Kh\xE1nh");
  const passwordHash = await bcrypt.hash("123456", 10);
  const users = [
    {
      code: "NV001",
      fullName: "Qu\u1EA3n Tr\u1ECB Vi\xEAn H\u1EC7 Th\u1ED1ng",
      email: "admin@namkhanh.vn",
      phone: "0988111222",
      departmentId: bgd.id,
      roleCode: "ADMIN",
      basicSalary: 3e7,
      allowance: 5e6,
      status: "ACTIVE"
    },
    {
      code: "NV002",
      fullName: "Nguy\u1EC5n Nam Kh\xE1nh",
      email: "ceo@namkhanh.vn",
      phone: "0988000999",
      departmentId: bgd.id,
      roleCode: "CEO",
      basicSalary: 5e7,
      allowance: 1e7,
      status: "ACTIVE"
    },
    {
      code: "NV003",
      fullName: "Tr\u1EA7n V\u0103n M\u1EA1nh",
      email: "sales.dir@namkhanh.vn",
      phone: "0912345678",
      departmentId: kkd.id,
      roleCode: "SALES_DIR",
      basicSalary: 2e7,
      allowance: 3e6,
      status: "ACTIVE"
    },
    {
      code: "NV004",
      fullName: "L\xEA Th\u1ECB Mai",
      email: "sales1@namkhanh.vn",
      phone: "0934567890",
      departmentId: pkd1.id,
      roleCode: "SALES",
      basicSalary: 1e7,
      allowance: 2e6,
      status: "ACTIVE"
    },
    {
      code: "NV005",
      fullName: "Ph\u1EA1m Thu Trang",
      email: "accountant@namkhanh.vn",
      phone: "0977888999",
      departmentId: pkt.id,
      roleCode: "ACCOUNTANT",
      basicSalary: 15e6,
      allowance: 25e5,
      status: "ACTIVE"
    },
    {
      code: "NV006",
      fullName: "V\u0169 \u0110\u1EE9c Th\xE0nh",
      email: "warehouse@namkhanh.vn",
      phone: "0966555444",
      departmentId: pkho.id,
      roleCode: "WAREHOUSE",
      basicSalary: 12e6,
      allowance: 2e6,
      status: "ACTIVE"
    }
  ];
  for (const u of users) {
    const roleId = roleMap.get(u.roleCode);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        code: u.code,
        fullName: u.fullName,
        phone: u.phone,
        departmentId: u.departmentId,
        basicSalary: u.basicSalary,
        allowance: u.allowance,
        status: u.status
      },
      create: {
        code: u.code,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        passwordHash,
        departmentId: u.departmentId,
        basicSalary: u.basicSalary,
        allowance: u.allowance,
        status: u.status,
        startDate: /* @__PURE__ */ new Date("2024-01-01")
      }
    });
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId
      }
    });
    console.log(`\u2713 \u0110\xE3 t\u1EA1o User: ${u.fullName} (${u.email}) - Vai tr\xF2: ${u.roleCode}`);
  }
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@namkhanh.vn" } });
  const ceoUser = await prisma.user.findUnique({ where: { email: "ceo@namkhanh.vn" } });
  const salesDirUser = await prisma.user.findUnique({ where: { email: "sales.dir@namkhanh.vn" } });
  const accUser = await prisma.user.findUnique({ where: { email: "accountant@namkhanh.vn" } });
  const whUser = await prisma.user.findUnique({ where: { email: "warehouse@namkhanh.vn" } });
  if (ceoUser) await prisma.department.update({ where: { id: bgd.id }, data: { managerId: ceoUser.id } });
  if (salesDirUser) {
    await prisma.department.update({ where: { id: kkd.id }, data: { managerId: salesDirUser.id } });
    await prisma.department.update({ where: { id: pkd1.id }, data: { managerId: salesDirUser.id } });
  }
  if (accUser) await prisma.department.update({ where: { id: pkt.id }, data: { managerId: accUser.id } });
  if (whUser) await prisma.department.update({ where: { id: pkho.id }, data: { managerId: whUser.id } });
  const sampleDocs = [
    {
      code: "HD-MAU-01",
      title: "H\u1EE3p \u0111\u1ED3ng nguy\xEAn t\u1EAFc cung \u1EE9ng v\u0103n ph\xF2ng ph\u1EA9m tr\u1ECDn g\xF3i 2026",
      type: "CONTRACT",
      fileUrl: "/uploads/sample_contract_vpp_2026.pdf",
      fileName: "hop_dong_nguyen_tac_vpp_nam_khanh_2026.pdf",
      fileSize: 1048576,
      mimeType: "application/pdf",
      uploadedById: adminUser?.id
    },
    {
      code: "HD-MAU-02",
      title: "H\u1EE3p \u0111\u1ED3ng ph\xE2n ph\u1ED1i v\u0103n ph\xF2ng ph\u1EA9m cho h\u1EC7 th\u1ED1ng \u0111\u1EA1i l\xFD c\u1EA5p 1",
      type: "CONTRACT",
      fileUrl: "/uploads/sample_distributor_contract.docx",
      fileName: "hop_dong_dai_ly_phan_phoi_vpp.docx",
      fileSize: 524288,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      uploadedById: adminUser?.id
    },
    {
      code: "CQ-2026-01",
      title: "Ch\u1EE9ng nh\u1EADn \u1EE7y quy\u1EC1n ph\xE2n ph\u1ED1i & CO-CQ Gi\u1EA5y in, B\xFAt vi\u1EBFt, V\u0103n ph\xF2ng ph\u1EA9m",
      type: "CERTIFICATE",
      fileUrl: "/uploads/chung_chi_co_cq_giay_in_vpp.pdf",
      fileName: "co_cq_giay_in_but_viet_nam_khanh.pdf",
      fileSize: 2097152,
      mimeType: "application/pdf",
      uploadedById: adminUser?.id
    },
    {
      code: "NL-2026-02",
      title: "H\u1ED3 s\u01A1 n\u0103ng l\u1EF1c nh\xE0 cung c\u1EA5p V\u0103n ph\xF2ng ph\u1EA9m & Thi\u1EBFt b\u1ECB v\u0103n ph\xF2ng Nam Kh\xE1nh 2026",
      type: "CERTIFICATE",
      fileUrl: "/uploads/ho_so_nang_luc_vpp_nam_khanh.pdf",
      fileName: "ho_so_nang_luc_vpp_nam_khanh_2026.pdf",
      fileSize: 3145728,
      mimeType: "application/pdf",
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
    console.log(`\u2713 \u0110\xE3 t\u1EA1o T\xE0i li\u1EC7u m\u1EABu (A.5): [${doc.type}] ${doc.title}`);
  }
  const khoTong = await prisma.warehouse.findUnique({ where: { code: "KHO-TONG" } });
  const khoTrungTam = await prisma.warehouse.findUnique({ where: { code: "KHO-TRUNG-TAM" } });
  const suppliersData = [
    {
      code: "NCC-DOUBLEA",
      name: "C\xF4ng ty TNHH Double A (Vi\u1EC7t Nam)",
      phone: "02439743888",
      email: "contact@doublea.com.vn",
      address: "T\u1EA7ng 15 T\xF2a nh\xE0 Vincom, 191 B\xE0 Tri\u1EC7u, Hai B\xE0 Tr\u01B0ng, H\xE0 N\u1ED9i",
      taxCode: "0101823940",
      contactPerson: "B\xE0 Tr\u1EA7n Kim Oanh (Gi\xE1m \u0111\u1ED1c Ph\xE2n ph\u1ED1i)",
      notes: "Nh\xE0 s\u1EA3n xu\u1EA5t \u0111\u1ED9c quy\u1EC1n gi\u1EA5y in Double A cao c\u1EA5p kh\xF4ng k\u1EB9t gi\u1EA5y"
    },
    {
      code: "NCC-THIENLONG",
      name: "C\xF4ng ty C\u1ED5 ph\u1EA7n T\u1EADp \u0111o\xE0n Thi\xEAn Long",
      phone: "02837505555",
      email: "banhang@thienlong.vn",
      address: "L\xF4 6-8-10-12, \u0110\u01B0\u1EDDng s\u1ED1 3, KCN T\xE2n T\u1EA1o, Q. B\xECnh T\xE2n, TP.HCM",
      taxCode: "0301464830",
      contactPerson: "\xD4ng Nguy\u1EC5n V\u0103n H\xF9ng (Tr\u01B0\u1EDFng k\xEAnh B2B Mi\u1EC1n B\u1EAFc)",
      notes: "Cung c\u1EA5p b\xFAt vi\u1EBFt, m\u1EF1c d\u1EA5u, d\u1EE5ng c\u1EE5 h\u1ECDc sinh v\xE0 v\u0103n ph\xF2ng ph\u1EA9m"
    },
    {
      code: "NCC-KINGJIM",
      name: "C\xF4ng ty TNHH King Jim (Vi\u1EC7t Nam)",
      phone: "02743782888",
      email: "sales@kingjim.com.vn",
      address: "\u0110\u01B0\u1EDDng D9, KCN M\u1EF9 Ph\u01B0\u1EDBc 3, B\u1EBFn C\xE1t, B\xECnh D\u01B0\u01A1ng",
      taxCode: "3700778899",
      contactPerson: "\xD4ng Sato Kenji (\u0110\u1EA1i di\u1EC7n kinh doanh)",
      notes: "Chuy\xEAn s\u1EA3n xu\u1EA5t File b\xECa c\xF2ng, b\xECa n\xFAt, s\u1ED5 l\u01B0u tr\u1EEF h\u1ED3 s\u01A1 c\xF4ng s\u1EDF"
    },
    {
      code: "NCC-BAIBANG",
      name: "T\u1ED5ng C\xF4ng ty Gi\u1EA5y Vi\u1EC7t Nam (B\xE3i B\u1EB1ng)",
      phone: "02103829222",
      email: "kinhdoanh@baibang.com.vn",
      address: "Th\u1ECB tr\u1EA5n Phong Ch\xE2u, Huy\u1EC7n Ph\xF9 Ninh, Ph\xFA Th\u1ECD",
      taxCode: "2600109999",
      contactPerson: "\xD4ng \u0110\u1ED7 Qu\u1ED1c Huy (Ph\u1EE5 tr\xE1ch th\u1ECB tr\u01B0\u1EDDng HN)",
      notes: "Th\u01B0\u01A1ng hi\u1EC7u gi\u1EA5y in n\u1ED9i \u0111\u1ECBa uy t\xEDn, \u0111\u1ED9 tr\u1EAFng s\xE1ng \u1ED5n \u0111\u1ECBnh"
    },
    {
      code: "NCC-CASIO",
      name: "C\xF4ng ty CP XNK B\xECnh T\xE2y (BITEX - NPP Casio/Max)",
      phone: "02839699999",
      email: "info@bitex.com.vn",
      address: "110-112 H\u1EADu Giang, Ph\u01B0\u1EDDng 6, Qu\u1EADn 6, TP.HCM",
      taxCode: "0301449839",
      contactPerson: "B\xE0 L\xEA Th\xFAy H\u1EB1ng (Qu\u1EA3n l\xFD d\u1EF1 \xE1n)",
      notes: "Ph\xE2n ph\u1ED1i ch\xEDnh h\xE3ng m\xE1y t\xEDnh Casio v\xE0 m\xE1y b\u1EA5m kim Max Nh\u1EADt B\u1EA3n"
    }
  ];
  const supplierMap = /* @__PURE__ */ new Map();
  for (const s of suppliersData) {
    const sup = await prisma.supplier.upsert({
      where: { code: s.code },
      update: s,
      create: s
    });
    supplierMap.set(s.code, sup);
  }
  console.log("\u2713 \u0110\xE3 t\u1EA1o 5 Nh\xE0 cung c\u1EA5p V\u0103n ph\xF2ng ph\u1EA9m");
  const categoriesData = [
    {
      code: "DM-GIAY",
      name: "Gi\u1EA5y in v\u0103n ph\xF2ng",
      warehouseId: khoTong?.id,
      description: "Gi\u1EA5y photocopy, gi\u1EA5y in vi t\xEDnh li\xEAn t\u1EE5c, gi\u1EA5y b\xF3ng k\xEDnh b\xECa c\xE1c lo\u1EA1i"
    },
    {
      code: "DM-BUT",
      name: "B\xFAt vi\u1EBFt & M\u1EF1c",
      warehouseId: khoTong?.id,
      description: "B\xFAt bi, b\xFAt gel, b\xFAt l\xF4ng b\u1EA3ng, b\xFAt d\u1EA1 quang v\xE0 m\u1EF1c d\u1EA5u chuy\xEAn d\u1EE5ng"
    },
    {
      code: "DM-BIA",
      name: "File b\xECa c\xF2ng & L\u01B0u tr\u1EEF",
      warehouseId: khoTong?.id,
      description: "File c\xF2ng b\u1EADt, b\xECa l\xE1, b\xECa n\xFAt, c\u1EB7p t\xE0i li\u1EC7u l\u01B0u tr\u1EEF ch\u1EE9ng t\u1EEB l\xE2u n\u0103m"
    },
    {
      code: "DM-DUNGCU",
      name: "D\u1EE5ng c\u1EE5 v\u0103n ph\xF2ng",
      warehouseId: khoTrungTam?.id,
      description: "B\u0103ng d\xEDnh d\xE1n th\xF9ng, b\u1EA5m kim, kim b\u1EA5m, k\u1EB9p b\u01B0\u1EDBm, k\xE9o v\xE0 dao r\u1ECDc gi\u1EA5y"
    },
    {
      code: "DM-MAY",
      name: "Thi\u1EBFt b\u1ECB & M\xE1y v\u0103n ph\xF2ng",
      warehouseId: khoTrungTam?.id,
      description: "M\xE1y t\xEDnh t\xE0i ch\xEDnh Casio, m\xE1y in h\xF3a \u0111\u01A1n, m\xE1y h\u1EE7y t\xE0i li\u1EC7u c\xF4ng s\u1EDF"
    }
  ];
  const categoryMap = /* @__PURE__ */ new Map();
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { code: cat.code },
      update: cat,
      create: cat
    });
    categoryMap.set(cat.code, c);
  }
  console.log("\u2713 \u0110\xE3 t\u1EA1o 5 Danh m\u1EE5c h\xE0ng h\xF3a VPP C\u1EA5p 1");
  const typesData = [
    { code: "LH-GIAY-A4", name: "Gi\u1EA5y in kh\u1ED5 A4", categoryCode: "DM-GIAY", unit: "Ream", description: "\u0110\u1ECBnh l\u01B0\u1EE3ng 70gsm, 80gsm ti\xEAu chu\u1EA9n" },
    { code: "LH-GIAY-A3", name: "Gi\u1EA5y in kh\u1ED5 A3", categoryCode: "DM-GIAY", unit: "Ream", description: "Gi\u1EA5y in b\u1EA3n v\u1EBD, s\u01A1 \u0111\u1ED3 A3" },
    { code: "LH-BUT-BI", name: "B\xFAt bi & B\xFAt Gel", categoryCode: "DM-BUT", unit: "H\u1ED9p", description: "B\xFAt vi\u1EBFt h\xE0ng ng\xE0y cho nh\xE2n vi\xEAn" },
    { code: "LH-BUT-KY", name: "B\xFAt k\xFD cao c\u1EA5p", categoryCode: "DM-BUT", unit: "C\xE2y", description: "B\xFAt k\xFD h\u1EE3p \u0111\u1ED3ng, b\xFAt d\u1EA1 kim" },
    { code: "LH-BIA-CONG", name: "File b\xECa c\xF2ng 5cm-7cm", categoryCode: "DM-BIA", unit: "C\xE1i", description: "L\u01B0u tr\u1EEF t\xE0i li\u1EC7u k\u1EBF to\xE1n d\xE0y" },
    { code: "LH-BIA-NUT", name: "B\xECa l\xE1 & B\xECa n\xFAt", categoryCode: "DM-BIA", unit: "X\u1EA5p", description: "B\u1EA3o qu\u1EA3n h\u1ED3 s\u01A1 ph\xE2n lo\u1EA1i nh\u1ECF" },
    { code: "LH-BAM-KIM", name: "M\xE1y b\u1EA5m kim & Kim b\u1EA5m", categoryCode: "DM-DUNGCU", unit: "C\xE1i", description: "B\u1EA5m kim s\u1ED1 10, s\u1ED1 3, tr\u1EE3 l\u1EF1c" },
    { code: "LH-BANG-DINH", name: "B\u0103ng d\xEDnh & Dao c\u1EAFt", categoryCode: "DM-DUNGCU", unit: "Cu\u1ED9n", description: "B\u0103ng d\xEDnh OPP d\xE1n th\xF9ng carton" },
    { code: "LH-MAY-TINH", name: "M\xE1y t\xEDnh c\u1EA7m tay k\u1EBF to\xE1n", categoryCode: "DM-MAY", unit: "C\xE1i", description: "M\xE1y t\xEDnh 12 s\u1ED1, m\xE1y t\xE0i ch\xEDnh" },
    { code: "LH-MAY-HUY", name: "M\xE1y h\u1EE7y t\xE0i li\u1EC7u & \u0110\xF3ng g\xE1y", categoryCode: "DM-MAY", unit: "M\xE1y", description: "H\u1EE7y gi\u1EA5y v\u0103n ph\xF2ng b\u1EA3o m\u1EADt" }
  ];
  const typeMap = /* @__PURE__ */ new Map();
  for (const t of typesData) {
    const cat = categoryMap.get(t.categoryCode);
    const pt = await prisma.productType.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        categoryId: cat?.id || "",
        unit: t.unit,
        description: t.description
      },
      create: {
        code: t.code,
        name: t.name,
        categoryId: cat?.id || "",
        unit: t.unit,
        description: t.description
      }
    });
    typeMap.set(t.code, pt);
  }
  console.log("\u2713 \u0110\xE3 t\u1EA1o 10 Lo\u1EA1i h\xE0ng h\xF3a VPP C\u1EA5p 2");
  const sampleProducts = [
    {
      code: "SP-GIAY-01",
      barcode: "8858742900123",
      name: "Gi\u1EA5y in Double A A4 70gsm (Ch\xEDnh h\xE3ng)",
      category: "Gi\u1EA5y in v\u0103n ph\xF2ng",
      unit: "Ream",
      costPrice: 68e3,
      sellingPrice: 82e3,
      vatRate: 8,
      stockQuantity: 1500,
      minStockLevel: 200,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get("DM-GIAY")?.id,
      productTypeId: typeMap.get("LH-GIAY-A4")?.id,
      supplierId: supplierMap.get("NCC-DOUBLEA")?.id,
      color: "Tr\u1EAFng 148 CIE",
      length: 297,
      width: 210,
      height: 50,
      weight: 2.5,
      description: "Gi\u1EA5y in cao c\u1EA5p kh\xF4ng k\u1EB9t gi\u1EA5y, \u0111\u1ED9 tr\u1EAFng s\xE1ng 148-151 CIE, \u0111\xF3ng g\xF3i 500 t\u1EDD/ream, 5 ream/th\xF9ng"
    },
    {
      code: "SP-GIAY-02",
      barcode: "8991389201991",
      name: "Gi\u1EA5y in PaperOne A4 80gsm",
      category: "Gi\u1EA5y in v\u0103n ph\xF2ng",
      unit: "Ream",
      costPrice: 78e3,
      sellingPrice: 95e3,
      vatRate: 8,
      stockQuantity: 1200,
      minStockLevel: 150,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get("DM-GIAY")?.id,
      productTypeId: typeMap.get("LH-GIAY-A4")?.id,
      supplierId: supplierMap.get("NCC-DOUBLEA")?.id,
      color: "Tr\u1EAFng 160 CIE",
      length: 297,
      width: 210,
      height: 55,
      weight: 2.8,
      description: "Gi\u1EA5y in \u0111\u1ECBnh l\u01B0\u1EE3ng 80gsm chuy\xEAn d\xF9ng in h\u1EE3p \u0111\u1ED3ng, ch\u1EE9ng t\u1EEB quan tr\u1ECDng v\xE0 in 2 m\u1EB7t"
    },
    {
      code: "SP-GIAY-03",
      barcode: "8935012304567",
      name: "Gi\u1EA5y in B\xE3i B\u1EB1ng H\u1ED3ng Tem V\xE0ng A4 70gsm",
      category: "Gi\u1EA5y in v\u0103n ph\xF2ng",
      unit: "Ream",
      costPrice: 52e3,
      sellingPrice: 65e3,
      vatRate: 8,
      stockQuantity: 800,
      minStockLevel: 100,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get("DM-GIAY")?.id,
      productTypeId: typeMap.get("LH-GIAY-A4")?.id,
      supplierId: supplierMap.get("NCC-BAIBANG")?.id,
      color: "Tr\u1EAFng 84-90 ISO",
      length: 297,
      width: 210,
      height: 48,
      weight: 2.2,
      description: "Gi\u1EA5y in n\u1ED9i \u0111\u1ECBa ch\u1EA5t l\u01B0\u1EE3ng cao, \u0111\u1ED9 m\u1ECBn \u0111\u1ED3ng \u0111\u1EC1u, ti\u1EBFt ki\u1EC7m chi ph\xED cho doanh nghi\u1EC7p"
    },
    {
      code: "SP-BUT-01",
      barcode: "8935001802711",
      name: "B\xFAt bi Thi\xEAn Long TL-027 0.5mm (Xanh/\u0110en/\u0110\u1ECF)",
      category: "B\xFAt vi\u1EBFt & M\u1EF1c",
      unit: "H\u1ED9p",
      costPrice: 7e4,
      sellingPrice: 95e3,
      vatRate: 8,
      stockQuantity: 500,
      minStockLevel: 50,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get("DM-BUT")?.id,
      productTypeId: typeMap.get("LH-BUT-BI")?.id,
      supplierId: supplierMap.get("NCC-THIENLONG")?.id,
      color: "Xanh, \u0110en, \u0110\u1ECF",
      description: "H\u1ED9p 20 c\xE2y b\xFAt bi m\u1EF1c tr\u01A1n \xEAm, n\xE9t vi\u1EBFt thanh m\u1EA3nh, m\u1EF1c \u0111\u1EA1t chu\u1EA9n an to\xE0n qu\u1ED1c t\u1EBF"
    },
    {
      code: "SP-BUT-02",
      barcode: "4902506070777",
      name: "B\xFAt k\xFD Pentel EnerGel BL57 0.7mm",
      category: "B\xFAt vi\u1EBFt & M\u1EF1c",
      unit: "C\xE2y",
      costPrice: 42e3,
      sellingPrice: 58e3,
      vatRate: 8,
      stockQuantity: 350,
      minStockLevel: 30,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get("DM-BUT")?.id,
      productTypeId: typeMap.get("LH-BUT-KY")?.id,
      supplierId: supplierMap.get("NCC-THIENLONG")?.id,
      color: "Xanh \u0111\u1EADm",
      description: "B\xFAt gel m\u1EF1c nhanh kh\xF4 kh\xF4ng lem, \u0111\u1EA7u bi h\u1EE3p kim si\xEAu b\u1EC1n, chuy\xEAn d\xF9ng k\xFD k\u1EBFt v\u0103n b\u1EA3n"
    },
    {
      code: "SP-BIA-01",
      barcode: "4971660007890",
      name: "File c\xF2ng b\u1EADt Kingjim 7cm A4 (Hai m\u1EB7t xi)",
      category: "File b\xECa c\xF2ng & L\u01B0u tr\u1EEF",
      unit: "C\xE1i",
      costPrice: 48e3,
      sellingPrice: 65e3,
      vatRate: 8,
      stockQuantity: 600,
      minStockLevel: 50,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get("DM-BIA")?.id,
      productTypeId: typeMap.get("LH-BIA-CONG")?.id,
      supplierId: supplierMap.get("NCC-KINGJIM")?.id,
      color: "Xanh d\u01B0\u01A1ng Kingjim",
      length: 318,
      width: 280,
      height: 70,
      description: "C\xF2ng s\u1EAFt m\u1EA1 niken ch\u1ED1ng g\u1EC9, g\xE1y 7cm ch\u1EE9a t\u1ED1i \u0111a 500 t\u1EDD A4, l\u01B0u tr\u1EEF ch\u1EE9ng t\u1EEB k\u1EBF to\xE1n"
    },
    {
      code: "SP-BIA-02",
      barcode: "4977564012345",
      name: "B\xECa l\xE1 Plus A4 trong su\u1ED1t (\u0110\u1ED9 d\xE0y 0.2mm)",
      category: "File b\xECa c\xF2ng & L\u01B0u tr\u1EEF",
      unit: "X\u1EA5p",
      costPrice: 55e3,
      sellingPrice: 75e3,
      vatRate: 8,
      stockQuantity: 400,
      minStockLevel: 40,
      warehouseId: khoTong?.id,
      categoryId: categoryMap.get("DM-BIA")?.id,
      productTypeId: typeMap.get("LH-BIA-NUT")?.id,
      supplierId: supplierMap.get("NCC-KINGJIM")?.id,
      color: "Trong su\u1ED1t",
      description: "X\u1EA5p 100 l\xE1 nh\u1EF1a PP trong su\u1ED1t, b\u1EA3o qu\u1EA3n t\xE0i li\u1EC7u s\u1EA1ch \u0111\u1EB9p kh\xF4ng b\xE1m b\u1EE5i"
    },
    {
      code: "SP-DC-01",
      barcode: "4902870012348",
      name: "M\xE1y b\u1EA5m kim Max HD-10 Nh\u1EADt B\u1EA3n",
      category: "D\u1EE5ng c\u1EE5 v\u0103n ph\xF2ng",
      unit: "C\xE1i",
      costPrice: 62e3,
      sellingPrice: 85e3,
      vatRate: 8,
      stockQuantity: 300,
      minStockLevel: 25,
      warehouseId: khoTrungTam?.id,
      categoryId: categoryMap.get("DM-DUNGCU")?.id,
      productTypeId: typeMap.get("LH-BAM-KIM")?.id,
      supplierId: supplierMap.get("NCC-CASIO")?.id,
      color: "Xanh, X\xE1m",
      description: "M\xE1y b\u1EA5m kim s\u1ED1 10 l\u1EF1c b\u1EA5m nh\u1EB9, th\xE2n b\u1ECDc nh\u1EF1a ABS cao c\u1EA5p, b\u1EA5m \u0111\u01B0\u1EE3c 20 t\u1EDD"
    },
    {
      code: "SP-DC-02",
      barcode: "8936012890123",
      name: "B\u0103ng d\xEDnh d\xE1n th\xF9ng OPP 4.8cm x 100Y (Trong/\u0110\u1EE5c)",
      category: "D\u1EE5ng c\u1EE5 v\u0103n ph\xF2ng",
      unit: "Cu\u1ED9n",
      costPrice: 15e3,
      sellingPrice: 22e3,
      vatRate: 8,
      stockQuantity: 1e3,
      minStockLevel: 100,
      warehouseId: khoTrungTam?.id,
      categoryId: categoryMap.get("DM-DUNGCU")?.id,
      productTypeId: typeMap.get("LH-BANG-DINH")?.id,
      supplierId: supplierMap.get("NCC-THIENLONG")?.id,
      color: "Trong / V\xE0ng \u0111\u1EE5c",
      description: "\u0110\u1ED9 d\xEDnh 50 mic, m\xE0ng dai d\u1EBBo ch\u1ECBu l\u1EF1c t\u1ED1t, ph\u1EE5c v\u1EE5 \u0111\xF3ng th\xF9ng \u0111\xF3ng ki\u1EC7n"
    },
    {
      code: "SP-MAY-01",
      barcode: "4549526605000",
      name: "M\xE1y t\xEDnh t\xE0i ch\xEDnh Casio FX-580VN X",
      category: "Thi\u1EBFt b\u1ECB & M\xE1y v\u0103n ph\xF2ng",
      unit: "C\xE1i",
      costPrice: 52e4,
      sellingPrice: 66e4,
      vatRate: 10,
      stockQuantity: 150,
      minStockLevel: 15,
      warehouseId: khoTrungTam?.id,
      categoryId: categoryMap.get("DM-MAY")?.id,
      productTypeId: typeMap.get("LH-MAY-TINH")?.id,
      supplierId: supplierMap.get("NCC-CASIO")?.id,
      color: "\u0110en carbon",
      description: "521 t\xEDnh n\u0103ng, m\xE0n h\xECnh LCD \u0111\u1ED9 ph\xE2n gi\u1EA3i cao, h\u1ED7 tr\u1EE3 ki\u1EC3m to\xE1n v\xE0 t\xEDnh to\xE1n k\u1EBF to\xE1n"
    }
  ];
  const productMap = /* @__PURE__ */ new Map();
  for (const p of sampleProducts) {
    const prod = await prisma.product.upsert({
      where: { code: p.code },
      update: p,
      create: p
    });
    productMap.set(p.code, prod);
  }
  console.log("\u2713 \u0110\xE3 c\u1EADp nh\u1EADt 10 S\u1EA3n ph\u1EA9m VPP li\xEAn k\u1EBFt \u0111\u1EA7y \u0111\u1EE7 Kho, Danh m\u1EE5c, Lo\u1EA1i h\xE0ng & Nh\xE0 cung c\u1EA5p");
  const salesUser = await prisma.user.findUnique({ where: { email: "sales1@namkhanh.vn" } });
  const salesDir = await prisma.user.findUnique({ where: { email: "sales.dir@namkhanh.vn" } });
  const sampleCustomers = [
    {
      code: "KH001",
      name: "C\xF4ng ty C\u1ED5 ph\u1EA7n T\u1EADp \u0110o\xE0n C\xF4ng Ngh\u1EC7 CMC",
      phone: "02437689000",
      taxCode: "0100244112",
      address: "T\xF2a nh\xE0 CMC, Ph\u1ED1 Duy T\xE2n, C\u1EA7u Gi\u1EA5y, H\xE0 N\u1ED9i",
      deliveryAddress: "T\u1EA7ng 12 T\xF2a nh\xE0 CMC, Ph\u1ED1 Duy T\xE2n, C\u1EA7u Gi\u1EA5y, H\xE0 N\u1ED9i",
      customerType: "ENTERPRISE",
      source: "REFERRAL",
      contactPerson: "Anh Ho\xE0ng H\u1EA3i (Tr\u01B0\u1EDFng ph\xF2ng H\xE0nh ch\xEDnh)",
      email: "hai.hoang@cmc.com.vn",
      notes: "Kh\xE1ch h\xE0ng k\xFD h\u1EE3p \u0111\u1ED3ng nguy\xEAn t\u1EAFc cung \u1EE9ng VPP \u0111\u1ECBnh k\u1EF3 m\u1ED7i th\xE1ng t\u1EEB 20-30 tri\u1EC7u",
      managerId: salesUser?.id,
      status: "ACTIVE"
    },
    {
      code: "KH002",
      name: "Ng\xE2n H\xE0ng TMCP Ngo\u1EA1i Th\u01B0\u01A1ng Vi\u1EC7t Nam (Vietcombank) - CN Th\u0103ng Long",
      phone: "02438313733",
      taxCode: "0100112437",
      address: "98 Ho\xE0ng Qu\u1ED1c Vi\u1EC7t, Ngh\u0129a \u0110\xF4, C\u1EA7u Gi\u1EA5y, H\xE0 N\u1ED9i",
      deliveryAddress: "Kho H\xE0nh ch\xEDnh Vietcombank Th\u0103ng Long",
      customerType: "ENTERPRISE",
      source: "SELF_FOUND",
      contactPerson: "Ch\u1ECB Nguy\u1EC5n Ph\u01B0\u01A1ng Th\u1EA3o (Ph\xF3 ph\xF2ng Qu\u1EA3n tr\u1ECB)",
      email: "thaonp.tlg@vietcombank.com.vn",
      notes: "Nhu c\u1EA7u l\u1EDBn v\u1EC1 gi\u1EA5y in A4 80gsm PaperOne v\xE0 File c\xF2ng l\u01B0u h\u1ED3 s\u01A1 t\xEDn d\u1EE5ng",
      managerId: salesUser?.id,
      status: "ACTIVE"
    },
    {
      code: "KH003",
      name: "Tr\u01B0\u1EDDng THPT Chuy\xEAn H\xE0 N\u1ED9i - Amsterdam",
      phone: "02438463096",
      taxCode: "0101438992",
      address: "S\u1ED1 1 \u0111\u01B0\u1EDDng Ho\xE0ng Minh Gi\xE1m, C\u1EA7u Gi\u1EA5y, H\xE0 N\u1ED9i",
      deliveryAddress: "Ph\xF2ng Thi\u1EBFt b\u1ECB V\u0103n ph\xF2ng - T\u1EA7ng 1 Nh\xE0 A",
      customerType: "SCHOOL",
      source: "EXHIBITION",
      contactPerson: "Th\u1EA7y L\xEA Quang \u0110\u1EA1t",
      email: "vanphong@hn-ams.edu.vn",
      notes: "Cung c\u1EA5p gi\u1EA5y in \u0111\u1EC1 thi, b\xFAt bi, \u0111\u1ED3 d\xF9ng ph\xF2ng h\u1ECDc v\xE0 m\xE1y t\xEDnh v\u0103n ph\xF2ng",
      managerId: salesDir?.id,
      status: "ACTIVE"
    },
    {
      code: "KH004",
      name: "Nh\xE0 s\xE1ch & V\u0103n Ph\xF2ng Ph\u1EA9m Minh \u0110\u1EE9c",
      phone: "0913988222",
      taxCode: "8345920192",
      address: "142 Nguy\u1EC5n Tr\xE3i, Thanh Xu\xE2n, H\xE0 N\u1ED9i",
      deliveryAddress: "Kho ph\xE2n ph\u1ED1i Minh \u0110\u1EE9c - 142 Nguy\u1EC5n Tr\xE3i",
      customerType: "HOUSEHOLD",
      source: "SELF_FOUND",
      contactPerson: "Ch\u1ECB Tr\u1EA7n Th\u1ECB Minh",
      email: "vppminhduc@gmail.com",
      notes: "\u0110\u1EA1i l\xFD ph\xE2n ph\u1ED1i c\u1EA5p 1, nh\u1EADp s\u1ED1 l\u01B0\u1EE3ng l\u1EDBn gi\u1EA5y in v\xE0 b\xFAt vi\u1EBFt theo qu\xFD",
      managerId: salesDir?.id,
      status: "ACTIVE"
    },
    {
      code: "KH005",
      name: "B\u1EC7nh Vi\u1EC7n B\u1EA1ch Mai - Ph\xF2ng H\xE0nh Ch\xEDnh Qu\u1EA3n Tr\u1ECB",
      phone: "02438693731",
      taxCode: "0100778899",
      address: "78 Gi\u1EA3i Ph\xF3ng, Ph\u01B0\u01A1ng Mai, \u0110\u1ED1ng \u0110a, H\xE0 N\u1ED9i",
      deliveryAddress: "Kho v\u1EADt t\u01B0 v\u0103n ph\xF2ng - T\u1EA7ng h\u1EA7m Nh\xE0 P",
      customerType: "ORGANIZATION",
      source: "OTHER",
      contactPerson: "B\xE1c s\u0129 V\u0169 Tu\u1EA5n Anh",
      email: "vattu@bachmai.gov.vn",
      notes: "Cung c\u1EA5p gi\u1EA5y in b\u1EC7nh \xE1n, b\xECa h\u1ED3 s\u01A1 b\u1EC7nh nh\xE2n, b\xFAt vi\u1EBFt y t\u1EBF",
      managerId: salesUser?.id,
      status: "ACTIVE"
    }
  ];
  const customerMap = /* @__PURE__ */ new Map();
  for (const c of sampleCustomers) {
    const cust = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: c,
      create: c
    });
    customerMap.set(c.code, cust);
  }
  console.log("\u2713 \u0110\xE3 t\u1EA1o 5 Kh\xE1ch h\xE0ng doanh nghi\u1EC7p & \u0111\u1EA1i l\xFD th\u1EF1c t\u1EBF");
  const custCMC = customerMap.get("KH001");
  const custVCB = customerMap.get("KH002");
  if (custCMC && salesUser) {
    const p1 = productMap.get("SP-GIAY-01");
    const p2 = productMap.get("SP-BUT-01");
    const p3 = productMap.get("SP-BIA-01");
    const q1 = await prisma.quotation.upsert({
      where: { code: "BG-2026-0001" },
      update: { status: "CONFIRMED" },
      create: {
        code: "BG-2026-0001",
        customerId: custCMC.id,
        managerId: salesUser.id,
        date: /* @__PURE__ */ new Date("2026-03-01"),
        validUntil: /* @__PURE__ */ new Date("2026-03-31"),
        status: "CONFIRMED",
        subtotal: 24e6,
        vatRate: 8,
        vatAmount: 192e4,
        totalAmount: 2592e4,
        notes: "B\xE1o gi\xE1 cung \u1EE9ng gi\u1EA5y in v\xE0 v\u0103n ph\xF2ng ph\u1EA9m th\xE1ng 03/2026 cho to\xE0n b\u1ED9 c\xE1c kh\u1ED1i ph\xF2ng ban CMC",
        items: {
          create: [
            {
              productId: p1.id,
              productCode: p1.code,
              productName: p1.name,
              unit: p1.unit,
              quantity: 200,
              unitPrice: 82e3,
              amount: 164e5,
              vatRate: 8,
              total: 17712e3
            },
            {
              productId: p2.id,
              productCode: p2.code,
              productName: p2.name,
              unit: p2.unit,
              quantity: 50,
              unitPrice: 95e3,
              amount: 475e4,
              vatRate: 8,
              total: 513e4
            },
            {
              productId: p3.id,
              productCode: p3.code,
              productName: p3.name,
              unit: p3.unit,
              quantity: 44,
              unitPrice: 65e3,
              amount: 285e4,
              vatRate: 8,
              total: 3078e3
            }
          ]
        }
      }
    });
    await prisma.order.upsert({
      where: { code: "DH-2026-0001" },
      update: {},
      create: {
        code: "DH-2026-0001",
        customerId: custCMC.id,
        quotationId: q1.id,
        managerId: salesUser.id,
        orderDate: /* @__PURE__ */ new Date("2026-03-02"),
        deliveryDate: /* @__PURE__ */ new Date("2026-03-04"),
        deliveryAddress: custCMC.deliveryAddress,
        contactPerson: custCMC.contactPerson,
        phone: custCMC.phone,
        deliveryStatus: "DELIVERED",
        paymentStatus: "PARTIAL_PAID",
        invoiceStatus: "ISSUED",
        subtotal: 24e6,
        vatRate: 8,
        vatAmount: 192e4,
        totalAmount: 2592e4,
        paidAmount: 2e7,
        remainingAmount: 592e4,
        notes: "\u0110\xE3 giao h\xE0ng \u0111\u1EA7y \u0111\u1EE7 k\xE8m phi\u1EBFu xu\u1EA5t kho. Kh\xE1ch h\xE0ng \u0111\xE3 thanh to\xE1n \u0111\u1EE3t 1 20 tri\u1EC7u, c\xF2n n\u1EE3 5.92 tri\u1EC7u",
        items: {
          create: [
            {
              productId: p1.id,
              productCode: p1.code,
              productName: p1.name,
              unit: p1.unit,
              quantity: 200,
              unitPrice: 82e3,
              amount: 164e5,
              vatRate: 8,
              total: 17712e3
            },
            {
              productId: p2.id,
              productCode: p2.code,
              productName: p2.name,
              unit: p2.unit,
              quantity: 50,
              unitPrice: 95e3,
              amount: 475e4,
              vatRate: 8,
              total: 513e4
            },
            {
              productId: p3.id,
              productCode: p3.code,
              productName: p3.name,
              unit: p3.unit,
              quantity: 44,
              unitPrice: 65e3,
              amount: 285e4,
              vatRate: 8,
              total: 3078e3
            }
          ]
        }
      }
    });
  }
  if (custVCB && salesUser) {
    const p1 = productMap.get("SP-GIAY-02");
    const p2 = productMap.get("SP-BIA-01");
    await prisma.quotation.upsert({
      where: { code: "BG-2026-0002" },
      update: {},
      create: {
        code: "BG-2026-0002",
        customerId: custVCB.id,
        managerId: salesUser.id,
        date: /* @__PURE__ */ new Date("2026-03-05"),
        validUntil: /* @__PURE__ */ new Date("2026-04-05"),
        status: "SENT",
        subtotal: 17e6,
        vatRate: 8,
        vatAmount: 136e4,
        totalAmount: 1836e4,
        notes: "B\xE1o gi\xE1 l\xF4 gi\u1EA5y in PaperOne 80gsm v\xE0 File c\xF2ng Kingjim ph\u1EE5c v\u1EE5 l\u01B0u tr\u1EEF h\u1ED3 s\u01A1 th\u1EBB ng\xE2n h\xE0ng",
        items: {
          create: [
            {
              productId: p1.id,
              productCode: p1.code,
              productName: p1.name,
              unit: p1.unit,
              quantity: 150,
              unitPrice: 95e3,
              amount: 1425e4,
              vatRate: 8,
              total: 1539e4
            },
            {
              productId: p2.id,
              productCode: p2.code,
              productName: p2.name,
              unit: p2.unit,
              quantity: 42,
              unitPrice: 65e3,
              amount: 275e4,
              vatRate: 8,
              total: 297e4
            }
          ]
        }
      }
    });
    await prisma.order.upsert({
      where: { code: "DH-2026-0002" },
      update: {},
      create: {
        code: "DH-2026-0002",
        customerId: custVCB.id,
        managerId: salesUser.id,
        orderDate: /* @__PURE__ */ new Date("2026-03-06"),
        deliveryDate: /* @__PURE__ */ new Date("2026-03-08"),
        deliveryAddress: custVCB.deliveryAddress,
        contactPerson: custVCB.contactPerson,
        phone: custVCB.phone,
        deliveryStatus: "DELIVERING",
        paymentStatus: "PAID",
        invoiceStatus: "ISSUED",
        subtotal: 17e6,
        vatRate: 8,
        vatAmount: 136e4,
        totalAmount: 1836e4,
        paidAmount: 1836e4,
        remainingAmount: 0,
        notes: "Kh\xE1ch h\xE0ng chuy\u1EC3n kho\u1EA3n thanh to\xE1n 100% tr\u01B0\u1EDBc khi giao h\xE0ng. \u0110ang v\u1EADn chuy\u1EC3n xe t\u1EA3i.",
        items: {
          create: [
            {
              productId: p1.id,
              productCode: p1.code,
              productName: p1.name,
              unit: p1.unit,
              quantity: 150,
              unitPrice: 95e3,
              amount: 1425e4,
              vatRate: 8,
              total: 1539e4
            },
            {
              productId: p2.id,
              productCode: p2.code,
              productName: p2.name,
              unit: p2.unit,
              quantity: 42,
              unitPrice: 65e3,
              amount: 275e4,
              vatRate: 8,
              total: 297e4
            }
          ]
        }
      }
    });
  }
  if (salesDir) {
    const existingPlan = await prisma.salesPlan.findFirst({ where: { periodValue: "Q1/2026" } });
    if (!existingPlan) {
      await prisma.salesPlan.create({
        data: {
          title: "K\u1EBF ho\u1EA1ch kinh doanh ph\xE2n ph\u1ED1i V\u0103n ph\xF2ng ph\u1EA9m Qu\xFD 1/2026",
          periodType: "QUARTER",
          periodValue: "Q1/2026",
          year: 2026,
          createdById: salesDir.id,
          notes: "M\u1EE5c ti\xEAu tr\u1ECDng t\xE2m: \u0110\u1EA9y m\u1EA1nh s\u1EA3n l\u01B0\u1EE3ng Gi\u1EA5y in v\u0103n ph\xF2ng v\xE0 m\u1EDF r\u1ED9ng m\u1EA1ng l\u01B0\u1EDBi kh\xE1ch h\xE0ng doanh nghi\u1EC7p, ng\xE2n h\xE0ng",
          status: "ACTIVE",
          items: {
            create: [
              {
                category: "Gi\u1EA5y in v\u0103n ph\xF2ng",
                unit: "Ream",
                targetQuantity: 3e3,
                targetRevenue: 24e7,
                actualQuantity: 2850,
                actualRevenue: 228e6
              },
              {
                category: "B\xFAt vi\u1EBFt & M\u1EF1c",
                unit: "H\u1ED9p",
                targetQuantity: 800,
                targetRevenue: 76e6,
                actualQuantity: 720,
                actualRevenue: 684e5
              },
              {
                category: "File b\xECa c\xF2ng & L\u01B0u tr\u1EEF",
                unit: "C\xE1i",
                targetQuantity: 1200,
                targetRevenue: 78e6,
                actualQuantity: 1100,
                actualRevenue: 715e5
              },
              {
                category: "D\u1EE5ng c\u1EE5 v\u0103n ph\xF2ng",
                unit: "C\xE1i",
                targetQuantity: 600,
                targetRevenue: 45e6,
                actualQuantity: 520,
                actualRevenue: 39e6
              },
              {
                category: "Thi\u1EBFt b\u1ECB & M\xE1y v\u0103n ph\xF2ng",
                unit: "C\xE1i",
                targetQuantity: 80,
                targetRevenue: 52e6,
                actualQuantity: 75,
                actualRevenue: 4875e4
              }
            ]
          }
        }
      });
      console.log("\u2713 \u0110\xE3 t\u1EA1o K\u1EBF ho\u1EA1ch kinh doanh m\u1EABu (B.6)");
    }
  }
  console.log("--- SEED PH\xC2N H\u1EC6 E: T\xC0I CH\xCDNH & THU CHI ---");
  const cpVanPhong = await prisma.expenseCategory.upsert({
    where: { code: "CP-VP" },
    update: {},
    create: {
      code: "CP-VP",
      name: "Chi ph\xED Qu\u1EA3n l\xFD V\u0103n ph\xF2ng",
      description: "Ti\u1EC1n thu\xEA m\u1EB7t b\u1EB1ng, \u0111i\u1EC7n n\u01B0\u1EDBc, internet, v\u1EADt t\u01B0 v\u0103n ph\xF2ng n\u1ED9i b\u1ED9",
      status: "ACTIVE"
    }
  });
  const cpBanHang = await prisma.expenseCategory.upsert({
    where: { code: "CP-BH" },
    update: {},
    create: {
      code: "CP-BH",
      name: "Chi ph\xED B\xE1n h\xE0ng & V\u1EADn chuy\u1EC3n",
      description: "X\u0103ng xe giao h\xE0ng, c\u01B0\u1EDBc v\u1EADn chuy\u1EC3n, ti\u1EBFp kh\xE1ch, hoa h\u1ED3ng kinh doanh",
      status: "ACTIVE"
    }
  });
  const cpNhanSu = await prisma.expenseCategory.upsert({
    where: { code: "CP-NS" },
    update: {},
    create: {
      code: "CP-NS",
      name: "Chi ph\xED Nh\xE2n s\u1EF1 & \u0110\xE0o t\u1EA1o",
      description: "Ph\u1EE5 c\u1EA5p \u0103n tr\u01B0a, c\xF4ng t\xE1c ph\xED, ho\u1EA1t \u0111\u1ED9ng \u0111\xE0o t\u1EA1o, teambuilding",
      status: "ACTIVE"
    }
  });
  const lcpThueNha = await prisma.expenseType.upsert({
    where: { code: "LCP-THUE-NHA" },
    update: {},
    create: {
      code: "LCP-THUE-NHA",
      name: "Ti\u1EC1n thu\xEA v\u0103n ph\xF2ng & kho b\xE3i",
      categoryId: cpVanPhong.id,
      description: "Thanh to\xE1n \u0111\u1ECBnh k\u1EF3 h\xE0ng th\xE1ng"
    }
  });
  const lcpDienNuoc = await prisma.expenseType.upsert({
    where: { code: "LCP-DIEN-NUOC" },
    update: {},
    create: {
      code: "LCP-DIEN-NUOC",
      name: "Ti\u1EC1n \u0111i\u1EC7n, n\u01B0\u1EDBc & Internet vi\u1EC5n th\xF4ng",
      categoryId: cpVanPhong.id
    }
  });
  const lcpVanChuyen = await prisma.expenseType.upsert({
    where: { code: "LCP-VAN-CHUYEN" },
    update: {},
    create: {
      code: "LCP-VAN-CHUYEN",
      name: "C\u01B0\u1EDBc v\u1EADn chuy\u1EC3n & X\u0103ng xe giao h\xE0ng VPP",
      categoryId: cpBanHang.id
    }
  });
  const lcpTiepKhach = await prisma.expenseType.upsert({
    where: { code: "LCP-TIEP-KHACH" },
    update: {},
    create: {
      code: "LCP-TIEP-KHACH",
      name: "Chi ph\xED ti\u1EBFp kh\xE1ch & \u0110\xE0m ph\xE1n h\u1EE3p \u0111\u1ED3ng",
      categoryId: cpBanHang.id
    }
  });
  console.log("\u2713 \u0110\xE3 t\u1EA1o Danh m\u1EE5c & Lo\u1EA1i chi ph\xED (E.I.1)");
  const ktBanHang = await prisma.revenueType.upsert({
    where: { code: "KT-BAN-HANG" },
    update: {},
    create: {
      code: "KT-BAN-HANG",
      name: "Thu ti\u1EC1n b\xE1n h\xE0ng V\u0103n ph\xF2ng ph\u1EA9m",
      description: "Thu ti\u1EC1n kh\xE1ch h\xE0ng thanh to\xE1n \u0111\u01A1n h\xE0ng VPP"
    }
  });
  const ktInAn = await prisma.revenueType.upsert({
    where: { code: "KT-DICH-VU-IN" },
    update: {},
    create: {
      code: "KT-DICH-VU-IN",
      name: "Thu d\u1ECBch v\u1EE5 in \u1EA5n & \u0111\xF3ng cu\u1ED1n",
      description: "Gia c\xF4ng \u0111\xF3ng b\xECa c\xF2ng, in \u1EA5n t\xE0i li\u1EC7u"
    }
  });
  const ktHoanUng = await prisma.revenueType.upsert({
    where: { code: "KT-HOAN-UNG" },
    update: {},
    create: {
      code: "KT-HOAN-UNG",
      name: "Thu ho\xE0n \u1EE9ng c\xF4ng t\xE1c ph\xED",
      description: "Nh\xE2n vi\xEAn ho\xE0n \u1EE9ng sau khi ho\xE0n t\u1EA5t c\xF4ng t\xE1c"
    }
  });
  console.log("\u2713 \u0110\xE3 t\u1EA1o Nh\xF3m lo\u1EA1i kho\u1EA3n thu (E.II.1)");
  const financeKetoan = await prisma.user.findFirst({ where: { email: "ketoan@namkhanh.vn" } });
  const financeCeo = await prisma.user.findFirst({ where: { email: "giamdoc@namkhanh.vn" } });
  const sampleCustomer = await prisma.customer.findFirst();
  const sampleOrder = await prisma.order.findFirst();
  await prisma.paymentVoucher.upsert({
    where: { code: "PC-2026-0001" },
    update: {},
    create: {
      code: "PC-2026-0001",
      voucherDate: /* @__PURE__ */ new Date("2026-03-01"),
      categoryId: cpVanPhong.id,
      typeId: lcpThueNha.id,
      recipient: "C\xF4ng ty CP \u0110\u1EA7u T\u01B0 \u0110\u1ECBa \u1ED0c C\u1EA7u Gi\u1EA5y",
      phone: "0988112233",
      address: "T\u1EA7ng 3, T\xF2a nh\xE0 C\u1EA7u Gi\u1EA5y, H\xE0 N\u1ED9i",
      reason: "Thanh to\xE1n ti\u1EC1n thu\xEA v\u0103n ph\xF2ng tr\u1EE5 s\u1EDF ch\xEDnh Th\xE1ng 03/2026",
      amount: 15e6,
      paymentMethod: "BANK_TRANSFER",
      invoiceNumber: "HD-THUE-0326",
      status: "PAID",
      createdById: financeKetoan?.id,
      approvedById: financeCeo?.id,
      approvedAt: /* @__PURE__ */ new Date("2026-03-01T10:00:00Z"),
      notes: "\u0110\xE3 ho\xE0n t\u1EA5t chuy\u1EC3n kho\u1EA3n Vietcombank"
    }
  });
  await prisma.paymentVoucher.upsert({
    where: { code: "PC-2026-0002" },
    update: {},
    create: {
      code: "PC-2026-0002",
      voucherDate: /* @__PURE__ */ new Date("2026-03-05"),
      categoryId: cpBanHang.id,
      typeId: lcpVanChuyen.id,
      recipient: "Nguy\u1EC5n V\u0103n H\xF9ng (\u0110\u1ED9i xe giao h\xE0ng)",
      phone: "0912345678",
      reason: "Thanh to\xE1n x\u0103ng xe v\xE0 ph\xED c\u1EA7u \u0111\u01B0\u1EDDng giao h\xE0ng tu\u1EA7n 1 th\xE1ng 3",
      amount: 235e4,
      paymentMethod: "CASH",
      status: "PAID",
      createdById: financeKetoan?.id,
      approvedById: financeKetoan?.id,
      approvedAt: /* @__PURE__ */ new Date("2026-03-05T14:30:00Z")
    }
  });
  await prisma.paymentVoucher.upsert({
    where: { code: "PC-2026-0003" },
    update: {},
    create: {
      code: "PC-2026-0003",
      voucherDate: /* @__PURE__ */ new Date("2026-03-08"),
      categoryId: cpBanHang.id,
      typeId: lcpTiepKhach.id,
      recipient: "Tr\u1EA7n V\u0103n Nam (Ph\xF2ng Kinh Doanh)",
      phone: "0903456789",
      reason: "Ti\u1EBFp kh\xE1ch \u0111\xE0m ph\xE1n h\u1EE3p \u0111\u1ED3ng cung c\u1EA5p VPP kh\u1ED1i c\u01A1 quan",
      amount: 32e5,
      paymentMethod: "CASH",
      status: "APPROVED",
      createdById: financeKetoan?.id,
      approvedById: financeCeo?.id,
      approvedAt: /* @__PURE__ */ new Date("2026-03-08T16:00:00Z"),
      notes: "\u0110\xE3 duy\u1EC7t chi, ch\u1EDD xu\u1EA5t qu\u1EF9"
    }
  });
  console.log("\u2713 \u0110\xE3 t\u1EA1o Phi\u1EBFu chi ti\u1EC1n m\u1EABu (E.I.2)");
  if (sampleCustomer) {
    await prisma.receiptVoucher.upsert({
      where: { code: "PT-2026-0001" },
      update: {},
      create: {
        code: "PT-2026-0001",
        voucherDate: /* @__PURE__ */ new Date("2026-03-03"),
        typeId: ktBanHang.id,
        payer: sampleCustomer.contactPerson || sampleCustomer.name,
        phone: sampleCustomer.phone,
        address: sampleCustomer.address || "H\xE0 N\u1ED9i",
        reason: `Thu ti\u1EC1n thanh to\xE1n \u0111\u01A1n h\xE0ng VPP c\u1EE7a ${sampleCustomer.name}`,
        amount: 85e5,
        paymentMethod: "BANK_TRANSFER",
        invoiceNumber: "UNC-TCB-88392",
        status: "PAID",
        customerId: sampleCustomer.id,
        orderId: sampleOrder?.id || null,
        createdById: financeKetoan?.id,
        approvedById: financeKetoan?.id,
        approvedAt: /* @__PURE__ */ new Date("2026-03-03T11:00:00Z"),
        notes: "Ti\u1EC1n \u0111\xE3 v\u1EC1 t\xE0i kho\u1EA3n Techcombank Nam Kh\xE1nh"
      }
    });
    await prisma.receiptVoucher.upsert({
      where: { code: "PT-2026-0002" },
      update: {},
      create: {
        code: "PT-2026-0002",
        voucherDate: /* @__PURE__ */ new Date("2026-03-09"),
        typeId: ktBanHang.id,
        payer: "Ph\u1EA1m Th\u1ECB Lan",
        phone: "0977665544",
        address: "Thanh Xu\xE2n, H\xE0 N\u1ED9i",
        reason: "\u0110\u1EB7t c\u1ECDc 50% \u0111\u01A1n h\xE0ng v\u1EADt t\u01B0 v\xE0 gi\u1EA5y in v\u0103n ph\xF2ng qu\xFD 1",
        amount: 5e6,
        paymentMethod: "CASH",
        status: "PENDING",
        customerId: sampleCustomer.id,
        createdById: financeKetoan?.id
      }
    });
    console.log("\u2713 \u0110\xE3 t\u1EA1o Phi\u1EBFu thu ti\u1EC1n m\u1EABu (E.II.2)");
  }
  console.log("--- HO\xC0N TH\xC0NH SEED D\u1EEE LI\u1EC6U TH\xC0NH C\xD4NG! ---");
}
main().catch((e) => {
  console.error("L\u1ED7i khi seed d\u1EEF li\u1EC7u:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
