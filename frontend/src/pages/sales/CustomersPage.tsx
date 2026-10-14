import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Plus,
  Search,
  Phone,
  Building,
  UserCheck,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowRight,
  Eye,
  FileSpreadsheet,
  ShoppingBag,
  RefreshCw,
  X,
  Columns,
  LayoutGrid,
  Table,
  GripVertical,
  RotateCcw,
  SlidersHorizontal,
  MapPin,
  Edit2,
  Pencil,
  ArrowLeftRight,
  Trash2,
  ArrowLeft,
  Truck,
  Lightbulb,
  FileText,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Printer,
  Loader2,
  Filter,
  Check,
  Mail,
  Building2,
  Hash,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { Customer, CustomerTimelineItem, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ImportExcelModal } from '../../components/common/ImportExcelModal';
import { DebtConfirmationModal } from './components/DebtConfirmationModal';
import { useTableResize } from '../../hooks/useTableResize';
import { Toast } from '../../components/common/Toast';
import { ColumnCustomizerDropdown } from '../../components/common/ColumnCustomizerDropdown';
import { StatusBadgeDropdown, StatusOption } from '../../components/common/StatusBadgeDropdown';
import { withActionsLast } from '../../utils/columnOrder';
import { SearchInput } from '../../components/common/SearchInput';

const CUSTOMER_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ACTIVE', label: 'Hoạt động', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  { value: 'INACTIVE', label: 'Tạm dừng', colorClass: 'bg-red-50 text-red-700 border-red-300' }
];

const CUSTOMER_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả loại khách' },
  { value: 'ENTERPRISE', label: 'Doanh nghiệp' },
  { value: 'SCHOOL', label: 'Trường học' },
  { value: 'ORGANIZATION', label: 'Cơ quan / Tổ chức' },
  { value: 'HOUSEHOLD', label: 'Đại lý / Hộ KD' },
  { value: 'INDIVIDUAL', label: 'Cá nhân' }
];

const SOURCE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả nguồn gốc' },
  { value: 'SELF_FOUND', label: 'Tự tìm kiếm' },
  { value: 'REFERRAL', label: 'Được giới thiệu' },
  { value: 'SOCIAL', label: 'Mạng xã hội / Web' },
  { value: 'EXHIBITION', label: 'Hội thảo / Triển lãm' },
  { value: 'OTHER', label: 'Khác' }
];

const getCustomerTypeBadge = (type?: string) => {
  if (type === 'HOUSEHOLD') {
    return {
      label: 'Hộ kinh doanh',
      badgeClass: 'bg-[#E8F8F0] text-[#10B981] border border-[#A7F3D0]',
      codeBadgeClass: 'bg-[#E8F8F0] text-[#10B981] border border-[#A7F3D0]'
    };
  }
  if (type === 'INDIVIDUAL') {
    return {
      label: 'Cá nhân',
      badgeClass: 'bg-[#FFF4EB] text-[#F97316] border border-[#FED7AA]',
      codeBadgeClass: 'bg-[#FFF4EB] text-[#F97316] border border-[#FED7AA]'
    };
  }
  const label = type === 'SCHOOL' ? 'Trường học' : type === 'ORGANIZATION' ? 'Cơ quan/Tổ chức' : 'Doanh nghiệp';
  return {
    label,
    badgeClass: 'bg-[#EBF5FF] text-[#2563EB] border border-[#BFDBFE]',
    codeBadgeClass: 'bg-[#EBF5FF] text-[#2563EB] border border-[#BFDBFE]'
  };
};

const getPaymentMethodLabel = (method?: string) => {
  switch (method) {
    case 'CASH': return 'Tiền mặt';
    case 'BANK_TRANSFER': return 'Chuyển khoản';
    case 'DEBT': return 'Ghi nợ';
    case 'CREDIT': return 'Thẻ tín dụng';
    default: return method || '';
  }
};

const getQuotationStatusLabel = (s?: string) => {
  switch (s) {
    case 'DRAFT': return 'Bản nháp';
    case 'SENT': return 'Đã gửi khách';
    case 'APPROVED': return 'Đã duyệt';
    case 'REJECTED': return 'Từ chối';
    default: return s || '';
  }
};

const getOrderStatusLabel = (s?: string) => {
  switch (s) {
    case 'PENDING': return 'Chờ xử lý';
    case 'PROCESSING': return 'Đang xử lý';
    case 'DELIVERING': return 'Đang giao hàng';
    case 'DELIVERED': return 'Đã giao hàng';
    case 'COMPLETED': return 'Hoàn thành';
    case 'CANCELLED': return 'Đã hủy';
    default: return s || '';
  }
};

const getPaymentStatusLabel = (s?: string) => {
  switch (s) {
    case 'UNPAID': return 'Chưa thanh toán';
    case 'PARTIAL': return 'Thanh toán một phần';
    case 'PAID': return 'Đã thanh toán đủ';
    default: return s || '';
  }
};

// Cấu trúc cột file Excel nhập khách hàng (thứ tự chuẩn theo file mẫu)
const CUSTOMER_IMPORT_HEADERS = [
  'STT',
  'Mã khách hàng',
  'Tên khách hàng',
  'Mã số thuế',
  'Số điện thoại',
  'Địa chỉ công ty',
  'Tên người liên hệ',
  'Số điện thoại người liên hệ',
  'Địa chỉ giao hàng',
  'Người phụ trách',
  'Loại khách hàng',
  'Nguồn gốc'
];

// Ánh xạ tiêu đề cột (đã bỏ dấu, viết liền) -> trường dữ liệu. Hỗ trợ cả tiêu đề của file mẫu cũ.
const CUSTOMER_IMPORT_FIELD_MAP: Record<string, string> = {
  makhachhang: 'code',
  makh: 'code',
  tenkhachhang: 'name',
  tenkh: 'name',
  masothue: 'taxCode',
  mst: 'taxCode',
  sodienthoai: 'phone',
  sdt: 'phone',
  dienthoai: 'phone',
  diachicongty: 'address',
  diachi: 'address',
  tennguoilienhe: 'contactPerson',
  nguoilienhe: 'contactPerson',
  sodienthoainguoilienhe: 'contactPhone',
  sdtnguoilienhe: 'contactPhone',
  dienthoailienhe: 'contactPhone',
  diachigiaohang: 'deliveryAddress',
  nguoiphutrach: 'manager',
  nhanvienphutrach: 'manager',
  loaikhachhang: 'customerType',
  loaikhach: 'customerType',
  loaikh: 'customerType',
  nguongoc: 'source',
  nguongoctiepcan: 'source'
};

