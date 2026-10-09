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
  Hash
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
  const customerTypeFilterRef = useRef<HTMLDivElement>(null);
  const sourceFilterRef = useRef<HTMLDivElement>(null);

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
      if (customerTypeFilterRef.current && !customerTypeFilterRef.current.contains(e.target as Node)) {
        setIsCustomerTypeFilterOpen(false);
      }
      if (sourceFilterRef.current && !sourceFilterRef.current.contains(e.target as Node)) {
        setIsSourceFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    actions: true,
    manager: false,
    totalDebt: false,
    creditBalance: false,
    orders: false,
    status: false
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
    'actions',
    'manager',
    'totalDebt',
    'creditBalance',
    'orders',
    'status'
  ];

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_customers_visible_cols_v4');
      if (saved) return JSON.parse(saved);
      const savedV3 = localStorage.getItem('namkhanh_customers_visible_cols_v3');
      if (savedV3) {
        const parsed = JSON.parse(savedV3);
        return { ...parsed, source: true };
      }
      return defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_customers_col_order_v4');
      if (saved) return JSON.parse(saved);
      const savedV3 = localStorage.getItem('namkhanh_customers_col_order_v3');
      if (savedV3) {
        const parsed: string[] = JSON.parse(savedV3);
        if (!parsed.includes('source')) {
          const insertIdx = parsed.indexOf('customerType');
          if (insertIdx !== -1) {
            parsed.splice(insertIdx + 1, 0, 'source');
          } else {
            parsed.push('source');
          }
        }
        return parsed;
      }
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
    setColumnOrder(newOrder);
    localStorage.setItem('namkhanh_customers_col_order_v4', JSON.stringify(newOrder));
  };

  const toggleColumnVisibility = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    localStorage.setItem('namkhanh_customers_visible_cols_v4', JSON.stringify(updated));
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    localStorage.removeItem('namkhanh_customers_visible_cols_v4');
    localStorage.removeItem('namkhanh_customers_col_order_v4');
    localStorage.removeItem('namkhanh_customers_visible_cols_v3');
    localStorage.removeItem('namkhanh_customers_col_order_v3');
  };

  const handleImportCustomers = async (rows: Record<string, any>[]) => {
    let successCount = 0;
    const errList: string[] = [];
    for (const r of rows) {
      try {
        const name = String(r['Tên khách hàng'] || '').trim();
        const phone = String(r['Số điện thoại'] || '').trim();
        const taxCode = r['Mã số thuế'] ? String(r['Mã số thuế']).trim() : undefined;
        const address = r['Địa chỉ'] ? String(r['Địa chỉ']).trim() : '';
        const contactPerson = r['Người liên hệ'] ? String(r['Người liên hệ']).trim() : '';
        const customerType = r['Loại khách'] || 'ENTERPRISE';

        if (!name || !phone) continue;

        await api.post('/customers', {
          name,
          phone,
          taxCode,
          address,
          contactPerson,
          customerType,
          source: 'SELF_FOUND',
          status: 'ACTIVE'
        });
        successCount++;
      } catch (err: any) {
        errList.push(err.message || 'Lỗi lưu khách hàng');
      }
    }
    await loadCustomers();
    return {
      success: successCount > 0,
      count: successCount,
      message: errList.length > 0 ? `Nhập được ${successCount} KH. Lỗi: ${errList.slice(0, 2).join(', ')}` : undefined
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
    loadCustomers();
    loadUsers();
  }, [search, customerType, source, statusFilter, debtPreset, customDebtAmount]);

  const handleSelectCustomer = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetails(true);
    try {
      const [resCust, resTimeline] = await Promise.all([
        api.get<Customer>(`/customers/${id}`),
        api.get<CustomerTimelineItem[]>(`/customers/${id}/timeline`)
      ]);
      setSelectedCustomer(resCust.data);
      setTimeline(resTimeline.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
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
      contactPhone: c.phone || '',
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
        className="card"
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
          <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '340px' }}>
            <Search size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.75rem', color: '#9CA3AF' }} />
            <input
              type="text"
              className="input"
              style={{
                height: '34px',
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: '2.1rem',
                paddingRight: '0.75rem',
                fontSize: '13px',
                borderRadius: '8px'
              }}
              placeholder="Tìm theo tên, MST, SĐT, người liên hệ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
        /* GIAO DIỆN ĐẶC THÙ CHIA 3 PHẦN KHI QUẢN TRỊ KHÁCH HÀNG */
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 300px', gap: '0.625rem', alignItems: 'start' }}>
          {/* CỘT 1 (30%): DANH SÁCH & THÔNG TIN KHÁCH HÀNG */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '14.3px', color: '#374151' }}>
                Khách hàng ({customers.length})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '12.1px', gap: '0.25rem', color: '#4B5563' }}
                  title="Quay lại bảng dữ liệu khách hàng"
                >
                  <ArrowLeft size={12} />
                  <span>Về bảng</span>
                </button>
                <button onClick={() => loadCustomers()} title="Tải lại" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '720px', overflowY: 'auto' }}>
              {customers.map((c) => {
                const isSelected = c.id === selectedCustomerId;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#FFEBEE' : '#FFFFFF',
                      borderLeft: isSelected ? '4px solid #EA332A' : '4px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '14.3px', color: isSelected ? '#B91C1C' : '#111827' }}>
                        {c.name}
                      </div>
                      <span className="badge badge-gray" style={{ fontSize: '12.1px' }}>
                        {c.code}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.65px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                      <Phone size={12} />
                      <span>{c.phone}</span>
                    </div>
                    <div style={{ fontSize: '12.1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ color: '#9CA3AF' }}>Phụ trách: {c.manager?.fullName || 'Chưa gán'}</span>
                      {(c.totalDebt || 0) > 0 ? (
                        <span style={{ color: c.isHighDebt ? '#DC2626' : '#D97706', fontWeight: '700' }}>
                          Nợ: {formatMoney(c.totalDebt || 0)} {c.isHighDebt && '⚠️'}
                        </span>
                      ) : (
                        <span style={{ color: '#EA332A', fontWeight: '600' }}>
                          {c._count?.orders || 0} đơn
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CỘT 2 (45%): CHI TIẾT & TIMELINE GIAO DỊCH */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {selectedCustomer ? (
              <>
                {/* Header chi tiết khách hàng */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => setViewMode('table')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.65rem', fontSize: '12.5px', gap: '0.3rem', color: '#374151', borderRadius: '9999px' }}
                          title="Quay lại giao diện Bảng DataGrid"
                        >
                          <ArrowLeft size={13} />
                          <span>Quay lại bảng</span>
                        </button>
                        <h2 style={{ fontSize: '1.265rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                          {selectedCustomer.name}
                        </h2>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '13.2px', color: '#6B7280' }}>
                        <span>Mã: <strong>{selectedCustomer.code}</strong></span>
                        <span>•</span>
                        <span>MST: <strong>{selectedCustomer.taxCode || 'Chưa cập nhật'}</strong></span>
                        <span>•</span>
                        <span>Loại: <strong>{selectedCustomer.customerType}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => openHandoverModal(selectedCustomer)}
                        className="btn btn-secondary btn-sm"
                        title="Bàn giao khách hàng cho Sales khác"
                      >
                        <UserCheck size={14} color="#E53935" />
                      </button>
                      {hasPermission('B_CUSTOMERS', 'update') && (
                        <button
                          onClick={() => openEditModal(selectedCustomer)}
                          className="btn btn-secondary btn-sm"
                          title="Chỉnh sửa thông tin khách hàng"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {hasPermission('B_CUSTOMERS', 'delete') && (
                        <button
                          onClick={() => openDeleteModal(selectedCustomer)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#DC2626' }}
                          title="Xóa khách hàng"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '13.75px', color: '#4B5563', backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={13} className="text-gray-400 shrink-0" /> <span><strong>Điện thoại:</strong> {selectedCustomer.phone}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><UserCheck size={13} className="text-gray-400 shrink-0" /> <span><strong>Liên hệ:</strong> {selectedCustomer.contactPerson || 'Chưa có'}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={13} className="text-gray-400 shrink-0" /> <span><strong>Địa chỉ:</strong> {selectedCustomer.address || 'Chưa có'}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Truck size={13} className="text-gray-400 shrink-0" /> <span><strong>Giao hàng:</strong> {selectedCustomer.deliveryAddress || selectedCustomer.address || 'Chưa có'}</span></div>
                  </div>

                  {/* Quản lý Hạn mức tín dụng & Đối chiếu công nợ A4 */}
                  {(() => {
                    const creditLimit = Number(selectedCustomer.creditLimit) || 50000000;
                    const totalDebt = selectedCustomer.analytics?.totalDebt || 0;
                    const usedPercent = creditLimit > 0 ? Math.min(100, Math.round((totalDebt / creditLimit) * 100)) : 0;
                    const isOver = totalDebt > creditLimit;
                    const available = Math.max(0, creditLimit - totalDebt);

                    return (
                      <div className="mt-3 p-3.5 bg-gray-50/90 rounded-xl border border-gray-200 text-xs">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-1.5 font-bold text-gray-800 uppercase text-[11px]">
                            {isOver ? <ShieldAlert className="w-4 h-4 text-red-600" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                            <span>Hạn mức tín dụng & Kiểm soát công nợ</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsDebtModalOpen(true)}
                            className="btn btn-secondary btn-sm !py-1 !px-2.5 text-[11.5px] flex items-center gap-1.5 text-[#E53935] bg-white border border-red-200 hover:bg-red-50 cursor-pointer shadow-xs"
                          >
                            <Printer size={13} />
                            <span>In đối chiếu công nợ A4</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-1 text-gray-700">
                          <div>
                            <span className="text-gray-500 text-[11px] block">Hạn mức được cấp:</span>
                            <strong className="text-gray-900 text-xs">{formatMoney(creditLimit)}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px] block">Dư nợ hiện tại:</span>
                            <strong className={totalDebt > 0 ? 'text-red-600 text-xs' : 'text-gray-900 text-xs'}>
                              {formatMoney(totalDebt)}
                            </strong>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px] block">Hạn mức khả dụng:</span>
                            <strong className="text-emerald-700 text-xs">{formatMoney(available)}</strong>
                          </div>
                        </div>

                        {/* Thanh tỷ lệ sử dụng hạn mức */}
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Tỷ lệ sử dụng hạn mức:</span>
                            <span className={isOver ? 'font-bold text-red-600' : 'font-semibold text-gray-700'}>
                              {usedPercent}% {isOver && '(VƯỢT HẠN MỨC!)'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isOver ? 'bg-red-600' : usedPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, (totalDebt / creditLimit) * 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-400 pt-0.5">
                            <span>Thời hạn nợ tối đa: <strong>{selectedCustomer.maxDebtDays || 30} ngày</strong></span>
                            <span>Số dư ký quỹ trả trước: <strong>{formatMoney(selectedCustomer.creditBalance || 0)}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Lịch sử giao dịch (Timeline) */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '14.3px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} className="text-gray-500" />
                    <span>Lịch sử giao dịch & Chăm sóc (Timeline)</span>
                  </h3>

                  {loadingDetails ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Đang tải lịch sử...</div>
                  ) : timeline.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Chưa có giao dịch báo giá hoặc đơn hàng nào phát sinh</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {timeline.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            backgroundColor: '#FAFAFA',
                            borderRadius: '0.5rem',
                            border: '1px solid #F3F4F6'
                          }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: item.type === 'ORDER' ? '#DCFCE7' : item.type === 'QUOTATION' ? '#FEF3C7' : item.type === 'RECEIPT' ? '#E0F2FE' : '#E0E7FF',
                              color: item.type === 'ORDER' ? '#16A34A' : item.type === 'QUOTATION' ? '#D97706' : item.type === 'RECEIPT' ? '#0284C7' : '#4F46E5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {item.type === 'ORDER' ? <ShoppingBag size={16} /> : item.type === 'QUOTATION' ? <FileSpreadsheet size={16} /> : item.type === 'RECEIPT' ? <CreditCard size={16} /> : <UserCheck size={16} />}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{ fontWeight: '600', fontSize: '14.3px', color: '#111827' }}>
                                {item.title}
                              </span>
                              <span style={{ fontSize: '12.1px', color: '#9CA3AF' }}>
                                {new Date(item.date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div style={{ fontSize: '13.2px', color: '#4B5563' }}>{item.notes || item.reason || (item as any).description || ''}</div>
                            {item.type === 'RECEIPT' ? (
                              <div style={{ fontSize: '13.2px', color: '#374151', marginBottom: '0.2rem' }}>
                                Đã thu: <strong style={{ color: '#0284C7' }}>{formatMoney(item.amount || 0)}</strong>
                                {item.paymentMethod && (
                                  <span style={{ marginLeft: '0.5rem', color: '#4B5563' }}>
                                    ({item.paymentMethod === 'CASH' ? 'Tiền mặt' : item.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : item.paymentMethod})
                                  </span>
                                )}
                                {item.actor && (
                                  <span style={{ marginLeft: '0.5rem', color: '#6B7280', fontSize: '12.65px' }}>
                                    - Thu bởi: {item.actor}
                                  </span>
                                )}
                              </div>
                            ) : (
                              item.amount !== undefined && (
                                <div style={{ fontSize: '13.2px', color: '#374151', marginBottom: '0.2rem' }}>
                                  Giá trị: <strong>{formatMoney(item.amount)}</strong>
                                  {item.paid !== undefined && (
                                    <span style={{ marginLeft: '0.5rem', color: '#16A34A' }}>
                                      (Đã thu: {formatMoney(item.paid)})
                                    </span>
                                  )}
                                  {item.remaining !== undefined && item.remaining > 0 && (
                                    <span style={{ marginLeft: '0.5rem', color: '#DC2626', fontWeight: '600' }}>
                                      [Còn nợ: {formatMoney(item.remaining)}]
                                    </span>
                                  )}
                                </div>
                              )
                            )}

                            {item.reason && (
                              <div style={{ fontSize: '13.2px', color: '#4B5563', fontStyle: 'italic' }}>
                                Lý do bàn giao: {item.reason} ({item.from} → {item.to})
                              </div>
                            )}

                            {item.notes && (
                              <div style={{ fontSize: '12.65px', color: '#6B7280', marginTop: '0.2rem' }}>
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
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
          </div>

          {/* CỘT 3 (25%): THỐNG KÊ TÀI CHÍNH & CÔNG NỢ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '13.75px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CreditCard size={14} className="text-[#E53935]" />
                <span>Tổng quan Công nợ</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '12.65px', color: '#6B7280' }}>Tổng doanh số mua:</div>
                  <div style={{ fontSize: '1.265rem', fontWeight: '700', color: '#111827' }}>
                    {formatMoney(selectedCustomer?.analytics?.totalSpent)}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#DCFCE7', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '12.65px', color: '#166534' }}>Đã thanh toán (Thực thu):</div>
                  <div style={{ fontSize: '1.265rem', fontWeight: '700', color: '#15803D' }}>
                    {formatMoney(selectedCustomer?.analytics?.totalPaid)}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: selectedCustomer?.analytics?.totalDebt ? '#FEE2E2' : '#F3F4F6', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '12.65px', color: selectedCustomer?.analytics?.totalDebt ? '#991B1B' : '#4B5563' }}>
                    Còn phải thu (Nợ đọng):
                  </div>
                  <div style={{ fontSize: '1.265rem', fontWeight: '700', color: selectedCustomer?.analytics?.totalDebt ? '#DC2626' : '#111827' }}>
                    {formatMoney(selectedCustomer?.analytics?.totalDebt)}
                  </div>
                </div>

                {/* Số dư ký quỹ / Tiền trả trước theo Mục IX */}
                <div style={{ padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: '0.5rem', border: '1px solid #DBEAFE' }}>
                  <div style={{ fontSize: '12.65px', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Số dư trả trước / Ký quỹ:</span>
                    <span style={{ fontSize: '12.1px', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>Mục IX</span>
                  </div>
                  <div style={{ fontSize: '1.265rem', fontWeight: '700', color: '#1D4ED8', marginTop: '2px' }}>
                    {formatMoney(Number(selectedCustomer?.creditBalance) || 0)}
                  </div>
                  <div style={{ fontSize: '12.1px', color: '#3B82F6', marginTop: '2px' }}>
                    Tiền khách trả thừa / hoàn cọc cấn trừ đơn sau
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F3F4F6', fontSize: '12.65px', color: '#6B7280' }}>
                <div>Tổng số đơn hàng: <strong>{selectedCustomer?.analytics?.orderCount || 0}</strong></div>
                <div style={{ marginTop: '0.25rem' }}>
                  Đơn hàng gần nhất:{' '}
                  <strong>
                    {selectedCustomer?.analytics?.lastOrderDate
                      ? new Date(selectedCustomer.analytics.lastOrderDate).toLocaleDateString('vi-VN')
                      : 'Chưa có'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '13.75px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={14} className="text-[#E53935]" />
                <span>Ghi chú chăm sóc VPP</span>
              </h3>
              <div style={{ fontSize: '13.75px', color: '#4B5563', lineHeight: '1.5', minHeight: '80px', backgroundColor: '#FEF9C3', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #FEF08A' }}>
                {selectedCustomer?.notes || 'Chưa có ghi chú chăm sóc đặc thù cho khách hàng này.'}
              </div>
            </div>
          </div>
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
                                    setIsCustomerTypeFilterOpen(!isCustomerTypeFilterOpen);
                                    setIsSourceFilterOpen(false);
                                  }}
                                  className={`p-1 rounded transition-all cursor-pointer ${
                                    customerType
                                      ? 'bg-red-100 text-red-700 border border-red-300 shadow-sm'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
                                  }`}
                                  title={customerType ? `Đang lọc: ${CUSTOMER_TYPE_FILTER_OPTIONS.find(o => o.value === customerType)?.label}` : 'Lọc Loại khách hàng'}
                                >
                                  <Filter size={11} className={customerType ? 'fill-red-600' : ''} />
                                </button>
                                {isCustomerTypeFilterOpen && (
                                  <div
                                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1.5 min-w-[170px] normal-case font-normal text-left"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.12))' }}
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
                                        className={`w-full px-3 py-1.5 text-[12.5px] flex items-center justify-between transition-colors text-left ${
                                          customerType === opt.value
                                            ? 'bg-red-50 text-red-600 font-semibold'
                                            : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        <span>{opt.label}</span>
                                        {customerType === opt.value && <Check size={13} className="text-red-600 ml-2 flex-shrink-0" />}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {colKey === 'source' && (
                              <div className="relative inline-flex items-center" ref={sourceFilterRef}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSourceFilterOpen(!isSourceFilterOpen);
                                    setIsCustomerTypeFilterOpen(false);
                                  }}
                                  className={`p-1 rounded transition-all cursor-pointer ${
                                    source
                                      ? 'bg-red-100 text-red-700 border border-red-300 shadow-sm'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
                                  }`}
                                  title={source ? `Đang lọc: ${SOURCE_FILTER_OPTIONS.find(o => o.value === source)?.label}` : 'Lọc Nguồn gốc'}
                                >
                                  <Filter size={11} className={source ? 'fill-red-600' : ''} />
                                </button>
                                {isSourceFilterOpen && (
                                  <div
                                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1.5 min-w-[170px] normal-case font-normal text-left"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.12))' }}
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
                                        className={`w-full px-3 py-1.5 text-[12.5px] flex items-center justify-between transition-colors text-left ${
                                          source === opt.value
                                            ? 'bg-red-50 text-red-600 font-semibold'
                                            : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        <span>{opt.label}</span>
                                        {source === opt.value && <Check size={13} className="text-red-600 ml-2 flex-shrink-0" />}
                                      </button>
                                    ))}
                                  </div>
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
                  customers.map((c, idx) => {
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
                                    {idx + 1}
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
                                    <div className="flex items-center justify-center gap-1.5">
                                      {hasPermission('B_CUSTOMERS', 'update') && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(c);
                                          }}
                                          className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                          title="Chỉnh sửa thông tin khách hàng"
                                        >
                                          <Pencil size={13} />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openHandoverModal(c);
                                        }}
                                        className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                        title="Bàn giao khách hàng"
                                      >
                                        <ArrowLeftRight size={13} />
                                      </button>
                                      {hasPermission('B_CUSTOMERS', 'delete') && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModal(c);
                                          }}
                                          className="w-7 h-7 flex items-center justify-center rounded border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                          title="Xóa khách hàng"
                                        >
                                          <Trash2 size={13} />
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
                        <option value="HOUSEHOLD">Đại lý / Cửa hàng VPP</option>
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
                        <option value="ACTIVE">Tiềm năng</option>
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
                        placeholder="VD: contact@company.com"
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
                        placeholder="QUẢN TRỊ"
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
                        <option value="SOCIAL">Mạng xã hội / Web</option>
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
                    Lý do bàn giao (Bắt buộc lưu audit log) *
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
        sampleHeaders={['Tên khách hàng', 'Số điện thoại', 'Mã số thuế', 'Địa chỉ', 'Người liên hệ', 'Loại khách']}
        sampleRows={[
          ['Công ty Cổ phần Tập đoàn FPT', '02473007300', '0101248141', 'Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội', 'Anh Hoàng', 'ENTERPRISE'],
          ['Trường THCS Lê Quý Đôn', '02438345678', '0102345678', 'Số 66 Nguyễn Văn Huyên, Cầu Giấy, Hà Nội', 'Cô Lan', 'SCHOOL']
        ]}
        requiredFields={['Tên khách hàng', 'Số điện thoại']}
        fieldMappingHelp="Điền Tên khách hàng, SĐT (bắt buộc). Mã số thuế, Địa chỉ, Người liên hệ, Loại khách (ENTERPRISE/SCHOOL/INDIVIDUAL)."
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
                  <span className="font-bold text-red-700">Tạm dừng (INACTIVE)</span> để bảo toàn lịch sử chứng từ và hóa đơn hợp lệ.
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
