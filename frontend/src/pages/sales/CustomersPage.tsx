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
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../../services/api';
import { Customer, CustomerTimelineItem, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ImportExcelModal } from '../../components/common/ImportExcelModal';

export const CustomersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [source, setSource] = useState('');

  // 3-Pane selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [timeline, setTimeline] = useState<CustomerTimelineItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [taxWarning, setTaxWarning] = useState<string | null>(null);
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
    managerId: ''
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
    if (!draggedCol || draggedCol === targetCol) {
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
      setColumnOrder(newOrder);
      localStorage.setItem('namkhanh_customers_col_order', JSON.stringify(newOrder));
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
  }, [search, customerType, source]);

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
        setPhoneWarning(`⚠️ SĐT [${trimmed}] đã thuộc về khách hàng "${match.name}" (${match.code})`);
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
        setTaxWarning(`⚠️ Mã số thuế [${trimmed}] đã thuộc về khách hàng "${match.name}" (${match.code})`);
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
      managerId: users[0]?.id || ''
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
      managerId: c.managerId || ''
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
      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
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
    }
  };

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !handoverData.toUserId || !handoverData.reason) {
      alert('Vui lòng chọn nhân viên nhận và nhập lý do bàn giao');
      return;
    }

    try {
      await api.post(`/customers/${selectedCustomerId}/handover`, handoverData);
      setIsHandoverModalOpen(false);
      setHandoverData({ toUserId: '', reason: '' });
      loadCustomers();
      handleSelectCustomer(selectedCustomerId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi bàn giao khách hàng');
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
                <div style={{ fontSize: '10.5px', color: '#6B7280', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  💡 <strong>Kéo thả</strong> tiêu đề cột trên bảng DataGrid để đổi thứ tự cột linh hoạt.
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
                    <div style={{ fontSize: '11.5px', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Phụ trách: {c.manager?.fullName || 'Chưa gán'}</span>
                      <span style={{ color: '#E53935', fontWeight: '600' }}>
                        {c._count?.orders || 0} đơn
                      </span>
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
                      <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#111827', margin: '0 0 0.25rem 0' }}>
                        {selectedCustomer.name}
                      </h2>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '12px', color: '#6B7280' }}>
                        <span>Mã: <strong>{selectedCustomer.code}</strong></span>
                        <span>•</span>
                        <span>MST: <strong>{selectedCustomer.taxCode || 'Chưa cập nhật'}</strong></span>
                        <span>•</span>
                        <span>Loại: <strong>{selectedCustomer.customerType}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openHandoverModal(selectedCustomer)}
                        className="btn btn-secondary btn-sm"
                        title="Bàn giao khách hàng cho Sales khác"
                      >
                        <UserCheck size={14} color="#E53935" />
                        <span>Bàn giao</span>
                      </button>
                      {hasPermission('B_CUSTOMERS', 'update') && (
                        <button
                          onClick={() => openEditModal(selectedCustomer)}
                          className="btn btn-secondary btn-sm"
                        >
                          <span>Sửa</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '12.5px', color: '#4B5563', backgroundColor: '#F9FAFB', padding: '0.75rem', borderRadius: '0.5rem' }}>
                    <div>📞 <strong>Điện thoại:</strong> {selectedCustomer.phone}</div>
                    <div>👤 <strong>Liên hệ:</strong> {selectedCustomer.contactPerson || 'Chưa có'}</div>
                    <div>📍 <strong>Địa chỉ:</strong> {selectedCustomer.address || 'Chưa có'}</div>
                    <div>🚚 <strong>Giao hàng:</strong> {selectedCustomer.deliveryAddress || selectedCustomer.address || 'Chưa có'}</div>
                  </div>
                </div>

                {/* Lịch sử giao dịch (Timeline) */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                    🕒 Lịch sử giao dịch & Chăm sóc (Timeline)
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
                              backgroundColor: item.type === 'ORDER' ? '#DCFCE7' : item.type === 'QUOTATION' ? '#FEF3C7' : '#E0E7FF',
                              color: item.type === 'ORDER' ? '#16A34A' : item.type === 'QUOTATION' ? '#D97706' : '#4F46E5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {item.type === 'ORDER' ? <ShoppingBag size={16} /> : item.type === 'QUOTATION' ? <FileSpreadsheet size={16} /> : <UserCheck size={16} />}
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
                            {item.amount !== undefined && (
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
                            )}

                            {item.reason && (
                              <div style={{ fontSize: '12px', color: '#4B5563', fontStyle: 'italic' }}>
                                Lý do bàn giao: {item.reason} ({item.from} ➔ {item.to})
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
              <h3 style={{ fontSize: '12.5px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                💰 Tổng quan Công nợ
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
              <h3 style={{ fontSize: '12.5px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                📝 Ghi chú chăm sóc VPP
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                        className="table-th"
                        style={{
                          cursor: colKey !== 'actions' && colKey !== 'stt' ? 'grab' : 'default',
                          backgroundColor: dragOverCol === colKey ? '#FEE2E2' : undefined,
                          borderLeft: dragOverCol === colKey ? '3px solid #E53935' : undefined,
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          userSelect: 'none'
                        }}
                        title={colKey !== 'actions' && colKey !== 'stt' ? 'Kéo để đổi thứ tự cột' : undefined}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {colKey !== 'actions' && colKey !== 'stt' && (
                            <GripVertical size={13} style={{ color: '#9CA3AF', cursor: 'grab' }} />
                          )}
                          <span>{columnLabels[colKey] || colKey}</span>
                        </div>
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
                    const isSelected = c.id === selectedCustomerId;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomerId(c.id)}
                        style={{
                          backgroundColor: isSelected ? '#FFEBEE' : undefined,
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer'
                        }}
                      >
                        {columnOrder
                          .filter((colKey) => visibleColumns[colKey] !== false)
                          .map((colKey) => {
                            switch (colKey) {
                              case 'stt':
                                return (
                                  <td key={colKey} className="table-td" style={{ width: '45px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
                                    {idx + 1}
                                  </td>
                                );
                              case 'code':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontWeight: '600', color: '#E53935', fontSize: '12px' }}>
                                    {c.code}
                                  </td>
                                );
                              case 'name':
                                return (
                                  <td key={colKey} className="table-td">
                                    <div style={{ fontWeight: '700', color: '#111827' }}>{c.name}</div>
                                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{c.address || c.deliveryAddress || 'Chưa cập nhật địa chỉ'}</div>
                                  </td>
                                );
                              case 'phone':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontSize: '12.5px', color: '#374151' }}>
                                    📞 {c.phone}
                                  </td>
                                );
                              case 'taxCode':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontSize: '12px', color: '#4B5563', fontFamily: 'monospace' }}>
                                    {c.taxCode || '-'}
                                  </td>
                                );
                              case 'manager':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontSize: '12.5px', color: '#374151' }}>
                                    {c.manager?.fullName || 'Chưa gán'}
                                  </td>
                                );
                              case 'customerType':
                                return (
                                  <td key={colKey} className="table-td">
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
                              case 'creditBalance':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontWeight: '600', color: Number(c.creditBalance) > 0 ? '#15803D' : '#6B7280', fontSize: '12.5px' }}>
                                    {formatMoney(Number(c.creditBalance) || 0)}
                                  </td>
                                );
                              case 'source':
                                return (
                                  <td key={colKey} className="table-td" style={{ fontSize: '12px', color: '#6B7280' }}>
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
                                  <td key={colKey} className="table-td" style={{ fontWeight: '600', color: '#E53935', fontSize: '12.5px' }}>
                                    {c._count?.orders || 0} đơn
                                  </td>
                                );
                              case 'status':
                                return (
                                  <td key={colKey} className="table-td">
                                    <span className={c.status === 'ACTIVE' ? 'badge badge-green' : 'badge badge-red'}>
                                      {c.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                                    </span>
                                  </td>
                                );
                              case 'actions':
                                return (
                                  <td key={colKey} className="table-td">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => {
                                          handleSelectCustomer(c.id);
                                          setViewMode('split');
                                        }}
                                        className="btn btn-secondary btn-sm"
                                        style={{ fontSize: '11px', padding: '0.25rem 0.5rem' }}
                                        title="Xem chi tiết & timeline dạng 3 phần"
                                      >
                                        <Eye size={12} color="#E53935" />
                                        <span>Chi tiết</span>
                                      </button>
                                      {hasPermission('B_CUSTOMERS', 'update') && (
                                        <button
                                          onClick={() => openEditModal(c)}
                                          className="btn btn-secondary btn-sm"
                                          style={{ fontSize: '11px', padding: '0.25rem 0.5rem' }}
                                        >
                                          <span>Sửa</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => openHandoverModal(c)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ fontSize: '11px', padding: '0.25rem 0.5rem' }}
                                        title="Bàn giao khách hàng"
                                      >
                                        <UserCheck size={12} color="#E53935" />
                                        <span>Bàn giao</span>
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
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
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
                      <div style={{ fontSize: '11.5px', color: '#DC2626', marginTop: '0.25rem', fontWeight: '500' }}>
                        {phoneWarning}
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
                      <div style={{ fontSize: '11.5px', color: '#DC2626', marginTop: '0.25rem', fontWeight: '500' }}>
                        {taxWarning}
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
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BÀN GIAO KHÁCH HÀNG */}
      {isHandoverModalOpen && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
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
                <button type="submit" className="btn btn-primary">
                  Xác nhận bàn giao
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
    </div>
  );
};
