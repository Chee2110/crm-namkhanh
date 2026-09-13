export interface Department {
  id: string;
  code: string;
  name: string;
  parentId?: string | null;
  parent?: { id: string; code: string; name: string } | null;
  children?: Department[];
  managerId?: string | null;
  manager?: { id: string; code: string; fullName: string; email: string; phone?: string } | null;
  address?: string;
  mission?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  _count?: { staff: number; children: number };
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  _count?: { userRoles: number; permissions: number };
}

export interface User {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone?: string;
  dob?: string;
  avatarUrl?: string;
  departmentId?: string;
  department?: { id: string; code: string; name: string } | null;
  managerId?: string;
  manager?: { id: string; code: string; fullName: string; email: string } | null;
  roles: Role[];
  status: 'ACTIVE' | 'INACTIVE';
  startDate?: string;
  createdAt: string;
  basicSalary?: number;
  allowance?: number;
}

export interface RolePermission {
  moduleCode: string;
  moduleName?: string;
  group?: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  dataScope: 'ALL' | 'DEPARTMENT' | 'PERSONAL';
}

export interface LegalDocument {
  id: string;
  code: string;
  title: string;
  type: 'CONTRACT' | 'CERTIFICATE';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedById?: string;
  uploadedBy?: { id: string; fullName: string } | null;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  department?: { id: string; code: string; name: string } | null;
  roles: string[];
  basicSalary?: number;
  allowance?: number;
  permissions: RolePermission[];
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  department?: { id: string; code: string; name: string } | null;
  status: 'ACTIVE' | 'INACTIVE';
  categoryCount?: number;
  totalSku?: number;
  totalStock?: number;
  totalValue?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  warehouseId?: string | null;
  warehouse?: { id: string; code: string; name: string } | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  productTypes?: ProductType[];
  _count?: { productTypes: number; products: number };
  createdAt: string;
}

export interface ProductType {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category?: {
    id: string;
    code: string;
    name: string;
    warehouse?: { id: string; code: string; name: string } | null;
  } | null;
  unit?: string | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  _count?: { products: number };
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  _count?: { products: number };
  products?: Product[];
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  barcode?: string | null;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  vatRate: number;
  stockQuantity: number;
  minStockLevel?: number;
  warehouseId?: string | null;
  warehouse?: Warehouse | null;
  categoryId?: string | null;
  categoryRel?: Category | null;
  productTypeId?: string | null;
  productType?: ProductType | null;
  supplierId?: string | null;
  supplier?: Supplier | null;
  color?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  weight?: number | null;
  imageUrl?: string | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface InventoryOverviewKPIs {
  totalQuantity: number;
  totalInventoryValue: number;
  totalCategories: number;
  totalProductTypes: number;
  totalWarehouses: number;
  lowStockCount: number;
}

export interface InventoryOverview {
  kpis: InventoryOverviewKPIs;
  categoryBreakdown: Array<{
    code: string;
    name: string;
    quantity: number;
    value: number;
    percentage: number;
  }>;
  warehouseBreakdown: Array<{
    id: string;
    code: string;
    name: string;
    skuCount: number;
    quantity: number;
    value: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    code: string;
    name: string;
    unit: string;
    category: string;
    stockQuantity: number;
    minStockLevel: number;
    warehouseName: string;
  }>;
  topValueProducts: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
    unit: string;
    stockQuantity: number;
    costPrice: number;
    inventoryValue: number;
    warehouseName: string;
  }>;
}

export interface InventoryReportItem {
  stt: number;
  id?: string;
  code: string;
  barcode?: string;
  name: string;
  categoryName?: string;
  typeName?: string;
  warehouseName?: string;
  unit?: string;
  quantity: number;
  minStockLevel?: number;
  costPrice?: number;
  sellingPrice?: number;
  value: number;
  percentage: string;
  status?: string;
}


export interface CustomerHandover {
  id: string;
  fromUser?: { id: string; fullName: string; code: string } | null;
  toUser: { id: string; fullName: string; code: string };
  reason: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  taxCode?: string | null;
  address?: string | null;
  deliveryAddress?: string | null;
  customerType: 'ENTERPRISE' | 'HOUSEHOLD' | 'ORGANIZATION' | 'SCHOOL' | 'INDIVIDUAL';
  source: string;
  contactPerson?: string | null;
  email?: string | null;
  notes?: string | null;
  managerId?: string | null;
  manager?: { id: string; fullName: string; code: string; email: string; phone?: string } | null;
  status: 'ACTIVE' | 'INACTIVE';
  creditBalance?: number;
  createdAt: string;
  _count?: { quotations: number; orders: number };
  quotations?: Quotation[];
  orders?: Order[];
  handovers?: CustomerHandover[];
  analytics?: {
    totalSpent: number;
    totalPaid: number;
    totalDebt: number;
    orderCount: number;
    lastOrderDate: string | null;
  };
}