const normalizeImportHeader = (h: string) =>
  String(h || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const CustomersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [source, setSource] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debtPreset, setDebtPreset] = useState<'ALL' | 'HAS_DEBT' | '10M' | '20M' | '50M' | '100M' | 'CUSTOM'>('ALL');
  const [customDebtAmount, setCustomDebtAmount] = useState<number | undefined>(undefined);
  const [customDebtInputText, setCustomDebtInputText] = useState('');
  const [isCustomerTypeFilterOpen, setIsCustomerTypeFilterOpen] = useState(false);
  const [isSourceFilterOpen, setIsSourceFilterOpen] = useState(false);
  const [customerTypePos, setCustomerTypePos] = useState<{ top: number; left: number } | null>(null);
  const [sourcePos, setSourcePos] = useState<{ top: number; left: number } | null>(null);
  const customerTypeFilterRef = useRef<HTMLDivElement>(null);
  const sourceFilterRef = useRef<HTMLDivElement>(null);
  const customerTypeDropdownRef = useRef<HTMLDivElement>(null);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);

  const getEffectiveMinDebt = (preset: string, customAmount?: number): number | undefined => {
    switch (preset) {
      case 'HAS_DEBT': return 1;
      case '10M': return 10000000;
      case '20M': return 20000000;
      case '50M': return 50000000;
      case '100M': return 100000000;
      case 'CUSTOM': return (customAmount !== undefined && customAmount > 0) ? customAmount : undefined;
      default: return undefined;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        customerTypeFilterRef.current &&
        !customerTypeFilterRef.current.contains(target) &&
        (!customerTypeDropdownRef.current || !customerTypeDropdownRef.current.contains(target))
      ) {
        setIsCustomerTypeFilterOpen(false);
      }
      if (
        sourceFilterRef.current &&
        !sourceFilterRef.current.contains(target) &&
        (!sourceDropdownRef.current || !sourceDropdownRef.current.contains(target))
      ) {
        setIsSourceFilterOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsCustomerTypeFilterOpen(false);
      setIsSourceFilterOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  // Modal Xóa khách hàng
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 3-Pane selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [timeline, setTimeline] = useState<CustomerTimelineItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Thêm nhật ký chăm sóc / tương tác
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [logActionType, setLogActionType] = useState('NOTE');
  const [logTitle, setLogTitle] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [taxWarning, setTaxWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    taxCode: '',
    address: '',
    deliveryAddress: '',
    customerType: 'ENTERPRISE',
    source: 'SELF_FOUND',
    contactPerson: '',
    contactPhone: '',
    contactPosition: 'QUẢN TRỊ',
    email: '',
    notes: '',
    managerId: '',
    status: 'ACTIVE',
    creditLimit: 50000000,
    maxDebtDays: 30
  });

  // Modal Bàn giao
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverData, setHandoverData] = useState({
    toUserId: '',
    reason: ''
  });

  // Chế độ hiển thị & Tùy biến DataGrid (Mục 3 & Mục 4)
  const [viewMode, setViewMode] = useState<'split' | 'table'>('table');
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  // 1. Phân trang Bảng khách hàng (Mặc định 12 dòng/trang, tự động co giãn thêm/bớt theo zoom)
  const initialViewportHeightRef = useRef<number>(window.innerHeight);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [isAutoPageSize, setIsAutoPageSize] = useState<boolean>(true);

  const computeRowsFromZoom = () => {
    const vh = window.innerHeight;
    const baseHeight = initialViewportHeightRef.current || 850;
    const deltaRows = Math.round((vh - baseHeight) / 45);
    return Math.max(4, Math.min(50, 12 + deltaRows));
  };

  useEffect(() => {
    const handleZoomOrResize = () => {
      if (isAutoPageSize) {
        setPageSize(computeRowsFromZoom());
      }
    };
    handleZoomOrResize();
    window.addEventListener('resize', handleZoomOrResize);
    window.visualViewport?.addEventListener('resize', handleZoomOrResize);
    return () => {
      window.removeEventListener('resize', handleZoomOrResize);
      window.visualViewport?.removeEventListener('resize', handleZoomOrResize);
    };
  }, [isAutoPageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, customerType, source, statusFilter, debtPreset, customDebtAmount]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(customers.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [customers.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(customers.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentCustomers = customers.slice(startIndex, startIndex + pageSize);

  // 2. Phân trang cột danh sách trong trang chi tiết (Tự động tính theo chiều cao màn hình)
  const [detailListPage, setDetailListPage] = useState<number>(1);
  const [detailListPageSize, setDetailPageSize] = useState<number>(7);
  const [isAutoDetailListPageSize, setIsAutoDetailListPageSize] = useState<boolean>(true);

  const computeDetailRowsFromZoom = () => {
    const vh = window.innerHeight;
    // Chiều cao khả dụng cho danh sách khách hàng = vh - 100px (layout & toolbar) - 45px (header) - 42px (footer) - 2px
    const availableH = vh - 189;
    // Mỗi dòng khách hàng cao ~67px, chuẩn hóa theo ảnh 7 dòng
    return Math.max(3, Math.min(25, Math.floor((availableH + 5) / 67)));
  };

  useEffect(() => {
    const handleZoom = () => {
      if (isAutoDetailListPageSize) {
        setDetailPageSize(computeDetailRowsFromZoom());
      }
    };
    handleZoom();
    window.addEventListener('resize', handleZoom);
    window.visualViewport?.addEventListener('resize', handleZoom);
    return () => {
      window.removeEventListener('resize', handleZoom);
      window.visualViewport?.removeEventListener('resize', handleZoom);
    };
  }, [isAutoDetailListPageSize]);

  useEffect(() => {
    setDetailListPage(1);
  }, [search, customerType, source, statusFilter, debtPreset, customDebtAmount]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(customers.length / detailListPageSize));
    if (detailListPage > maxP) {
      setDetailListPage(maxP);
    }
  }, [customers.length, detailListPageSize]);

  const totalDetailListPages = Math.max(1, Math.ceil(customers.length / detailListPageSize));
  const startDetailListIdx = (detailListPage - 1) * detailListPageSize;
  const currentDetailCustomers = customers.slice(startDetailListIdx, startDetailListIdx + detailListPageSize);

  // 3. Phân trang Lịch sử giao dịch & Chăm sóc (Timeline) - Tự động theo chiều cao màn hình và form thêm nhật ký
  const [timelinePage, setTimelinePage] = useState<number>(1);
  const [timelinePageSize, setTimelinePageSize] = useState<number>(4);
  const [isAutoTimelinePageSize, setIsAutoTimelinePageSize] = useState<boolean>(true);

  const computeTimelineRowsFromZoom = (addingLog = isAddingLog) => {
    const vh = window.innerHeight;
    // Chiều cao khả dụng = vh - 100px (layout) - 40px (header) - 30px (summary) - 42px (footer) - (form thêm nhật ký ~185px nếu mở)
    const baseSubtract = addingLog ? 409 : 219;
    const availableH = vh - baseSubtract;
    // Mỗi thẻ hoạt động timeline cao ~96px (bao gồm gap), chuẩn hóa theo ảnh 4 thẻ
    return Math.max(2, Math.min(15, Math.floor((availableH + 10) / 96)));
  };

  useEffect(() => {
    const handleZoom = () => {
      if (isAutoTimelinePageSize) {
        setTimelinePageSize(computeTimelineRowsFromZoom(isAddingLog));
      }
    };
    handleZoom();
    window.addEventListener('resize', handleZoom);
    window.visualViewport?.addEventListener('resize', handleZoom);
    return () => {
      window.removeEventListener('resize', handleZoom);
      window.visualViewport?.removeEventListener('resize', handleZoom);
    };
  }, [isAutoTimelinePageSize, isAddingLog]);

  useEffect(() => {
    setTimelinePage(1);
  }, [selectedCustomerId]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(timeline.length / timelinePageSize));
    if (timelinePage > maxP) {
      setTimelinePage(maxP);
    }
  }, [timeline.length, timelinePageSize]);

  const totalTimelinePages = Math.max(1, Math.ceil(timeline.length / timelinePageSize));
  const startTimelineIdx = (timelinePage - 1) * timelinePageSize;
  const currentTimeline = timeline.slice(startTimelineIdx, startTimelineIdx + timelinePageSize);

  const ensureCustomerPageVisible = (customerId: string) => {
    const index = customers.findIndex((c) => c.id === customerId);
    if (index !== -1) {
      if (detailListPageSize > 0) {
        setDetailListPage(Math.floor(index / detailListPageSize) + 1);
      }
      if (pageSize > 0) {
        setCurrentPage(Math.floor(index / pageSize) + 1);
      }
    }
  };

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(current - 1);
      pages.push(current);
      pages.push(current + 1);
      pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    name: true,
    customerType: true,
    source: true,
    phone: true,
    taxCode: true,
    address: true,
    deliveryAddress: true,
    manager: true,
    totalDebt: true,
    creditBalance: true,
    orders: true,
    status: true,
    actions: true
  };

  const defaultColOrder = [
    'stt',
    'code',
    'name',
    'customerType',
    'source',
    'phone',
    'taxCode',
    'address',
    'deliveryAddress',
    'manager',
    'totalDebt',
    'creditBalance',
    'orders',
    'status',
    'actions' // Cột Thao tác luôn cố định ở cuối bảng
  ];

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_customers_visible_cols_v5');
      if (saved) return JSON.parse(saved);
      return defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_customers_col_order_v5');
      if (saved) return withActionsLast(JSON.parse(saved), defaultColOrder);
      return defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const defaultCustomerWidths: Record<string, number> = {
    stt: 50,
    code: 90,
    name: 300,
    customerType: 130,
    source: 130,
    phone: 120,
    taxCode: 130,
    address: 220,
    deliveryAddress: 160,
    actions: 110,
    manager: 140,
    totalDebt: 150,
    creditBalance: 150,
    orders: 100,
    status: 130
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'customers',
    defaultWidths: defaultCustomerWidths,
    minWidth: 50,
    minWidths: {
      stt: 45,
      code: 80,
      name: 180,
      customerType: 110,
      source: 120,
      phone: 100,
      taxCode: 110,
      address: 140,
      deliveryAddress: 120,
      actions: 105,
      manager: 130,
      totalDebt: 140,
      creditBalance: 140,
      orders: 90,
      status: 120
    }
  });

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'MÃ KH',
    name: 'TÊN KHÁCH HÀNG',
    customerType: 'LOẠI KH',
    source: 'NGUỒN GỐC',
    phone: 'ĐIỆN THOẠI',
    taxCode: 'MÃ SỐ THUẾ',
    address: 'ĐỊA CHỈ CÔNG TY',
    deliveryAddress: 'ĐỊA CHỈ',
    actions: 'THAO TÁC',
    manager: 'Phụ trách',
    totalDebt: 'Công nợ hiện tại',
    creditBalance: 'Số dư tiền cọc',
    orders: 'Số đơn',
    status: 'Trạng thái'
  };

  const handleReorderColumns = (newOrder: string[]) => {
    const normalized = withActionsLast(newOrder, defaultColOrder);
    setColumnOrder(normalized);
    localStorage.setItem('namkhanh_customers_col_order_v5', JSON.stringify(normalized));
  };

  const toggleColumnVisibility = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    localStorage.setItem('namkhanh_customers_visible_cols_v5', JSON.stringify(updated));
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    localStorage.removeItem('namkhanh_customers_visible_cols_v5');
    localStorage.removeItem('namkhanh_customers_col_order_v5');
    localStorage.removeItem('namkhanh_customers_visible_cols_v4');
    localStorage.removeItem('namkhanh_customers_col_order_v4');
    localStorage.removeItem('namkhanh_customers_visible_cols_v3');
    localStorage.removeItem('namkhanh_customers_col_order_v3');
  };

  const handleImportCustomers = async (rows: Record<string, any>[]) => {
    // Chuyển từng dòng Excel (key = tiêu đề cột) thành payload chuẩn cho API
    const payloadRows = rows.map((r, idx) => {
      const mapped: Record<string, any> = { rowNumber: idx + 2 };
      Object.keys(r).forEach((header) => {
        const field = CUSTOMER_IMPORT_FIELD_MAP[normalizeImportHeader(header)];
        if (!field) return;
        const raw = r[header];
        const val = raw === undefined || raw === null ? '' : String(raw).trim();
        if (val && !mapped[field]) mapped[field] = val;
      });
      return mapped;
    });

    // Gửi theo lô để tránh vượt giới hạn kích thước request
    const CHUNK_SIZE = 200;
    let successCount = 0;
    const failed: { rowNumber: number; name: string; message: string }[] = [];
    for (let i = 0; i < payloadRows.length; i += CHUNK_SIZE) {
      const chunk = payloadRows.slice(i, i + CHUNK_SIZE);
      try {
        const res = await api.post<{
          successCount: number;
          failed: { rowNumber: number; name: string; message: string }[];
        }>('/customers/import', { rows: chunk });
        successCount += res.data?.successCount || 0;
        failed.push(...(res.data?.failed || []));
      } catch (err: any) {
        chunk.forEach((row) =>
          failed.push({ rowNumber: row.rowNumber, name: row.name || '', message: err.message || 'Lỗi lưu khách hàng' })
        );
      }
    }

    await loadCustomers();
    if (successCount > 0) {
      setToastMessage(`Đã nhập thành công ${successCount} khách hàng`);
    }

    const errorPreview = failed
      .slice(0, 5)
      .map((f) => `Dòng ${f.rowNumber}${f.name ? ` (${f.name})` : ''}: ${f.message}`)
      .join(' • ');
    return {
      success: successCount > 0 && failed.length === 0,
      count: successCount,
      message:
        failed.length > 0
          ? `Đã nhập ${successCount}/${payloadRows.length} KH. ${failed.length} dòng lỗi: ${errorPreview}${failed.length > 5 ? ' …' : ''}`
          : undefined
    };
  };

  const loadCustomers = async (overrideSelectedId?: string | null) => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (customerType) query.append('customerType', customerType);
      if (source) query.append('source', source);
      if (statusFilter) query.append('status', statusFilter);
      const minDebt = getEffectiveMinDebt(debtPreset, customDebtAmount);
      if (minDebt !== undefined && minDebt > 0) {
        query.append('minDebt', String(minDebt));
      }

      const res = await api.get<Customer[]>(`/customers?${query.toString()}`);
      let data = res.data || [];
      if (minDebt !== undefined && minDebt > 0) {
        data = data.filter((c) => Number(c.totalDebt || 0) >= minDebt);
      }
      setCustomers(data);

      const activeId = overrideSelectedId !== undefined ? overrideSelectedId : selectedCustomerId;
      if (data.length > 0) {
        if (!activeId || !data.some((c) => c.id === activeId)) {
          handleSelectCustomer(data[0].id);
        }
      } else {
        setSelectedCustomerId(null);
        setSelectedCustomer(null);
        setTimeline([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get<User[]>('/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [search, customerType, source, statusFilter, debtPreset, customDebtAmount]);

  const handleSelectCustomer = async (id: string) => {
    setSelectedCustomerId(id);
    ensureCustomerPageVisible(id);
    setLoadingDetails(true);
    try {
      const [resCust, resTimeline] = await Promise.all([
        api.get<Customer>(`/customers/${id}`),
        api.get<CustomerTimelineItem[]>(`/customers/${id}/timeline`)
      ]);
      setSelectedCustomer(resCust.data);
      setTimeline(resTimeline.data || []);
      setIsAddingLog(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    if (!logNotes.trim()) {
      setToastMessage('Vui lòng nhập nội dung nhật ký');
      return;
    }

    try {
      setIsSubmittingLog(true);
      const actionTypeLabels: Record<string, string> = {
        NOTE: 'Ghi chú chăm sóc',
        CALL: 'Cuộc gọi tư vấn',
        MEETING: 'Gặp trực tiếp khách hàng',
        MESSAGE: 'Nhắn tin Zalo / SMS',
        EMAIL: 'Gửi Email trao đổi'
      };
      const title = logTitle.trim() || actionTypeLabels[logActionType] || 'Nhật ký chăm sóc';
      await api.post(`/customers/${selectedCustomerId}/logs`, {
        actionType: logActionType,
        title,
        notes: logNotes.trim()
      });

      const resTimeline = await api.get<CustomerTimelineItem[]>(`/customers/${selectedCustomerId}/timeline`);
      setTimeline(resTimeline.data || []);
      setLogNotes('');
      setLogTitle('');
      setIsAddingLog(false);
      setToastMessage('Đã thêm nhật ký chăm sóc thành công!');
    } catch (err: any) {
      setToastMessage(err.response?.data?.message || 'Không thể lưu nhật ký');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Check trùng SĐT và MST ngay khi gõ
  const handlePhoneChange = (val: string) => {
    setFormData((prev) => ({ ...prev, phone: val }));
    const trimmed = val.trim();
    if (trimmed) {
      const match = customers.find(
        (c) => c.phone === trimmed && (!editingId || c.id !== editingId)
      );
      if (match) {
        setPhoneWarning(`SĐT [${trimmed}] đã thuộc về khách hàng "${match.name}" (${match.code})`);
      } else {
        setPhoneWarning(null);
      }
    } else {
      setPhoneWarning(null);
    }
  };

  const handleTaxChange = (val: string) => {
    setFormData((prev) => ({ ...prev, taxCode: val }));
    const trimmed = val.trim();
    if (trimmed) {
      const match = customers.find(
        (c) => c.taxCode === trimmed && (!editingId || c.id !== editingId)
      );
      if (match) {
        setTaxWarning(`Mã số thuế [${trimmed}] đã thuộc về khách hàng "${match.name}" (${match.code})`);
      } else {
        setTaxWarning(null);
      }
    } else {
      setTaxWarning(null);
    }
  };

  const openAddModal = () => {
    setIsHandoverModalOpen(false);
    setEditingId(null);
    const defaultManager = users[0];
    const defaultRole = defaultManager?.roles?.[0]?.name || defaultManager?.department?.name || 'QUẢN TRỊ';
    setFormData({
      code: '',
      name: '',
      phone: '',
      taxCode: '',
      address: '',
      deliveryAddress: '',
      customerType: 'ENTERPRISE',
      source: 'SELF_FOUND',
      contactPerson: '',
      contactPhone: '',
      contactPosition: defaultRole,
      email: '',
      notes: '',
      managerId: defaultManager?.id || '',
      status: 'ACTIVE',
      creditLimit: 50000000,
      maxDebtDays: 30
    });
    setFormError(null);
    setPhoneWarning(null);
    setTaxWarning(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setIsHandoverModalOpen(false);
    setEditingId(c.id);
    const assignedManager = users.find(u => u.id === c.managerId) || users[0];
    const roleName = assignedManager?.roles?.[0]?.name || assignedManager?.department?.name || 'QUẢN TRỊ';
    setFormData({
      code: c.code,
      name: c.name,
      phone: c.phone,
      taxCode: c.taxCode || '',
      address: c.address || '',
      deliveryAddress: c.deliveryAddress || '',
      customerType: c.customerType,
      source: c.source || 'SELF_FOUND',
      contactPerson: c.contactPerson || '',
      contactPhone: c.contactPhone || c.phone || '',
      contactPosition: roleName,
      email: c.email || '',
      notes: c.notes || '',
      managerId: c.managerId || '',
      status: c.status || 'ACTIVE',
      creditLimit: Number(c.creditLimit) || 50000000,
      maxDebtDays: c.maxDebtDays || 30
    });
    setFormError(null);
    setPhoneWarning(null);
    setTaxWarning(null);
    setIsModalOpen(true);
  };

  const openHandoverModal = (c: Customer) => {
    setIsModalOpen(false);
    setSelectedCustomerId(c.id);
    setSelectedCustomer(c);
    setHandoverData({ toUserId: '', reason: '' });
    setIsHandoverModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên khách hàng');
      return;
    }
    const finalPhone = formData.phone.trim() || formData.contactPhone.trim();
    if (!finalPhone) {
      setFormError('Vui lòng nhập số điện thoại khách hàng');
      return;
    }
    if (phoneWarning || taxWarning) {
      setFormError('Vui lòng kiểm tra lại cảnh báo trùng lặp trước khi lưu');
      return;
    }

    try {
      setIsSubmitting(true);
      const submitData = {
        ...formData,
        phone: finalPhone,
        code: formData.code.trim() || `KH${String(customers.length + 1).padStart(4, '0')}`
      };
      if (editingId) {
        await api.put(`/customers/${editingId}`, submitData);
        setToastMessage('Đã cập nhật thành công');
      } else {
        await api.post('/customers', submitData);
        setToastMessage('Đã tạo khách hàng mới thành công');
      }
      setIsModalOpen(false);
      loadCustomers();
      if (selectedCustomerId) {
        handleSelectCustomer(selectedCustomerId);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Lỗi khi lưu khách hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !handoverData.toUserId || !handoverData.reason) {
      alert('Vui lòng chọn nhân viên nhận và nhập lý do bàn giao');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/customers/${selectedCustomerId}/handover`, handoverData);
      setIsHandoverModalOpen(false);
      setHandoverData({ toUserId: '', reason: '' });
      loadCustomers();
      handleSelectCustomer(selectedCustomerId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi bàn giao khách hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (customerId: string, newStatus: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    try {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, status: newStatus as any } : c))
      );
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
      await api.put(`/customers/${customerId}`, { status: newStatus });
      setToastMessage(newStatus === 'ACTIVE' ? 'Đã kích hoạt trạng thái Hoạt động!' : 'Đã chuyển sang trạng thái Tạm dừng!');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái khách hàng');
      loadCustomers();
    }
  };

  const openDeleteModal = (c: Customer) => {
    setCustomerToDelete(c);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/customers/${customerToDelete.id}`);
      const wasSelected = selectedCustomerId === customerToDelete.id;

      setToastMessage(res.message || `Đã xóa khách hàng "${customerToDelete.name}" thành công!`);
      setIsDeleteModalOpen(false);

      if (wasSelected) {
        setSelectedCustomerId(null);
        setSelectedCustomer(null);
        setTimeline([]);
      }

      await loadCustomers(wasSelected ? null : selectedCustomerId);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xóa khách hàng';
      setToastMessage(msg);
    } finally {
      setIsDeleting(false);
      setCustomerToDelete(null);
    }
  };

  const formatMoney = (val?: number) => {
    return (val || 0).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Thanh công cụ tìm kiếm & Thêm mới */}
      <div
        className="card toolbar-pill"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.55rem 1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder="Tìm theo tên, MST, SĐT, người liên hệ..."
            style={{
              height: '34px',
              paddingTop: 0,
              paddingBottom: 0,
              fontSize: '13px',
              borderRadius: '8px'
            }}
            wrapperStyle={{ flex: 1, minWidth: '220px', maxWidth: '340px' }}
          />

          {/* Lọc Trạng thái */}
          <select
            className="input"
            style={{
              height: '34px',
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: '0.65rem',
              paddingRight: '0.65rem',
              fontSize: '13px',
              borderRadius: '8px',
              width: '145px',
              borderColor: statusFilter ? '#EF4444' : undefined,
              color: statusFilter ? '#DC2626' : undefined,
              fontWeight: statusFilter ? 600 : 400
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">-- Trạng thái --</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Tạm dừng</option>
          </select>

          {/* Lọc Số nợ (có thể tùy chỉnh số nợ cần tìm) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <select
              className="input"
              style={{
                height: '34px',
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: '0.65rem',
                paddingRight: '0.65rem',
                fontSize: '13px',
                borderRadius: '8px',
                width: '155px',
                borderColor: debtPreset !== 'ALL' ? '#EF4444' : undefined,
                color: debtPreset !== 'ALL' ? '#DC2626' : undefined,
                fontWeight: debtPreset !== 'ALL' ? 600 : 400
              }}
              value={debtPreset}
              onChange={(e) => {
                const val = e.target.value as any;
                setDebtPreset(val);
                if (val !== 'CUSTOM') {
                  setCustomDebtInputText('');
                  setCustomDebtAmount(undefined);
                }
              }}
            >
              <option value="ALL">-- Số nợ --</option>
              <option value="HAS_DEBT">Có nợ (&gt; 0 đ)</option>
              <option value="10M">Nợ ≥ 10 triệu</option>
              <option value="20M">Nợ ≥ 20 triệu</option>
              <option value="50M">Nợ ≥ 50 triệu</option>
              <option value="100M">Nợ ≥ 100 triệu</option>
              <option value="CUSTOM">Tùy chỉnh số nợ...</option>
            </select>

            {debtPreset === 'CUSTOM' && (
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input"
                  style={{
                    height: '34px',
                    width: '145px',
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingLeft: '0.6rem',
                    paddingRight: '1.6rem',
                    fontSize: '13px',
                    borderRadius: '8px',
                    borderColor: '#EF4444',
                    fontWeight: 600,
                    color: '#DC2626'
                  }}
                  placeholder="Nhập số nợ..."
                  value={customDebtInputText}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (!raw) {
                      setCustomDebtInputText('');
                      setCustomDebtAmount(undefined);
                    } else {
                      const num = parseInt(raw, 10);
                      setCustomDebtInputText(num.toLocaleString('vi-VN'));
                      setCustomDebtAmount(num);
                    }
                  }}
                  title="Nhập số tiền nợ tối thiểu cần tìm (VNĐ)"
                />
                <span style={{ position: 'absolute', right: '0.5rem', fontSize: '11.5px', color: '#9CA3AF', pointerEvents: 'none' }}>
                  đ
                </span>
              </div>
            )}
          </div>

          {(statusFilter || debtPreset !== 'ALL' || customerType || source) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('');
                setDebtPreset('ALL');
                setCustomDebtInputText('');
                setCustomDebtAmount(undefined);
                setCustomerType('');
                setSource('');
              }}
              className="text-slate-400 hover:text-red-600 transition-colors p-1"
              title="Xóa tất cả bộ lọc"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Nút Tùy chỉnh cột DataGrid */}
          <ColumnCustomizerDropdown
            columnOrder={columnOrder}
            columnLabels={columnLabels}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumnVisibility}
            onReorderColumns={handleReorderColumns}
            onReset={resetColumns}
            buttonStyle={{ height: '34px', fontSize: '13px' }}
          />

          {/* Nút Nhập Excel hàng loạt */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="btn btn-secondary"
            style={{
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              borderRadius: '8px',
              padding: '0 0.75rem',
              fontSize: '13px',
              backgroundColor: '#ECFDF5',
              color: '#047857',
              borderColor: '#A7F3D0'
            }}
            title="Nhập danh sách khách hàng hàng loạt từ Excel/CSV"
          >
            <FileSpreadsheet size={13} color="#059669" />
            <span>Nhập Excel</span>
          </button>

          {hasPermission('B_CUSTOMERS', 'create') && (
            <button
              onClick={openAddModal}
              className="btn btn-primary"
              style={{
                height: '34px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '8px',
                padding: '0 0.85rem',
                fontSize: '13px'
              }}
            >
              <Plus size={15} />
              <span>Thêm khách hàng</span>
            </button>
          )}
        </div>
      </div>

      {/* GIAO DIỆN HIỂN THỊ: 3 PHẦN (SPLIT) HOẶC BẢNG DATAGRID (TABLE) */}
      {viewMode === 'split' ? (
        /* GIAO DIỆN ĐẶC THÙ CHIA 3 PHẦN KHI QUẢN TRỊ KHÁCH HÀNG (CỘT DANH SÁCH THU HẸP, CHIỀU CAO CỐ ĐỊNH ĐỒNG BỘ) */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 0.75fr) minmax(0, 1.125fr) minmax(0, 1.125fr)',
            gap: '0.625rem',
            alignItems: 'stretch',
            height: 'calc(100vh - 100px)',
            maxHeight: 'calc(100vh - 100px)'
          }}
        >
          {/* CỘT 1: DANH SÁCH & THÔNG TIN KHÁCH HÀNG */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.75rem 0.85rem', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#374151' }}>
                Khách hàng ({customers.length})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '11.5px', gap: '0.2rem', color: '#4B5563', borderRadius: '9999px' }}
                  title="Quay lại bảng dữ liệu khách hàng"
                >
                  <ArrowLeft size={12} />
                  <span>Về bảng</span>
                </button>
                <button onClick={() => loadCustomers()} title="Tải lại" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {currentDetailCustomers.map((c) => {
                const isSelected = c.id === selectedCustomerId;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c.id)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#FFEBEE' : '#FFFFFF',
                      borderLeft: isSelected ? '4px solid #EA332A' : '4px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', gap: '0.35rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '13.8px', color: isSelected ? '#B91C1C' : '#111827' }} className="truncate" title={c.name}>
                        {c.name}
                      </div>
                      <span className="badge badge-gray shrink-0" style={{ fontSize: '11.5px' }}>
                        {c.code}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', gap: '0.35rem' }}>
                      <div style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem' }} className="truncate">
                        <Phone size={12} className="shrink-0" />
                        <span className="truncate">{c.phone || '—'}</span>
                      </div>
                      <span style={{ color: (c.totalDebt || 0) > 0 ? '#DC2626' : '#10B981', fontWeight: '700' }} className="shrink-0">
                        Nợ: {formatMoney(c.totalDebt || 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phân trang Cột 1: Tự động phân trang theo chiều cao */}
            <div style={{ padding: '0.6rem 0.85rem', borderTop: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', flexShrink: 0 }}>
              <span style={{ color: '#6B7280' }}>
                Trang <strong>{detailListPage}</strong>/{totalDetailListPages} ({customers.length} KH)
              </span>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setDetailListPage((p) => Math.max(1, p - 1))}
                  disabled={detailListPage === 1}
                  className="btn btn-secondary btn-sm disabled:opacity-30"
                  style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#4B5563' }}
                  title="Trang trước"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setDetailListPage((p) => Math.min(totalDetailListPages, p + 1))}
                  disabled={detailListPage === totalDetailListPages || totalDetailListPages <= 1}
                  className="btn btn-secondary btn-sm disabled:opacity-30"
                  style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#4B5563' }}
                  title="Trang sau"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* CỘT 2: THÔNG TIN KHÁCH HÀNG & GHI CHÚ (MỘT CARD DUY NHẤT ĐỒNG BỘ CỐ ĐỊNH CHIỀU CAO) */}
          {selectedCustomer ? (
            <div className="card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header & Thông tin cơ bản */}
              <div style={{ padding: '0.85rem 1rem 0.4rem 1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className="btn btn-secondary btn-sm shrink-0"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '12px', gap: '0.25rem', color: '#374151', borderRadius: '9999px' }}
                      title="Quay lại giao diện bảng dữ liệu"
                    >
                      <ArrowLeft size={12} />
                      <span>Quay lại bảng</span>
                    </button>
                    <h2 className="truncate" style={{ fontSize: '1.15rem', fontWeight: '700', color: '#111827', margin: 0 }} title={selectedCustomer.name}>
                      {selectedCustomer.name}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    <button
                      onClick={() => openHandoverModal(selectedCustomer)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '28px', height: '28px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                      title="Bàn giao khách hàng cho nhân viên khác"
                    >
                      <UserCheck size={14} color="#EA332A" />
                    </button>
                    {hasPermission('B_CUSTOMERS', 'update') && (
                      <button
                        onClick={() => openEditModal(selectedCustomer)}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '28px', height: '28px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                        title="Chỉnh sửa thông tin khách hàng"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {hasPermission('B_CUSTOMERS', 'delete') && (
                      <button
                        onClick={() => openDeleteModal(selectedCustomer)}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '28px', height: '28px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: '#DC2626' }}
                        title="Xóa khách hàng"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', fontSize: '12px', color: '#6B7280', marginBottom: '0.5rem' }}>
                  <span>Mã: <strong>{selectedCustomer.code}</strong></span>
                  <span>•</span>
                  <span>MST: <strong>{selectedCustomer.taxCode || 'Chưa cập nhật'}</strong></span>
                  <span>•</span>
                  <span>Loại: <strong>{getCustomerTypeBadge(selectedCustomer.customerType).label}</strong></span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '12.5px', color: '#4B5563', backgroundColor: '#F9FAFB', padding: '0.55rem 0.75rem', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate"><strong>Điện thoại:</strong> {selectedCustomer.phone || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <UserCheck size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate"><strong>Liên hệ:</strong> {selectedCustomer.contactPerson || 'Chưa có'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate" title={selectedCustomer.address || 'Chưa có'}><strong>Địa chỉ:</strong> {selectedCustomer.address || 'Chưa có'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Truck size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate" title={selectedCustomer.deliveryAddress || selectedCustomer.address || 'Chưa có'}><strong>Giao hàng:</strong> {selectedCustomer.deliveryAddress || selectedCustomer.address || 'Chưa có'}</span>
                  </div>
                </div>

                {/* Quản lý Kiểm soát công nợ & Đối chiếu công nợ A4 */}
                {(() => {
                  const creditLimit = Number(selectedCustomer.creditLimit) || 50000000;
                  const totalDebt = selectedCustomer.analytics?.totalDebt || 0;
                  const totalPaid = selectedCustomer.analytics?.totalPaid || 0;
                  const totalSpent = selectedCustomer.analytics?.totalSpent || (totalDebt + totalPaid);
                  const totalIncurred = totalSpent > 0 ? totalSpent : (totalDebt + totalPaid);
                  const paymentRate = totalIncurred > 0 ? Math.min(100, Math.round((totalPaid / totalIncurred) * 100)) : 100;
                  const isOver = totalDebt > creditLimit;

                  return (
                    <div className="mt-2 p-2.5 bg-gray-50/90 rounded-xl border border-gray-200 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-gray-800 uppercase text-[11px] mb-1">
                        {isOver ? <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        <span className="truncate">Kiểm soát công nợ</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-0.5 text-gray-700">
                        <div>
                          <span className="text-gray-500 text-[10.5px] block">Tổng giá trị:</span>
                          <strong className="text-gray-900 text-xs">{formatMoney(totalIncurred)}</strong>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10.5px] block">Thực thu:</span>
                          <strong className="text-emerald-700 text-xs">{formatMoney(totalPaid)}</strong>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10.5px] block">Còn nợ:</span>
                          <strong className={totalDebt > 0 ? 'text-red-600 text-xs' : 'text-gray-900 text-xs'}>
                            {formatMoney(totalDebt)}
                          </strong>
                        </div>
                      </div>

                      {/* Thanh tỷ lệ thanh toán (tính theo tổng công nợ và thực thu) */}
                      <div className="mt-1 space-y-0.5">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-gray-500">Tỷ lệ thanh toán:</span>
                          <span className={paymentRate >= 100 ? 'font-bold text-emerald-600' : 'font-semibold text-gray-700'}>
                            {paymentRate}% {isOver && '(VƯỢT HẠN MỨC!)'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              isOver ? 'bg-red-600' : paymentRate >= 100 ? 'bg-emerald-500' : paymentRate >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, paymentRate))}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 pt-0.5">
                          <span>Thời hạn nợ tối đa: <strong>{selectedCustomer.maxDebtDays || 30} ngày</strong></span>
                          <span>Hạn mức tín dụng: <strong>{formatMoney(creditLimit)}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Ghi chú chăm sóc - Co giãn lấp đầy không gian còn lại */}
              <div style={{ padding: '0.4rem 1rem 0.25rem 1rem', flexShrink: 0 }}>
                <h3 style={{ fontSize: '12.5px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                  <FileText size={13} className="text-[#E53935]" />
                  <span>Ghi chú chăm sóc</span>
                </h3>
              </div>
              <div style={{ flex: 1, minHeight: 0, padding: '0 1rem 0.65rem 1rem' }}>
                <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.6', height: '100%', overflowY: 'auto', backgroundColor: '#FEF9C3', padding: '0.75rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #FEF08A' }}>
                  {selectedCustomer?.notes || 'Chưa có ghi chú chăm sóc đặc thù cho khách hàng này.'}
                </div>
              </div>

              {/* Footer Cột 2 */}
              <div style={{ padding: '0.6rem 0.85rem', borderTop: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6B7280', flexShrink: 0 }}>
                <span>Hồ sơ khách hàng</span>
                <span className="text-[11px] font-medium text-slate-500">
                  Ngày tạo: {selectedCustomer?.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN') : 'Mới'}
                </span>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', height: '100%' }}>
              <div>Vui lòng chọn một khách hàng bên cột trái để xem hồ sơ và lịch sử</div>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.35rem' }}
              >
                <ArrowLeft size={13} />
                <span>Quay lại bảng danh sách</span>
              </button>
            </div>
          )}

          {/* CỘT 3: LỊCH SỬ GIAO DỊCH & CHĂM SÓC (TIMELINE) */}
          {selectedCustomer ? (
            <div className="card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem 0.45rem 1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                    <Clock size={14} className="text-gray-500" />
                    <span>Lịch sử giao dịch & Chăm sóc</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingLog((prev) => !prev)}
                    className="btn btn-secondary btn-sm !py-1 !px-2 text-[11.5px] flex items-center gap-1 text-[#EA332A] bg-red-50 border border-red-200 hover:bg-red-100 cursor-pointer font-semibold shadow-xs"
                    title="Thêm nhật ký chăm sóc / cuộc gọi / gặp gỡ khách hàng"
                  >
                    <Plus size={12} />
                    <span>Thêm nhật ký</span>
                  </button>
                </div>

                {/* Form thêm nhật ký chăm sóc / tương tác của người dùng */}
                {isAddingLog && (
                  <form
                    onSubmit={handleAddLog}
                    style={{
                      marginBottom: '0.5rem',
                      padding: '0.65rem',
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#92400E', textTransform: 'uppercase' }}>
                        Thêm nhật ký chăm sóc / tương tác
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingLog(false)}
                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Lựa chọn loại tương tác */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                      {[
                        { type: 'CALL', label: '📞 Gọi điện', title: 'Cuộc gọi tư vấn' },
                        { type: 'MEETING', label: '🤝 Gặp gỡ', title: 'Gặp trực tiếp khách hàng' },
                        { type: 'MESSAGE', label: '💬 Zalo/SMS', title: 'Nhắn tin Zalo / SMS' },
                        { type: 'EMAIL', label: '✉️ Email', title: 'Gửi Email trao đổi' },
                        { type: 'NOTE', label: '📝 Ghi chú', title: 'Ghi chú chăm sóc' }
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            setLogActionType(item.type);
                            setLogTitle(item.title);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer font-medium transition-colors ${
                            logActionType === item.type
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-gray-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ marginBottom: '0.4rem' }}>
                      <input
                        type="text"
                        value={logTitle}
                        onChange={(e) => setLogTitle(e.target.value)}
                        placeholder="Tiêu đề nhật ký (ví dụ: Gọi điện tư vấn, Hẹn gửi báo giá...)"
                        className="input text-xs w-full !py-1 !px-2 bg-white"
                      />
                    </div>

                    <div style={{ marginBottom: '0.4rem' }}>
                      <textarea
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        placeholder="Nội dung tương tác với khách hàng, phản hồi, thỏa thuận giá, lịch hẹn..."
                        rows={2}
                        className="input text-xs w-full !py-1 !px-2 bg-white resize-none"
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddingLog(false)}
                        className="btn btn-secondary btn-sm !py-0.5 !px-2 text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingLog || !logNotes.trim()}
                        className="btn btn-primary btn-sm !py-0.5 !px-3 text-xs bg-[#EA332A] hover:bg-[#d62820] text-white font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmittingLog ? 'Đang lưu...' : 'Lưu nhật ký'}
                      </button>
                    </div>
                  </form>
                )}

                <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', gap: '1.25rem', paddingTop: '0.2rem', paddingBottom: '0.35rem', borderBottom: '1px solid #F3F4F6' }}>
                  <div>Tổng số đơn: <strong>{selectedCustomer.analytics?.orderCount || 0}</strong></div>
                  <div>
                    Đơn hàng gần nhất:{' '}
                    <strong>
                      {selectedCustomer.analytics?.lastOrderDate
                        ? new Date(selectedCustomer.analytics.lastOrderDate).toLocaleDateString('vi-VN')
                        : 'Chưa có'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Timeline items list */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '0.35rem 0.85rem' }}>
                {loadingDetails ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Đang tải lịch sử...</div>
                ) : timeline.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Chưa có hoạt động nào phát sinh với khách hàng này</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {currentTimeline.map((item, idx) => {
                      let iconBg = '#E0E7FF';
                      let iconColor = '#4F46E5';
                      let IconComp: any = Clock;
                      let typeBadge = 'Hành động';
                      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';

                      if (item.type === 'ORDER') {
                        iconBg = '#DCFCE7';
                        iconColor = '#16A34A';
                        IconComp = ShoppingBag;
                        typeBadge = 'Đơn bán hàng';
                        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      } else if (item.type === 'QUOTATION') {
                        iconBg = '#FEF3C7';
                        iconColor = '#D97706';
                        IconComp = FileSpreadsheet;
                        typeBadge = 'Báo giá';
                        badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      } else if (item.type === 'RECEIPT') {
                        iconBg = '#E0F2FE';
                        iconColor = '#0284C7';
                        IconComp = CreditCard;
                        typeBadge = 'Phiếu thu';
                        badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
                      } else if (item.type === 'HANDOVER') {
                        iconBg = '#F3E8FF';
                        iconColor = '#9333EA';
                        IconComp = ArrowLeftRight;
                        typeBadge = 'Bàn giao';
                        badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                      } else if (item.type === 'CARE_LOG') {
                        iconBg = '#FFEDD5';
                        iconColor = '#EA580C';
                        IconComp = item.actionType === 'CALL' ? Phone : item.actionType === 'MEETING' ? Users : item.actionType === 'EMAIL' ? Mail : FileText;
                        typeBadge = 'Nhật ký chăm sóc';
                        badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
                      } else if (item.type === 'CREATION') {
                        iconBg = '#DBEAFE';
                        iconColor = '#2563EB';
                        IconComp = UserCheck;
                        typeBadge = 'Khởi tạo hồ sơ';
                        badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      } else if (item.type === 'UPDATE') {
                        iconBg = '#F1F5F9';
                        iconColor = '#475569';
                        IconComp = Edit2;
                        typeBadge = 'Cập nhật';
                        badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                      }

                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.65rem',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#FAFAFA',
                            borderRadius: '0.5rem',
                            border: '1px solid #F3F4F6'
                          }}
                        >
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '8px',
                              backgroundColor: iconBg,
                              color: iconColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <IconComp size={15} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.15rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }} className="truncate">
                                  {item.title}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${badgeColor}`}>
                                  {typeBadge}
                                </span>
                                {item.status && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                    {item.type === 'QUOTATION' ? getQuotationStatusLabel(item.status) : getOrderStatusLabel(item.status)}
                                  </span>
                                )}
                                {item.paymentStatus && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                    {getPaymentStatusLabel(item.paymentStatus)}
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap' }} className="shrink-0">
                                {new Date(item.date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>

                            {item.type === 'RECEIPT' && (
                              <div style={{ fontSize: '12px', color: '#374151', marginBottom: '0.15rem' }}>
                                Đã thu: <strong style={{ color: '#0284C7' }}>{formatMoney(item.amount || 0)}</strong>
                                {item.paymentMethod && (
                                  <span style={{ marginLeft: '0.4rem', color: '#4B5563' }}>
                                    ({getPaymentMethodLabel(item.paymentMethod)})
                                  </span>
                                )}
                              </div>
                            )}

                            {(item.type === 'ORDER' || item.type === 'QUOTATION') && item.amount !== undefined && (
                              <div style={{ fontSize: '12px', color: '#374151', marginBottom: '0.15rem' }}>
                                Giá trị: <strong>{formatMoney(item.amount)}</strong>
                                {item.paid !== undefined && (
                                  <span style={{ marginLeft: '0.4rem', color: '#16A34A' }}>
                                    (Đã thu: {formatMoney(item.paid)})
                                  </span>
                                )}
                                {item.remaining !== undefined && item.remaining > 0 && (
                                  <span style={{ marginLeft: '0.4rem', color: '#DC2626', fontWeight: '600' }}>
                                    [Còn nợ: {formatMoney(item.remaining)}]
                                  </span>
                                )}
                              </div>
                            )}

                            {item.reason && (
                              <div style={{ fontSize: '12px', color: '#4B5563', fontStyle: 'italic', marginBottom: '0.15rem' }} className="truncate" title={item.reason}>
                                Lý do: {item.reason} {item.from && item.to ? `(${item.from} → ${item.to})` : ''}
                              </div>
                            )}

                            {item.notes && (
                              <div style={{ fontSize: '12px', color: '#4B5563', backgroundColor: item.type === 'CARE_LOG' ? '#FFFBEB' : 'transparent', padding: item.type === 'CARE_LOG' ? '0.25rem 0.45rem' : '0', borderRadius: '4px', border: item.type === 'CARE_LOG' ? '1px dashed #FDE68A' : 'none', marginTop: '0.15rem' }} className="line-clamp-2" title={item.notes}>
                                {item.notes}
                              </div>
                            )}

                            {item.actor && (
                              <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '0.15rem' }}>
                                Thực hiện bởi: <strong className="text-gray-600">{item.actor}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Phân trang Timeline: Tự động phân trang khi vượt quá chiều cao */}
              <div style={{ padding: '0.6rem 0.85rem', borderTop: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', flexShrink: 0 }}>
                <span style={{ color: '#6B7280' }}>
                  {timeline.length > 0 ? (
                    <>
                      Trang <strong>{timelinePage}</strong>/{totalTimelinePages} ({timeline.length} hoạt động)
                    </>
                  ) : (
                    '0 hoạt động'
                  )}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => setTimelinePage((p) => Math.max(1, p - 1))}
                    disabled={timelinePage === 1}
                    className="btn btn-secondary btn-sm disabled:opacity-30"
                    style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#4B5563' }}
                    title="Trang trước"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelinePage((p) => Math.min(totalTimelinePages, p + 1))}
                    disabled={timelinePage === totalTimelinePages || totalTimelinePages <= 1}
                    className="btn btn-secondary btn-sm disabled:opacity-30"
                    style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#4B5563' }}
                    title="Trang sau"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Chưa chọn khách hàng
            </div>
          )}
        </div>
      ) : (
        /* GIAO DIỆN BẢNG DATAGRID ĐẦY ĐỦ VỚI KÉO THẢ CỘT (DRAG & DROP) */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="#E53935" />
              <span style={{ fontWeight: '700', fontSize: '14.85px', color: '#111827' }}>
                Bảng dữ liệu Khách hàng ({customers.length})
              </span>
              <span style={{ fontSize: '12.1px', color: '#6B7280', marginLeft: '0.5rem' }}>
                (Kéo thả tiêu đề cột để thay đổi thứ tự hiển thị)
              </span>
            </div>
            <button onClick={() => loadCustomers()} title="Tải lại dữ liệu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', minHeight: '340px' }}>
            <table
              style={{
                width: `${getTableWidth(columnOrder.filter((k) => visibleColumns[k] !== false))}px`,
                minWidth: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                textAlign: 'left'
              }}
            >
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  {columnOrder
                    .filter((colKey) => visibleColumns[colKey] !== false)
                    .map((colKey) => {
                      const isLeft = ['name', 'address', 'deliveryAddress', 'manager'].includes(colKey);
                      const isRight = ['totalDebt', 'creditBalance'].includes(colKey);
                      const alignClass = isLeft ? 'justify-start text-left' : isRight ? 'justify-end text-right' : 'justify-center text-center';
                      return (
                        <th
                          key={colKey}
                          className={`py-3 px-3 text-xs font-bold text-slate-600 uppercase tracking-wider select-none ${colKey === 'actions' ? 'sticky-action-th' : ''}`}
                          style={{
                            width: `${columnWidths[colKey] || defaultCustomerWidths[colKey] || 120}px`,
                            position: colKey === 'actions' ? 'sticky' : 'relative',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <div className={`flex items-center ${alignClass} gap-1.5 w-full`}>
                            <span className="whitespace-nowrap select-none font-bold text-[12px] text-slate-600">
                              {columnLabels[colKey] || colKey}
                            </span>

                            {colKey === 'customerType' && (
                              <div className="relative inline-flex items-center" ref={customerTypeFilterRef}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setCustomerTypePos({
                                      top: rect.bottom + 4,
                                      left: Math.max(8, Math.min(window.innerWidth - 180, rect.left - 40))
                                    });
                                    setIsCustomerTypeFilterOpen(!isCustomerTypeFilterOpen);
                                    setIsSourceFilterOpen(false);
                                  }}
                                  className={`p-1 rounded transition-all cursor-pointer ${customerType
                                    ? 'bg-red-100 text-red-700 border border-red-300 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
                                    }`}
                                  title={customerType ? `Đang lọc: ${CUSTOMER_TYPE_FILTER_OPTIONS.find(o => o.value === customerType)?.label}` : 'Lọc Loại khách hàng'}
                                >
                                  <Filter size={11} className={customerType ? 'fill-red-600' : ''} />
                                </button>
                                {isCustomerTypeFilterOpen && customerTypePos && createPortal(
                                  <div
                                    ref={customerTypeDropdownRef}
                                    style={{
                                      position: 'fixed',
                                      top: customerTypePos.top,
                                      left: customerTypePos.left,
                                      zIndex: 99999,
                                      filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.12))'
                                    }}
                                    className="bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 min-w-[170px] normal-case font-normal text-left"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                                      Loại khách hàng
                                    </div>
                                    {CUSTOMER_TYPE_FILTER_OPTIONS.map((opt) => (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          setCustomerType(opt.value);
                                          setIsCustomerTypeFilterOpen(false);
                                        }}
                                        className={`w-full px-3 py-1.5 text-[12.5px] flex items-center justify-between transition-colors text-left cursor-pointer ${customerType === opt.value
                                          ? 'bg-red-50 text-red-600 font-semibold'
                                          : 'text-slate-700 hover:bg-slate-50'
                                          }`}
                                      >
                                        <span>{opt.label}</span>
                                        {customerType === opt.value && <Check size={13} className="text-red-600 ml-2 flex-shrink-0" />}
                                      </button>
                                    ))}
                                  </div>,
                                  document.body
                                )}
                              </div>
                            )}

                            {colKey === 'source' && (
                              <div className="relative inline-flex items-center" ref={sourceFilterRef}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setSourcePos({
                                      top: rect.bottom + 4,
                                      left: Math.max(8, Math.min(window.innerWidth - 180, rect.left - 40))
                                    });
                                    setIsSourceFilterOpen(!isSourceFilterOpen);
                                    setIsCustomerTypeFilterOpen(false);
                                  }}
                                  className={`p-1 rounded transition-all cursor-pointer ${source
                                    ? 'bg-red-100 text-red-700 border border-red-300 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
                                    }`}
                                  title={source ? `Đang lọc: ${SOURCE_FILTER_OPTIONS.find(o => o.value === source)?.label}` : 'Lọc Nguồn gốc'}
                                >
                                  <Filter size={11} className={source ? 'fill-red-600' : ''} />
                                </button>
                                {isSourceFilterOpen && sourcePos && createPortal(
                                  <div
                                    ref={sourceDropdownRef}
                                    style={{
                                      position: 'fixed',
                                      top: sourcePos.top,
                                      left: sourcePos.left,
                                      zIndex: 99999,
                                      filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.12))'
                                    }}
                                    className="bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 min-w-[170px] normal-case font-normal text-left"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                                      Nguồn gốc
                                    </div>
                                    {SOURCE_FILTER_OPTIONS.map((opt) => (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          setSource(opt.value);
                                          setIsSourceFilterOpen(false);
                                        }}
                                        className={`w-full px-3 py-1.5 text-[12.5px] flex items-center justify-between transition-colors text-left cursor-pointer ${source === opt.value
                                          ? 'bg-red-50 text-red-600 font-semibold'
                                          : 'text-slate-700 hover:bg-slate-50'
                                          }`}
                                      >
                                        <span>{opt.label}</span>
                                        {source === opt.value && <Check size={13} className="text-red-600 ml-2 flex-shrink-0" />}
                                      </button>
                                    ))}
                                  </div>,
                                  document.body
                                )}
                              </div>
                            )}
                          </div>
                          {colKey !== 'actions' && (
                            <div
                              className="col-resizer"
                              onMouseDown={(e) => startResize(colKey, e)}
                              onClick={(e) => e.stopPropagation()}
                              title="Kéo để chỉnh độ rộng"
                            />
                          )}
                        </th>
                      );
                    })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={columnOrder.length} className="py-12 text-center text-slate-400 text-[13px]">
                      Đang tải danh sách khách hàng...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={columnOrder.length} className="py-12 text-center text-slate-400 text-[13px]">
                      Không tìm thấy khách hàng nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  currentCustomers.map((c, idx) => {
                    const actualIndex = startIndex + idx + 1;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => {
                          handleSelectCustomer(c.id);
                          setViewMode('split');
                        }}
                        className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 cursor-pointer"
                        title={`Nhấn để xem chi tiết khách hàng ${c.name}`}
                      >
                        {columnOrder
                          .filter((colKey) => visibleColumns[colKey] !== false)
                          .map((colKey) => {
                            switch (colKey) {
                              case 'stt':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 text-center text-slate-600 text-[13px] whitespace-nowrap overflow-hidden"
                                  >
                                    {actualIndex}
                                  </td>
                                );
                              case 'code': {
                                const typeStyle = getCustomerTypeBadge(c.customerType);
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 text-center whitespace-nowrap overflow-hidden"
                                  >
                                    <span className={`inline-block px-2 py-0.5 rounded text-[12px] font-bold ${typeStyle.codeBadgeClass}`}>
                                      {c.code}
                                    </span>
                                  </td>
                                );
                              }
                              case 'name':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 overflow-hidden"
                                  >
                                    <div
                                      className="font-semibold text-slate-900 truncate text-[13px]"
                                      title={c.name}
                                    >
                                      {c.name}
                                    </div>
                                  </td>
                                );
                              case 'customerType': {
                                const typeStyle = getCustomerTypeBadge(c.customerType);
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 text-center whitespace-nowrap overflow-hidden"
                                  >
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeStyle.badgeClass}`}>
                                      {typeStyle.label}
                                    </span>
                                  </td>
                                );
                              }
                              case 'phone':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 text-center whitespace-nowrap overflow-hidden text-[13px] text-slate-800 font-medium"
                                  >
                                    {c.phone || '—'}
                                  </td>
                                );
                              case 'taxCode':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 text-center whitespace-nowrap overflow-hidden text-[13px] text-slate-600"
                                  >
                                    {c.taxCode || '—'}
                                  </td>
                                );
                              case 'address':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 overflow-hidden text-[13px] text-slate-700 truncate"
                                    title={c.address || ''}
                                  >
                                    {c.address || '—'}
                                  </td>
                                );
                              case 'deliveryAddress':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 overflow-hidden text-[13px] text-slate-700 truncate"
                                    title={c.deliveryAddress || ''}
                                  >
                                    {c.deliveryAddress || '—'}
                                  </td>
                                );
                              case 'actions':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 whitespace-nowrap sticky-action-td"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-center gap-1 w-full">
                                      {hasPermission('B_CUSTOMERS', 'update') && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(c);
                                          }}
                                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                          title="Chỉnh sửa thông tin khách hàng"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openHandoverModal(c);
                                        }}
                                        className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                        title="Bàn giao khách hàng"
                                      >
                                        <ArrowLeftRight className="w-4 h-4" />
                                      </button>
                                      {hasPermission('B_CUSTOMERS', 'delete') && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModal(c);
                                          }}
                                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                          title="Xóa khách hàng"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                );
                              case 'manager':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 text-[13px] text-slate-700 whitespace-nowrap overflow-hidden"
                                  >
                                    <span
                                      className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 max-w-full truncate text-[12px]"
                                      title={c.manager?.fullName || 'Chưa gán'}
                                    >
                                      {c.manager?.fullName || 'Chưa gán'}
                                    </span>
                                  </td>
                                );
                              case 'totalDebt': {
                                const debt = Number(c.totalDebt || 0);
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 text-[13px] whitespace-nowrap overflow-hidden text-right"
                                  >
                                    <div className="inline-flex items-center gap-1.5 justify-end w-full">
                                      <span className={`font-bold ${debt > 0 ? (c.isHighDebt ? 'text-red-600' : 'text-amber-700') : 'text-emerald-600'}`}>
                                        {formatMoney(debt)}
                                      </span>
                                      {c.isHighDebt && (
                                        <span className="badge badge-red text-xs px-1.5 py-0.5 font-semibold" title="Khách nợ lớn trên 50 triệu!">
                                          &gt; 50tr ⚠️
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              }
                              case 'creditBalance':
                                return (
                                  <td
                                    key={colKey}
                                    className={`py-2.5 px-3 text-[13px] text-center whitespace-nowrap overflow-hidden font-semibold ${Number(c.creditBalance) > 0 ? 'text-emerald-700' : 'text-slate-500'}`}
                                  >
                                    {formatMoney(Number(c.creditBalance) || 0)}
                                  </td>
                                );
                              case 'source':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 text-[13px] text-slate-600 whitespace-nowrap overflow-hidden"
                                  >
                                    {c.source === 'SELF_FOUND'
                                      ? 'Tự tìm kiếm'
                                      : c.source === 'REFERRAL'
                                        ? 'Giới thiệu'
                                        : c.source === 'SOCIAL'
                                          ? 'Mạng xã hội'
                                          : c.source === 'EXHIBITION'
                                            ? 'Triển lãm'
                                            : 'Khác'}
                                  </td>
                                );
                              case 'orders':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 text-[13px] text-center font-semibold text-[#EA332A] whitespace-nowrap overflow-hidden"
                                  >
                                    {c._count?.orders || 0} đơn
                                  </td>
                                );
                              case 'status':
                                return (
                                  <td
                                    key={colKey}
                                    className="py-2.5 px-3 text-center whitespace-nowrap overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-center">
                                      <StatusBadgeDropdown
                                        value={c.status}
                                        options={CUSTOMER_STATUS_OPTIONS}
                                        onChange={(newStatus) => handleQuickStatusChange(c.id, newStatus)}
                                        className="!text-[12px]"
                                      />
                                    </div>
                                  </td>
                                );
                              default:
                                return null;
                            }
                          })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Thanh phân trang DataGrid chuyên nghiệp */}
          <div className="px-4 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              {customers.length > 0 ? (
                <span>
                  Hiển thị <span className="font-semibold text-slate-800">{startIndex + 1}</span> -{' '}
                  <span className="font-semibold text-slate-800">{Math.min(startIndex + pageSize, customers.length)}</span> trên{' '}
                  <span className="font-semibold text-slate-800">{customers.length}</span> khách hàng
                </span>
              ) : (
                <span>0 khách hàng</span>
              )}
            </div>

            {/* Phân trang số trang & nút lật */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers(currentPage, totalPages).map((pNum, pIdx) =>
                    pNum === '...' ? (
                      <span key={`ellipsis-${pIdx}`} className="px-1.5 text-slate-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${pNum}`}
                        type="button"
                        onClick={() => setCurrentPage(Number(pNum))}
                        className={`min-w-[28px] h-7 px-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          currentPage === pNum
                            ? 'bg-[#EA332A] text-white shadow-xs'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pNum}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL THÊM MỚI / CHỈNH SỬA KHÁCH HÀNG - 3 CỘT THEO ẢNH MẪU, RENDER LÊN BODY ĐỂ PHỦ KÍN MÀN HÌNH */}
      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="customer-modal-container">
            {/* HEADER */}
            <div className="flex items-center justify-between shrink-0" style={{ padding: '24px 30px 18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                {editingId ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="customer-modal-body" style={{ padding: '0 30px' }}>
                {formError && (
                  <div className="mb-3 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-red-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '20px' }}>
                  {/* CỘT 1: THÔNG TIN CHUNG */}
                  <div className="customer-modal-card">
                    <div className="customer-modal-card-title">
                      <Users size={18} color="#EA332A" />
                      <span>Thông tin chung</span>
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label"><span className="req">*</span>Loại khách hàng</label>
                      <select
                        className="customer-modal-input"
                        value={formData.customerType}
                        onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                      >
                        <option value="ENTERPRISE">Doanh nghiệp</option>
                        <option value="SCHOOL">Trường học</option>
                        <option value="ORGANIZATION">Cơ quan / Tổ chức</option>
                        <option value="HOUSEHOLD">Đại lý / Cửa hàng</option>
                        <option value="INDIVIDUAL">Cá nhân</option>
                      </select>
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label"><span className="req">*</span>Trạng thái</label>
                      <select
                        className="customer-modal-input"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="ACTIVE">Hoạt động</option>
                        <option value="INACTIVE">Tạm dừng</option>
                      </select>
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label">Mã KH</label>
                      <input
                        type="text"
                        className="customer-modal-input"
                        placeholder="Tự động tạo nếu để trống"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label"><span className="req">*</span>Tên khách hàng</label>
                      <input
                        type="text"
                        className="customer-modal-input"
                        placeholder="Nhập tên khách hàng"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label">Mã số thuế</label>
                      <input
                        type="text"
                        className="customer-modal-input"
                        placeholder="Nhập mã số thuế"
                        value={formData.taxCode}
                        onChange={(e) => handleTaxChange(e.target.value)}
                      />
                      {taxWarning && (
                        <div className="text-[11px] text-red-600 mt-1 font-medium flex items-start gap-1">
                          <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                          <span>{taxWarning}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CỘT 2: LIÊN HỆ & ĐỊA CHỈ */}
                  <div className="customer-modal-card">
                    <div className="customer-modal-card-title">
                      <MapPin size={18} color="#22BB4E" />
                      <span>Liên hệ &amp; Địa chỉ</span>
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label"><span className="req">*</span>Số điện thoại</label>
                      <input
                        type="text"
                        className="customer-modal-input"
                        placeholder="Nhập số điện thoại"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        required
                      />
                      {phoneWarning && (
                        <div className="text-[11px] text-red-600 mt-1 font-medium flex items-start gap-1">
                          <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                          <span>{phoneWarning}</span>
                        </div>
                      )}
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label">Email</label>
                      <input
                        type="email"
                        className="customer-modal-input"
                        placeholder="VD: khachhang@congty.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label">Địa chỉ công ty</label>
                      <input
                        type="text"
                        className="customer-modal-input"
                        placeholder="Số nhà, tên đường, quận/huyện..."
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label">Địa chỉ giao hàng</label>
                      <input
                        type="text"
                        className="customer-modal-input"
                        placeholder="Để trống nếu trùng địa chỉ công ty"
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      />
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label">Ghi chú</label>
                      <textarea
                        className="customer-modal-input"
                        rows={2}
                        placeholder="Ghi chú thông tin phụ..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* CỘT 3: LIÊN HỆ & PHÂN CÔNG */}
                  <div className="customer-modal-card">
                    <div className="customer-modal-card-title">
                      <UserCheck size={18} color="#F59E0B" />
                      <span>Liên hệ &amp; Phân công</span>
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label"><span className="req">*</span>Tên người liên hệ</label>
                      <input
                        type="text"
                        className="customer-modal-input"
                        placeholder="Nhập tên người đại diện liên hệ"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      />
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label"><span className="req">*</span>Điện thoại liên hệ</label>
                      <input
                        type="text"
                        className="customer-modal-input"
                        placeholder="Số điện thoại người liên hệ"
                        value={formData.contactPhone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({ ...prev, contactPhone: val }));
                        }}
                      />
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label">Nhân viên phụ trách</label>
                      <select
                        className="customer-modal-input"
                        value={formData.managerId}
                        onChange={(e) => {
                          const mId = e.target.value;
                          const mUser = users.find((u) => u.id === mId);
                          setFormData({
                            ...formData,
                            managerId: mId,
                            contactPosition: mUser?.roles?.[0]?.name || mUser?.department?.name || 'QUẢN TRỊ'
                          });
                        }}
                      >
                        <option value="">-- Chọn nhân viên --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label">Chức vụ / Vị trí</label>
                      <input
                        type="text"
                        className="customer-modal-input"
                        placeholder="Quản trị"
                        value={(formData.contactPosition || '').toUpperCase()}
                        readOnly
                      />
                    </div>

                    <div className="customer-modal-field">
                      <label className="customer-modal-label">Nguồn gốc tiếp cận</label>
                      <select
                        className="customer-modal-input"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      >
                        <option value="SELF_FOUND">Tự tìm kiếm</option>
                        <option value="REFERRAL">Được giới thiệu</option>
                        <option value="SOCIAL">Mạng xã hội / Trang web</option>
                        <option value="EXHIBITION">Hội thảo / Triển lãm</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-between shrink-0" style={{ padding: '22px 30px 26px' }}>
                <div>
                  {editingId && hasPermission('B_CUSTOMERS', 'delete') && (
                    <button
                      type="button"
                      onClick={() => {
                        const cust = customers.find((c) => c.id === editingId) || selectedCustomer;
                        if (cust) {
                          setIsModalOpen(false);
                          openDeleteModal(cust);
                        }
                      }}
                      className="flex items-center gap-1.5 cursor-pointer text-red-600 hover:bg-red-50 border border-red-200 rounded-md"
                      style={{ height: '40px', padding: '0 16px', fontSize: '13px', fontWeight: 600, background: '#fff' }}
                      title="Xóa khách hàng này"
                    >
                      <Trash2 size={15} />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center" style={{ gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    style={{ height: '40px', padding: '0 20px', fontSize: '13px', fontWeight: 500, color: '#374151', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors hover:brightness-95"
                    style={{ height: '40px', padding: '0 20px', fontSize: '13px', fontWeight: 600, color: '#fff', background: '#EA332A', border: 'none', borderRadius: '6px', boxShadow: '0 4px 10px -2px rgba(234, 51, 42, 0.35)' }}
                  >
                    {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                    <span>
                      {isSubmitting
                        ? (editingId ? 'Đang cập nhật...' : 'Đang tạo...')
                        : (editingId ? 'Lưu cập nhật' : 'Tạo khách hàng mới')}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL BÀN GIAO KHÁCH HÀNG */}
      {isHandoverModalOpen && selectedCustomer && createPortal(
        <div className="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="modal-content bg-white rounded-xl shadow-2xl w-full relative z-[10000] max-h-[90vh] overflow-y-auto" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2375rem', fontWeight: '700', color: '#111827' }}>
                Bàn giao quyền quản lý khách hàng
              </h3>
              <button onClick={() => setIsHandoverModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleHandoverSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '14.3px', color: '#374151', backgroundColor: '#F3F4F6', padding: '0.75rem', borderRadius: '0.375rem' }}>
                  Khách hàng bàn giao: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.code})
                  <div style={{ marginTop: '0.25rem', fontSize: '13.2px', color: '#6B7280' }}>
                    Người phụ trách hiện tại: <strong>{selectedCustomer.manager?.fullName || 'Chưa gán'}</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13.75px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Nhân sự nhận bàn giao *
                  </label>
                  <select
                    className="input"
                    value={handoverData.toUserId}
                    onChange={(e) => setHandoverData({ ...handoverData, toUserId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn nhân sự nhận --</option>
                    {users
                      .filter((u) => u.id !== selectedCustomer.managerId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.code}) - {u.email}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13.75px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Lý do bàn giao (Bắt buộc lưu nhật ký hệ thống) *
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="VD: Nhân viên nghỉ thai sản, chuyển vùng thị trường kinh doanh..."
                    value={handoverData.reason}
                    onChange={(e) => setHandoverData({ ...handoverData, reason: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsHandoverModalOpen(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Đang bàn giao...</span>
                    </>
                  ) : (
                    <span>Xác nhận bàn giao</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* MODAL IMPORT EXCEL KHÁCH HÀNG */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách Khách hàng từ Excel/CSV"
        sampleFileName="Mau_Nhap_Khach_Hang_NamKhanh.csv"
        sampleHeaders={CUSTOMER_IMPORT_HEADERS}
        sampleRows={[
          [1, '', 'Công ty Cổ phần Tập đoàn FPT', '0101248141', '02473007300', 'Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội', 'Anh Hoàng', '0912345678', 'Số 17 Duy Tân, Cầu Giấy, Hà Nội', users[0]?.fullName || '', 'Doanh nghiệp', 'Tự tìm kiếm'],
          [2, '', 'Trường THCS Lê Quý Đôn', '0102345678', '02438345678', 'Số 66 Nguyễn Văn Huyên, Cầu Giấy, Hà Nội', 'Cô Lan', '0987654321', '', users[0]?.fullName || '', 'Trường học', 'Được giới thiệu']
        ]}
        requiredFields={['Tên khách hàng', 'Số điện thoại']}
        fieldMappingHelp="Tên khách hàng, Số điện thoại (bắt buộc). Mã khách hàng để trống sẽ tự sinh (KH00001, KH00002, ...). Địa chỉ giao hàng trống sẽ lấy theo địa chỉ công ty. Người phụ trách: Họ tên / Mã NV / Email (trống = người nhập). Loại khách hàng: Doanh nghiệp / Trường học / Cơ quan - Tổ chức / Hộ kinh doanh / Cá nhân. Nguồn gốc: Tự tìm kiếm / Được giới thiệu / Mạng xã hội - Trang web / Hội thảo - Triển lãm / Khác."
        onImport={handleImportCustomers}
      />
      {/* MODAL IN ĐỐI CHIẾU CÔNG NỢ A4 */}
      <DebtConfirmationModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        customer={selectedCustomer}
      />

      {/* MODAL XÁC NHẬN XÓA KHÁCH HÀNG */}
      {isDeleteModalOpen && customerToDelete && createPortal(
        <div className="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 relative z-[10000] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">
                Xác nhận xóa khách hàng?
              </h3>
              <p className="text-sm font-semibold text-gray-800 mb-1">
                {customerToDelete.name}
              </p>
              <div className="flex justify-center items-center gap-2 text-xs text-gray-500 mb-3 font-mono">
                <span>Mã: <strong>{customerToDelete.code}</strong></span>
                <span>•</span>
                <span>SĐT: <strong>{customerToDelete.phone}</strong></span>
              </div>

              {(customerToDelete._count?.orders || 0) > 0 || (customerToDelete._count?.quotations || 0) > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left text-xs text-amber-800 leading-relaxed mb-1">
                  <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Lưu ý bảo lưu dữ liệu kế toán:</span>
                  </div>
                  Khách hàng này hiện đã có{' '}
                  <strong>{customerToDelete._count?.orders || 0} đơn hàng</strong> và{' '}
                  <strong>{customerToDelete._count?.quotations || 0} báo giá</strong>. Hệ thống sẽ tự động chuyển trạng thái sang{' '}
                  <span className="font-bold text-red-700">Tạm dừng</span> để bảo toàn lịch sử chứng từ và hóa đơn hợp lệ.
                </div>
              ) : (
                <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  Khách hàng chưa có phát sinh đơn hàng hay báo giá. Dữ liệu sẽ được xóa hoàn toàn khỏi hệ thống.
                </p>
              )}
            </div>

            <div className="bg-gray-50 px-5 py-3.5 flex justify-end gap-2.5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCustomerToDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <Toast
        show={!!toastMessage}
        message={toastMessage || ''}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
};
