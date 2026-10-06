import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  Truck,
  Lightbulb,
  FileText,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Printer,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { Customer, CustomerTimelineItem, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ImportExcelModal } from '../../components/common/ImportExcelModal';
import { DebtConfirmationModal } from './components/DebtConfirmationModal';
import { useTableResize } from '../../hooks/useTableResize';
import { Toast } from '../../components/common/Toast';

export const CustomersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [source, setSource] = useState('');
  const [highDebtOnly, setHighDebtOnly] = useState(false);

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
    email: '',
    notes: '',
    managerId: '',
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
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    name: true,
    phone: true,
    taxCode: true,
    manager: true,
    customerType: true,
    totalDebt: true,
    creditBalance: true,
    source: true,
    orders: true,
    status: true,
    actions: true
  };

  const defaultColOrder = [
    'stt',
    'code',
    'name',
    'phone',
    'taxCode',
    'manager',
    'customerType',
    'totalDebt',
    'creditBalance',
    'source',
    'orders',
    'status',
    'actions'
  ];

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_customers_visible_cols');
      return saved ? JSON.parse(saved) : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_customers_col_order');
      return saved ? JSON.parse(saved) : defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const defaultCustomerWidths: Record<string, number> = {
    stt: 60,
    code: 130,
    name: 280,
    phone: 140,
    taxCode: 140,
    manager: 150,
    customerType: 140,
    totalDebt: 160,
    creditBalance: 160,
    source: 140,
    orders: 110,
    status: 140,
    actions: 150
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'customers',
    defaultWidths: defaultCustomerWidths,
    minWidth: 60,
    minWidths: {
      stt: 50,
      code: 110,
      name: 180,
      phone: 120,
      taxCode: 120,
      manager: 130,
      customerType: 120,
      totalDebt: 140,
      creditBalance: 140,
      source: 120,
      orders: 90,
      status: 120,
      actions: 130
    }
  });

  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'Mã KH',
    name: 'Tên khách hàng',
    phone: 'Số điện thoại',
    taxCode: 'Mã số thuế',
    manager: 'Phụ trách',
    customerType: 'Loại khách',
    totalDebt: 'Công nợ hiện tại',
    creditBalance: 'Số dư tiền cọc',
    source: 'Nguồn khách',
    orders: 'Số đơn',
    status: 'Trạng thái',
    actions: 'Thao tác'
  };

  const handleDragStart = (e: React.DragEvent, colKey: string) => {
    setDraggedCol(colKey);
    e.dataTransfer.setData('text/plain', colKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    if (draggedCol && draggedCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetCol || targetCol === 'actions' || targetCol === 'stt' || draggedCol === 'actions' || draggedCol === 'stt') {
      setDraggedCol(null);
      setDragOverCol(null);
      return;
    }

    const newOrder = [...columnOrder];
    const dragIdx = newOrder.indexOf(draggedCol);
    const dropIdx = newOrder.indexOf(targetCol);

    if (dragIdx > -1 && dropIdx > -1) {
      newOrder.splice(dragIdx, 1);
      newOrder.splice(dropIdx, 0, draggedCol);
      // Đảm bảo actions luôn ở vị trí cuối cùng
      const withoutActions = newOrder.filter((k) => k !== 'actions');
      withoutActions.push('actions');
      setColumnOrder(withoutActions);
      localStorage.setItem('namkhanh_customers_col_order', JSON.stringify(withoutActions));
    }

    setDraggedCol(null);
    setDragOverCol(null);
  };

  const toggleColumnVisibility = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    localStorage.setItem('namkhanh_customers_visible_cols', JSON.stringify(updated));
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    localStorage.removeItem('namkhanh_customers_visible_cols');
    localStorage.removeItem('namkhanh_customers_col_order');
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

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (customerType) query.append('customerType', customerType);
      if (source) query.append('source', source);
      if (highDebtOnly) query.append('highDebtOnly', 'true');

      const res = await api.get<Customer[]>(`/customers?${query.toString()}`);
      const data = res.data || [];
      setCustomers(data);

      if (data.length > 0 && !selectedCustomerId) {
        handleSelectCustomer(data[0].id);
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
  }, [search, customerType, source, highDebtOnly]);

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
    setFormData({
      code: `KH${String(customers.length + 1).padStart(4, '0')}`,
      name: '',
      phone: '',
      taxCode: '',
      address: '',
      deliveryAddress: '',
      customerType: 'ENTERPRISE',
      source: 'SELF_FOUND',
      contactPerson: '',
      email: '',
      notes: '',
      managerId: users[0]?.id || '',
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
    setFormData({
      code: c.code,
      name: c.name,
      phone: c.phone,
      taxCode: c.taxCode || '',
      address: c.address || '',
      deliveryAddress: c.deliveryAddress || '',
      customerType: c.customerType,
      source: c.source,
      contactPerson: c.contactPerson || '',
      email: c.email || '',
      notes: c.notes || '',
      managerId: c.managerId || '',
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
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError('Tên khách hàng và Số điện thoại là bắt buộc');
      return;
    }
    if (phoneWarning || taxWarning) {
      setFormError('Vui lòng kiểm tra lại cảnh báo trùng lặp trước khi lưu');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
        setToastMessage('Đã cập nhật thành công');
      } else {
        await api.post('/customers', formData);
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

  const formatMoney = (val?: number) => {
    return (val || 0).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Thanh công cụ tìm kiếm & Thêm mới */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '1rem 1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.75rem', color: '#9CA3AF' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Tìm theo tên, MST, SĐT, người liên hệ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input"
            style={{ width: '180px' }}
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
          >
            <option value="">-- Loại khách hàng --</option>
            <option value="ENTERPRISE">Doanh nghiệp</option>
            <option value="SCHOOL">Trường học</option>
            <option value="ORGANIZATION">Cơ quan / Tổ chức</option>
            <option value="HOUSEHOLD">Đại lý / Hộ KD</option>
            <option value="INDIVIDUAL">Cá nhân</option>
          </select>

          <select
            className="input"
            style={{ width: '180px' }}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="">-- Nguồn khách hàng --</option>
            <option value="SELF_FOUND">Tự tìm kiếm</option>
            <option value="REFERRAL">Được giới thiệu</option>
            <option value="SOCIAL">Mạng xã hội / Web</option>
            <option value="EXHIBITION">Hội thảo / Triển lãm</option>
            <option value="OTHER">Khác</option>
          </select>

          <button
            type="button"
            onClick={() => setHighDebtOnly(!highDebtOnly)}
            className={`btn btn-sm ${highDebtOnly ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem',
              fontSize: '12px',
              backgroundColor: highDebtOnly ? '#FEF2F2' : '#FFFFFF',
              borderColor: highDebtOnly ? '#EF4444' : '#E5E7EB',
              color: highDebtOnly ? '#DC2626' : '#4B5563',
              fontWeight: highDebtOnly ? 700 : 500,
              boxShadow: highDebtOnly ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
            title="Lọc nhanh danh sách khách hàng có công nợ lớn vượt quá 50 triệu đồng"
          >
            <AlertTriangle size={14} color={highDebtOnly ? '#DC2626' : '#F59E0B'} />
            <span>Nợ &gt; 50 triệu {highDebtOnly && '✓'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Chuyển đổi chế độ xem (3 phần vs Bảng) */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F3F4F6', padding: '3px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`btn btn-sm ${viewMode === 'split' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                border: 'none',
                padding: '0.35rem 0.65rem',
                fontSize: '12px',
                gap: '0.35rem',
                borderRadius: '6px',
                boxShadow: viewMode === 'split' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
              title="Chế độ chia 3 phần đặc thù"
            >
              <LayoutGrid size={14} />
              <span>Dạng 3 phần</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                border: 'none',
                padding: '0.35rem 0.65rem',
                fontSize: '12px',
                gap: '0.35rem',
                borderRadius: '6px',
                boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
              title="Chế độ Bảng DataGrid đầy đủ"
            >
              <Table size={14} />
              <span>Bảng DataGrid</span>
            </button>
          </div>

          {/* Nút Tùy chỉnh cột DataGrid */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', gap: '0.35rem' }}
              title="Tùy chỉnh ẩn/hiện cột và thứ tự hiển thị"
            >
              <Columns size={14} />
              <span>Tùy chỉnh cột</span>
            </button>

            {isColumnDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '250px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)',
                  border: '1px solid #E5E7EB',
                  zIndex: 60,
                  padding: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>Ẩn / Hiện & Thứ tự cột</span>
                  <button
                    onClick={resetColumns}
                    style={{ background: 'none', border: 'none', color: '#E53935', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    title="Khôi phục thứ tự và hiển thị mặc định"
                  >
                    <RotateCcw size={11} />
                    <span>Mặc định</span>
                  </button>
                </div>
                <div style={{ fontSize: '10.5px', color: '#6B7280', marginBottom: '0.5rem', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Lightbulb size={12} className="text-amber-500 shrink-0" />
                  <span><strong>Kéo thả</strong> tiêu đề cột trên bảng DataGrid để đổi thứ tự cột linh hoạt.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '260px', overflowY: 'auto' }}>
                  {columnOrder.map((colKey) => (
                    <label
                      key={colKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '12px',
                        color: '#374151',
                        cursor: 'pointer',
                        padding: '0.2rem 0'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[colKey] !== false}
                        onChange={() => toggleColumnVisibility(colKey)}
                        style={{ accentColor: '#E53935', width: '14px', height: '14px' }}
                      />
                      <span>{columnLabels[colKey] || colKey}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nút Nhập Excel hàng loạt */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '12px', gap: '0.35rem', backgroundColor: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}
            title="Nhập danh sách khách hàng hàng loạt từ Excel/CSV"
          >
            <FileSpreadsheet size={14} color="#059669" />
            <span>Nhập Excel</span>
          </button>

          {hasPermission('B_CUSTOMERS', 'create') && (
            <button onClick={openAddModal} className="btn btn-primary btn-sm" style={{ padding: '0.45rem 0.85rem' }}>
              <Plus size={16} />
              <span>Thêm khách hàng</span>
            </button>
          )}
        </div>
      </div>

      {/* GIAO DIỆN HIỂN THỊ: 3 PHẦN (SPLIT) HOẶC BẢNG DATAGRID (TABLE) */}
      {viewMode === 'split' ? (
        /* GIAO DIỆN ĐẶC THÙ CHIA 3 PHẦN KHI QUẢN TRỊ KHÁCH HÀNG */
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 300px', gap: '1rem', alignItems: 'start' }}>
          {/* CỘT 1 (30%): DANH SÁCH & THÔNG TIN KHÁCH HÀNG */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '13px', color: '#374151' }}>
                Danh sách khách hàng ({customers.length})
              </span>
              <button onClick={loadCustomers} title="Tải lại" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <RefreshCw size={14} />
              </button>
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
                      borderLeft: isSelected ? '4px solid #E53935' : '4px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: isSelected ? '#B91C1C' : '#111827' }}>
                        {c.name}
                      </div>
                      <span className="badge badge-gray" style={{ fontSize: '10px' }}>
                        {c.code}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                      <Phone size={12} />
                      <span>{c.phone}</span>
                    </div>
                    <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ color: '#9CA3AF' }}>Phụ trách: {c.manager?.fullName || 'Chưa gán'}</span>
                      {(c.totalDebt || 0) > 0 ? (
                        <span style={{ color: c.isHighDebt ? '#DC2626' : '#D97706', fontWeight: '700' }}>
                          Nợ: {formatMoney(c.totalDebt || 0)} {c.isHighDebt && '⚠️'}
                        </span>
                      ) : (
                        <span style={{ color: '#E53935', fontWeight: '600' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                          style={{ padding: '0.2rem 0.5rem', fontSize: '11px', gap: '0.25rem', color: '#4B5563' }}
                          title="Quay lại giao diện Bảng DataGrid"
                        >
                          <ArrowLeft size={13} />
                          <span>Danh sách</span>
                        </button>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                          {selectedCustomer.name}
                        </h2>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '12px', color: '#6B7280' }}>
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
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '12.5px', color: '#4B5563', backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '0.5rem' }}>
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
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
                              <span style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>
                                {item.title}
                              </span>
                              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                {new Date(item.date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#4B5563' }}>{item.notes || item.reason || (item as any).description || ''}</div>
                            {item.type === 'RECEIPT' ? (
                              <div style={{ fontSize: '12px', color: '#374151', marginBottom: '0.2rem' }}>
                                Đã thu: <strong style={{ color: '#0284C7' }}>{formatMoney(item.amount || 0)}</strong>
                                {item.paymentMethod && (
                                  <span style={{ marginLeft: '0.5rem', color: '#4B5563' }}>
                                    ({item.paymentMethod === 'CASH' ? 'Tiền mặt' : item.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : item.paymentMethod})
                                  </span>
                                )}
                                {item.actor && (
                                  <span style={{ marginLeft: '0.5rem', color: '#6B7280', fontSize: '11.5px' }}>
                                    - Thu bởi: {item.actor}
                                  </span>
                                )}
                              </div>
                            ) : (
                              item.amount !== undefined && (
                                <div style={{ fontSize: '12px', color: '#374151', marginBottom: '0.2rem' }}>
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
                              <div style={{ fontSize: '12px', color: '#4B5563', fontStyle: 'italic' }}>
                                Lý do bàn giao: {item.reason} ({item.from} → {item.to})
                              </div>
                            )}

                            {item.notes && (
                              <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '0.2rem' }}>
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
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                Vui lòng chọn một khách hàng bên cột trái để xem hồ sơ và lịch sử
              </div>
            )}
          </div>

          {/* CỘT 3 (25%): THỐNG KÊ TÀI CHÍNH & CÔNG NỢ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '12.5px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CreditCard size={14} className="text-[#E53935]" />
                <span>Tổng quan Công nợ</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '11.5px', color: '#6B7280' }}>Tổng doanh số mua:</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#111827' }}>
                    {formatMoney(selectedCustomer?.analytics?.totalSpent)}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#DCFCE7', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '11.5px', color: '#166534' }}>Đã thanh toán (Thực thu):</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#15803D' }}>
                    {formatMoney(selectedCustomer?.analytics?.totalPaid)}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: selectedCustomer?.analytics?.totalDebt ? '#FEE2E2' : '#F3F4F6', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '11.5px', color: selectedCustomer?.analytics?.totalDebt ? '#991B1B' : '#4B5563' }}>
                    Còn phải thu (Nợ đọng):
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: selectedCustomer?.analytics?.totalDebt ? '#DC2626' : '#111827' }}>
                    {formatMoney(selectedCustomer?.analytics?.totalDebt)}
                  </div>
                </div>

                {/* Số dư ký quỹ / Tiền trả trước theo Mục IX */}
                <div style={{ padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: '0.5rem', border: '1px solid #DBEAFE' }}>
                  <div style={{ fontSize: '11.5px', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Số dư trả trước / Ký quỹ:</span>
                    <span style={{ fontSize: '10px', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>Mục IX</span>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1D4ED8', marginTop: '2px' }}>
                    {formatMoney(Number(selectedCustomer?.creditBalance) || 0)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#3B82F6', marginTop: '2px' }}>
                    Tiền khách trả thừa / hoàn cọc cấn trừ đơn sau
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F3F4F6', fontSize: '11.5px', color: '#6B7280' }}>
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
              <h3 style={{ fontSize: '12.5px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={14} className="text-[#E53935]" />
                <span>Ghi chú chăm sóc VPP</span>
              </h3>
              <div style={{ fontSize: '12.5px', color: '#4B5563', lineHeight: '1.5', minHeight: '80px', backgroundColor: '#FEF9C3', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #FEF08A' }}>
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
              <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#111827' }}>
                Bảng dữ liệu Khách hàng ({customers.length})
              </span>
              <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '0.5rem' }}>
                (Kéo thả tiêu đề cột để thay đổi thứ tự hiển thị)
              </span>
            </div>
            <button onClick={loadCustomers} title="Tải lại dữ liệu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
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
                <tr>
                  {columnOrder
                    .filter((colKey) => visibleColumns[colKey] !== false)
                    .map((colKey) => (
                      <th
                        key={colKey}
                        draggable={colKey !== 'actions' && colKey !== 'stt'}
                        onDragStart={(e) => handleDragStart(e, colKey)}
                        onDragOver={(e) => handleDragOver(e, colKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, colKey)}
                        className={`table-th ${colKey === 'actions' ? 'sticky-action-th' : ''}`}
                        style={{
                          width: `${columnWidths[colKey] || defaultCustomerWidths[colKey] || 120}px`,
                          position: colKey === 'actions' ? 'sticky' : 'relative',
                          cursor: colKey !== 'actions' && colKey !== 'stt' ? 'grab' : 'default',
                          backgroundColor: dragOverCol === colKey ? '#FEE2E2' : undefined,
                          borderLeft: dragOverCol === colKey ? '3px solid #E53935' : undefined,
                          transition: 'background-color 0.15s ease',
                          whiteSpace: 'nowrap',
                          userSelect: 'none'
                        }}
                        title={colKey !== 'actions' && colKey !== 'stt' ? 'Kéo để đổi thứ tự cột' : undefined}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                          {colKey !== 'actions' && colKey !== 'stt' && (
                            <GripVertical size={13} style={{ color: '#9CA3AF', cursor: 'grab', flexShrink: 0 }} />
                          )}
                          <span className="whitespace-nowrap select-none font-semibold">{columnLabels[colKey] || colKey}</span>
                        </div>
                        {colKey !== 'actions' && (
                          <div
                            className="col-resizer"
                            onMouseDown={(e) => startResize(colKey, e)}
                            onClick={(e) => e.stopPropagation()}
                            title="Kéo sang trái/phải để điều chỉnh độ rộng cột"
                          />
                        )}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columnOrder.length} style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                      Đang tải danh sách khách hàng...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={columnOrder.length} style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
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
                        className="hover:bg-gray-50 transition-colors"
                        style={{
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer'
                        }}
                        title={`Nhấn để xem chi tiết khách hàng ${c.name}`}
                      >
                        {columnOrder
                          .filter((colKey) => visibleColumns[colKey] !== false)
                          .map((colKey) => {
                            switch (colKey) {
                              case 'stt':
                                return (
                                  <td key={colKey} className="table-td" style={{ width: '45px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                    {idx + 1}
                                  </td>
                                );
                              case 'code':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontWeight: '600', color: '#E53935', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', fontFamily: 'monospace', textAlign: 'center' }}>
                                    {c.code}
                                  </td>
                                );
                              case 'name': {
                                const fullAddr = c.address || c.deliveryAddress || '';
                                return (
                                  <td key={colKey} className="table-td" style={{ overflow: 'hidden' }}>
                                    <div className="min-w-0" title={fullAddr ? `${c.name}\nĐịa chỉ: ${fullAddr}` : c.name}>
                                      <div className="font-semibold text-gray-900 text-sm truncate leading-snug">
                                        {c.name}
                                      </div>
                                      {fullAddr && (
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                                          <MapPin size={12} className="text-gray-400 shrink-0" />
                                          <span className="truncate">{fullAddr}</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              }
                              case 'phone':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontSize: '12.5px', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', fontFamily: 'monospace', textAlign: 'center' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <Phone size={12} className="text-gray-400" />
                                      {c.phone}
                                    </span>
                                  </td>
                                );
                              case 'taxCode':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontSize: '12px', color: '#4B5563', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center' }}>
                                    {c.taxCode ? (
                                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{c.taxCode}</span>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                );
                              case 'manager':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontSize: '12.5px', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 max-w-full truncate" title={c.manager?.fullName || 'Chưa gán'}>
                                      {c.manager?.fullName || 'Chưa gán'}
                                    </span>
                                  </td>
                                );
                              case 'customerType':
                                return (
                                  <td key={colKey} className="table-td" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                    <span className="badge badge-gray" style={{ fontSize: '11px' }}>
                                      {c.customerType === 'ENTERPRISE'
                                        ? 'Doanh nghiệp'
                                        : c.customerType === 'SCHOOL'
                                        ? 'Trường học'
                                        : c.customerType === 'ORGANIZATION'
                                        ? 'Cơ quan/Tổ chức'
                                        : c.customerType === 'HOUSEHOLD'
                                        ? 'Đại lý / Hộ KD'
                                        : 'Cá nhân'}
                                    </span>
                                  </td>
                                );
                              case 'totalDebt': {
                                const debt = Number(c.totalDebt || 0);
                                return (
                                  <td key={colKey} className="table-td" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', width: '100%' }}>
                                      <span style={{ fontWeight: '700', color: debt > 0 ? (c.isHighDebt ? '#DC2626' : '#B45309') : '#059669', fontSize: '12.5px', fontVariantNumeric: 'tabular-nums' }}>
                                        {formatMoney(debt)}
                                      </span>
                                      {c.isHighDebt && (
                                        <span className="badge badge-red" style={{ fontSize: '10px', padding: '2px 5px', fontWeight: 600 }} title="Khách nợ lớn trên 50 triệu!">
                                          &gt; 50tr ⚠️
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              }
                              case 'creditBalance':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontWeight: '600', color: Number(c.creditBalance) > 0 ? '#15803D' : '#6B7280', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
                                    {formatMoney(Number(c.creditBalance) || 0)}
                                  </td>
                                );
                              case 'source':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden' }}>
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
                                  <td key={colKey} className="table-td" style={{ fontWeight: '600', color: '#E53935', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                    {c._count?.orders || 0} đơn
                                  </td>
                                );
                              case 'status':
                                return (
                                  <td key={colKey} className="table-td" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                    <span className={c.status === 'ACTIVE' ? 'badge badge-green' : 'badge badge-red'}>
                                      {c.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                                    </span>
                                  </td>
                                );
                              case 'actions':
                                return (
                                  <td
                                    key={colKey}
                                    className="table-td sticky-action-td"
                                    style={{
                                      whiteSpace: 'nowrap'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectCustomer(c.id);
                                          setViewMode('split');
                                        }}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '0.35rem 0.5rem' }}
                                        title="Xem chi tiết & timeline dạng 3 phần"
                                      >
                                        <Eye size={13} color="#E53935" />
                                      </button>
                                      {hasPermission('B_CUSTOMERS', 'update') && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(c);
                                          }}
                                          className="btn btn-secondary btn-sm"
                                          style={{ padding: '0.35rem 0.5rem' }}
                                          title="Chỉnh sửa thông tin khách hàng"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openHandoverModal(c);
                                        }}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '0.35rem 0.5rem' }}
                                        title="Bàn giao khách hàng"
                                      >
                                        <UserCheck size={13} color="#E53935" />
                                      </button>
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

      {/* MODAL THÊM MỚI / CHỈNH SỬA KHÁCH HÀNG */}
      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="modal-content bg-white rounded-xl shadow-2xl w-full relative z-[1001] max-h-[90vh] overflow-y-auto" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>
                {editingId ? 'Chỉnh sửa thông tin khách hàng' : 'Thêm mới khách hàng doanh nghiệp / đại lý'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {formError && (
                  <div style={{ padding: '0.625rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '0.375rem', fontSize: '13px' }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Mã KH *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Tên công ty / Khách hàng *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="VD: Tập Đoàn Công Nghệ CMC..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Số điện thoại * (Check trùng)
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="02437689000 hoặc 0988..."
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      required
                    />
                    {phoneWarning && (
                      <div style={{ fontSize: '11.5px', color: '#DC2626', marginTop: '0.25rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>{phoneWarning}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Mã số thuế (Check trùng)
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="0100244112..."
                      value={formData.taxCode}
                      onChange={(e) => handleTaxChange(e.target.value)}
                    />
                    {taxWarning && (
                      <div style={{ fontSize: '11.5px', color: '#DC2626', marginTop: '0.25rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>{taxWarning}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Người liên hệ</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="VD: Chị Phương (Trưởng phòng HC)"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Email liên hệ</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="hanhchinh@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Loại khách hàng</label>
                    <select
                      className="input"
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                    >
                      <option value="ENTERPRISE">Doanh nghiệp</option>
                      <option value="SCHOOL">Trường học</option>
                      <option value="ORGANIZATION">Cơ quan / Tổ chức</option>
                      <option value="HOUSEHOLD">Đại lý / Cửa hàng VPP</option>
                      <option value="INDIVIDUAL">Cá nhân</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Nguồn gốc</label>
                    <select
                      className="input"
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

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Địa chỉ trụ sở</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Số nhà, đường, phường, quận, tỉnh..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Địa chỉ giao hàng VPP</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Kho hoặc tầng giao hàng chi tiết..."
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Nhân viên phụ trách</label>
                  <select
                    className="input"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">-- Chọn nhân viên kinh doanh --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.code}) - {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Hạn mức tín dụng / nợ (VNĐ)
                    </label>
                    <input
                      type="number"
                      className="input"
                      placeholder="50000000"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Số ngày nợ tối đa (Ngày)
                    </label>
                    <input
                      type="number"
                      className="input"
                      placeholder="30"
                      value={formData.maxDebtDays}
                      onChange={(e) => setFormData({ ...formData, maxDebtDays: Number(e.target.value) || 30 })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Ghi chú đặc thù</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Nhu cầu định kỳ loại giấy in, chu kỳ thanh toán, ngày giao hàng..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
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
                      <span>{editingId ? 'Đang cập nhật...' : 'Đang tạo mới...'}</span>
                    </>
                  ) : (
                    <span>{editingId ? 'Cập nhật' : 'Tạo mới'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BÀN GIAO KHÁCH HÀNG */}
      {isHandoverModalOpen && selectedCustomer && (
        <div className="modal-overlay fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="modal-content bg-white rounded-xl shadow-2xl w-full relative z-[1001] max-h-[90vh] overflow-y-auto" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>
                Bàn giao quyền quản lý khách hàng
              </h3>
              <button onClick={() => setIsHandoverModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleHandoverSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '13px', color: '#374151', backgroundColor: '#F3F4F6', padding: '0.75rem', borderRadius: '0.375rem' }}>
                  Khách hàng bàn giao: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.code})
                  <div style={{ marginTop: '0.25rem', fontSize: '12px', color: '#6B7280' }}>
                    Người phụ trách hiện tại: <strong>{selectedCustomer.manager?.fullName || 'Chưa gán'}</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>
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
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>
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
        </div>
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

      <Toast
        show={!!toastMessage}
        message={toastMessage || ''}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
};