export interface CustomerTimelineItem {
  id: string;
  type: 'QUOTATION' | 'ORDER' | 'HANDOVER';
  title: string;
  status?: string;
  paymentStatus?: string;
  amount?: number;
  paid?: number;
  remaining?: number;
  date: string;
  notes?: string;
  actor?: string;
  from?: string;
  to?: string;
  reason?: string;
}

export interface QuotationItem {
  id?: string;
  productId?: string | null;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRate: number;
  total: number;
}

export interface Quotation {
  id: string;
  code: string;
  customerId: string;
  customer: Customer;
  managerId?: string | null;
  manager?: { id: string; fullName: string; code: string; email: string; phone?: string } | null;
  date: string;
  validUntil?: string | null;
  status: 'DRAFT' | 'NEGOTIATING' | 'SENT' | 'CONFIRMED' | 'CANCELLED';
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string | null;
  items: QuotationItem[];
  createdAt: string;
  _count?: { orders: number };
}

export interface OrderItem {
  id?: string;
  productId?: string | null;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRate: number;
  total: number;
}

export interface Order {
  id: string;
  code: string;
  customerId: string;
  customer: Customer;
  quotationId?: string | null;
  quotation?: { id: string; code: string } | null;
  managerId?: string | null;
  manager?: { id: string; fullName: string; code: string; email: string; phone?: string } | null;
  orderDate: string;
  deliveryDate?: string | null;
  deliveryAddress?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  deliveryStatus: 'PENDING' | 'PARTIAL' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PARTIAL_PAID' | 'PAID';
  invoiceStatus: 'NOT_ISSUED' | 'ISSUING' | 'ISSUED';
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  refundAmount?: number;
  adjustedAmount?: number;
  adjustmentReason?: string | null;
  notes?: string | null;
  items: OrderItem[];
  createdAt: string;
  handovers?: Array<{
    id: string;
    fromUser?: { fullName: string } | null;
    toUser: { fullName: string };
    reason: string;
    createdAt: string;
  }>;
  returns?: OrderReturn[];
  allocations?: ReceiptVoucherAllocation[];
}

export interface SalesPlanItem {
  id?: string;
  category: string;
  unit: string;
  targetQuantity: number;
  targetRevenue: number;
  actualQuantity?: number;
  actualRevenue?: number;
  revenuePercent?: number;
  quantityPercent?: number;
  isCompleted?: boolean;
}

export interface SalesPlan {
  id: string;
  title: string;
  periodType: 'MONTH' | 'QUARTER' | 'YEAR';
  periodValue: string;
  year: number;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  createdById?: string | null;
  createdBy?: { id: string; fullName: string; code: string } | null;
  notes?: string | null;
  status: string;
  items: SalesPlanItem[];
  createdAt: string;
}

export interface SalesOverviewKPIs {
  totalRevenue: number;
  totalOrders: number;
  totalPaid: number;
  totalDebt: number;
  activeCustomersCount: number;
  totalVolume: number;
}

export interface SalesOverview {
  period: 'year' | 'quarter' | 'month';
  kpis: SalesOverviewKPIs;
  categoryBreakdown: Array<{
    name: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  topCustomers: Array<{
    name: string;
    code: string;
    phone: string;
    totalRevenue: number;
    orderCount: number;
  }>;
  recentOrders: Array<{
    id: string;
    code: string;
    customerName: string;
    managerName?: string;
    totalAmount: number;
    deliveryStatus: string;
    paymentStatus: string;
    orderDate: string;
  }>;
}

// ==========================================
// PHÂN HỆ E: TÀI CHÍNH & THU CHI TYPES
// ==========================================

export interface ExpenseType {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category?: { id: string; code: string; name: string };
  description?: string | null;
  status: string;
  createdAt: string;
  _count?: { vouchers: number };
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  types?: ExpenseType[];
  createdAt: string;
  _count?: { vouchers: number };
}

export interface RevenueType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  _count?: { vouchers: number };
}

export interface PaymentVoucher {
  id: string;
  code: string;
  voucherDate: string;
  categoryId?: string | null;
  category?: { id: string; code: string; name: string } | null;
  typeId?: string | null;
  type?: { id: string; code: string; name: string } | null;
  recipient: string;
  phone?: string | null;
  address?: string | null;
  reason: string;
  amount: number;
  paymentMethod: string;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  customerId?: string | null;
  customer?: { id: string; code: string; name: string; phone?: string } | null;
  orderId?: string | null;
  order?: { id: string; code: string; totalAmount: number } | null;
  createdById?: string | null;
  createdBy?: { id: string; fullName: string; code: string; email: string } | null;
  approvedById?: string | null;
  approvedBy?: { id: string; fullName: string; code: string; email: string } | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ReceiptVoucher {
  id: string;
  code: string;
  voucherDate: string;
  typeId?: string | null;
  type?: { id: string; code: string; name: string } | null;
  payer: string;
  phone?: string | null;
  address?: string | null;
  reason: string;
  amount: number;
  paymentMethod: string;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  customerId?: string | null;
  customer?: { id: string; code: string; name: string; phone?: string } | null;
  orderId?: string | null;
  order?: {
    id: string;
    code: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string;
  } | null;
  createdById?: string | null;
  createdBy?: { id: string; fullName: string; code: string; email: string } | null;
  approvedById?: string | null;
  approvedBy?: { id: string; fullName: string; code: string; email: string } | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  notes?: string | null;
  createdAt: string;
  allocations?: ReceiptVoucherAllocation[];
}

export interface ReceiptVoucherAllocation {
  id?: string;
  voucherId?: string;
  orderId: string;
  amount: number;
  order?: {
    id: string;
    code: string;
    totalAmount: number;
    paidAmount?: number;
    remainingAmount: number;
    paymentStatus?: string;
  };
}

export interface OrderReturnItem {
  id?: string;
  productId?: string | null;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface OrderReturn {
  id: string;
  code: string;
  orderId: string;
  order?: {
    id: string;
    code: string;
    customer?: { id: string; name: string; phone?: string };
  };
  returnDate: string;
  reason: string;
  totalRefundAmount: number;
  refundMethod: 'DEDUCT_DEBT' | 'CASH_REFUND' | 'CREDIT_BALANCE';
  status: string;
  createdById?: string | null;
  createdBy?: { id: string; fullName: string; code: string } | null;
  items: OrderReturnItem[];
  createdAt: string;
}

export interface CashflowKPIs {
  totalReceipts: number;
  paidReceipts: number;
  pendingReceipts: number;
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
  netCashflow: number;
  receiptCount: number;
  paymentCount: number;
}

export interface CashflowSummary {
  kpis: CashflowKPIs;
  revenueBreakdown: Array<{
    id: string;
    code: string;
    name: string;
    amount: number;
    percentage: number;
  }>;
  expenseBreakdown: Array<{
    id: string;
    code: string;
    name: string;
    amount: number;
    percentage: number;
  }>;
}

// ==========================================
// PHÂN HỆ F: DASHBOARD ĐIỀU HÀNH KINH DOANH
// ==========================================

export interface DashboardExecutiveKPIs {
  totalRevenue: number;
  orderCount: number;
  totalVolume: number;
  totalCogs: number;
  grossProfit: number;
  grossMargin: number;
  totalDebt: number;
  netCashflow: number;
  totalReceipts: number;
  totalPayments: number;
  totalStockQuantity: number;
  totalInventoryValue: number;
  lowStockCount: number;
}

export interface DashboardExecutiveOverview {
  period: 'all' | 'year' | 'month';
  kpis: DashboardExecutiveKPIs;
  updatedAt: string;
}

export interface CategoryVolumeRevenue {
  id: string;
  code: string;
  name: string;
  volume: number;
  revenue: number;
  percentage: number;
}

export interface MonthlyRevenueTrend {
  month: string;
  monthNumber: number;
  revenue: number;
  orderCount: number;
}

export interface TopProductStat {
  id: string;
  code: string;
  name: string;
  unit: string;
  categoryName: string;
  quantity: number;
  revenue: number;
}

export interface TopCustomerStat {
  id: string;
  code: string;
  name: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  remainingDebt: number;
}

export interface DashboardRevenueVolume {
  period: 'all' | 'year' | 'month';
  totals: {
    revenue: number;
    volume: number;
  };
  categoryBreakdown: CategoryVolumeRevenue[];
  monthlyData: MonthlyRevenueTrend[];
  topProducts: TopProductStat[];
  topCustomers: TopCustomerStat[];
  updatedAt: string;
}

export interface CategoryProfit {
  id: string;
  code: string;
  name: string;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
  contribution: number;
  isLoss: boolean;
}

export interface ProfitSummary {
  totalRevenue: number;
  totalCogs: number;
  totalProfit: number;
  overallMargin: number;
}

export interface DashboardProfit {
  period: 'all' | 'year' | 'month';
  summary: ProfitSummary;
  categoryProfits: CategoryProfit[];
  updatedAt: string;
}


