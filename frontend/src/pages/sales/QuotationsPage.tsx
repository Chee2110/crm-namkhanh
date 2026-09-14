import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Printer,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  Eye,
  Building,
  Calendar,
  X,
  UserPlus,
  Columns,
  RotateCcw,
  GripVertical
} from 'lucide-react';
import { api } from '../../services/api';
import { Quotation, Customer, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { QuotationPrintModal } from './components/QuotationPrintModal';

export const QuotationsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Tùy biến cột & Kéo thả (Drag & Drop)
  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    customer: true,
    date: true,
    validUntil: true,
    manager: true,
    totalAmount: true,
    status: true,
    actions: true
  };

  const defaultColOrder = [
    'stt',
    'code',
    'customer',
    'date',
    'validUntil',
    'manager',
    'totalAmount',
    'status',
    'actions'
  ];

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_quotations_visible_cols');
      return saved ? JSON.parse(saved) : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_quotations_col_order');
      return saved ? JSON.parse(saved) : defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'Số báo giá',
    customer: 'Khách hàng',
    date: 'Ngày lập',
    validUntil: 'Hiệu lực đến',
    manager: 'Người phụ trách',
    totalAmount: 'Tổng tiền (VNĐ)',
    status: 'Tình trạng',
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
      localStorage.setItem('namkhanh_quotations_col_order', JSON.stringify(newOrder));
    }

    setDraggedCol(null);
    setDragOverCol(null);
  };

  const toggleColumnVisibility = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    localStorage.setItem('namkhanh_quotations_visible_cols', JSON.stringify(updated));
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    localStorage.removeItem('namkhanh_quotations_visible_cols');
    localStorage.removeItem('namkhanh_quotations_col_order');
  };

  // Modal Create / Edit Quotation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: '',
    status: 'DRAFT',
    vatRate: 8,
    notes: '',
    items: [] as Array<{
      productId: string;
      productCode: string;
      productName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
    }>
  });

  // Modal Print / Preview A4
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Modal Tạo nhanh Khách hàng mới trong Form Báo giá
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [quickCustomerError, setQuickCustomerError] = useState<string | null>(null);
  const [quickCustomerLoading, setQuickCustomerLoading] = useState(false);
  const [quickCustomerData, setQuickCustomerData] = useState({
    name: '',
    phone: '',
    taxCode: '',
    address: '',
    customerType: 'ENTERPRISE',
    contactPerson: '',
    email: ''
  });

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomerData.name.trim() || !quickCustomerData.phone.trim()) {
      setQuickCustomerError('Tên khách hàng và Số điện thoại là bắt buộc');
      return;
    }

    try {
      setQuickCustomerLoading(true);
      setQuickCustomerError(null);
      const res = await api.post<Customer>('/customers', {
        ...quickCustomerData,
        source: 'SELF_FOUND'
      });

      if (res.data) {
        const newCust = res.data;
        setCustomers((prev) => [newCust, ...prev]);
        setFormData((prev) => ({ ...prev, customerId: newCust.id }));
        setIsQuickCustomerModalOpen(false);
        setQuickCustomerData({
          name: '',
          phone: '',
          taxCode: '',
          address: '',
          customerType: 'ENTERPRISE',
          contactPerson: '',
          email: ''
        });
      }
    } catch (err: any) {
      setQuickCustomerError(err.response?.data?.message || err.message || 'Lỗi khi tạo nhanh khách hàng');
    } finally {
      setQuickCustomerLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);

      const [resQuotes, resCust, resProds] = await Promise.all([
        api.get<Quotation[]>(`/quotations?${query.toString()}`),
        api.get<Customer[]>('/customers'),
        api.get<Product[]>('/products')
      ]);

      setQuotations(resQuotes.data || []);
      setCustomers(resCust.data || []);
      setProducts(resProds.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const openAddModal = () => {
    setFormData({
      customerId: customers[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'DRAFT',
      vatRate: 8,
      notes: 'Báo giá đã bao gồm chi phí vận chuyển tận nơi trong nội thành Hà Nội.',
      items: [
        {
          productId: products[0]?.id || '',
          productCode: products[0]?.code || 'SP-GIAY-01',
          productName: products[0]?.name || 'Giấy in Double A A4 70gsm',
          unit: products[0]?.unit || 'Ream',
          quantity: 50,
          unitPrice: products[0]?.sellingPrice || 82000,
          vatRate: 8
        }
      ]
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: defaultProd?.id || '',
          productCode: defaultProd?.code || '',
          productName: defaultProd?.name || '',
          unit: defaultProd?.unit || 'Cái',
          quantity: 1,
          unitPrice: defaultProd?.sellingPrice || 0,
          vatRate: prev.vatRate
        }
      ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      if (field === 'productId') {
        const prod = products.find((p) => p.id === value);
        if (prod) {
          updated[index] = {
            ...updated[index],
            productId: prod.id,
            productCode: prod.code,
            productName: prod.name,
            unit: prod.unit,
            unitPrice: Number(prod.sellingPrice) || 0,
            vatRate: prod.vatRate || prev.vatRate
          };
        }
      } else {
        updated[index] = {
          ...updated[index],
          [field]: field === 'quantity' || field === 'unitPrice' || field === 'vatRate' ? Number(value) : value
        };
      }
      return { ...prev, items: updated };
    });
  };

  // Tính tổng
  const subtotal = formData.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const vatAmount = (subtotal * formData.vatRate) / 100;
  const totalAmount = subtotal + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setFormError('Vui lòng chọn khách hàng');
      return;
    }
    if (formData.items.length === 0) {
      setFormError('Báo giá phải có ít nhất 1 mặt hàng');
      return;
    }

    try {
      await api.post('/quotations', formData);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Lỗi khi tạo báo giá');
    }
  };

  const handleConvertToOrder = async (quote: Quotation) => {
    if (quote.status !== 'CONFIRMED') {
      alert('Chỉ có thể chuyển đổi Báo giá ở trạng thái "Đã chốt" (CONFIRMED) thành Đơn hàng.');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn chuyển Báo giá [${quote.code}] thành Đơn hàng mới không?`)) {
      return;
    }

    try {
      await api.post(`/quotations/${quote.id}/convert-to-order`);
      alert('Đã chuyển đổi thành Đơn hàng thành công! Vui lòng kiểm tra trang Đơn hàng.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi chuyển đổi đơn hàng');
    }
  };

  const handleStatusChange = async (quoteId: string, newStatus: string) => {
    try {
      await api.put(`/quotations/${quoteId}`, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const formatMoney = (val?: number) => {
    return (val || 0).toLocaleString('vi-VN') + ' đ';
  };

  const handleExportExcel = () => {
    if (quotations.length === 0) {
      alert('Không có dữ liệu báo giá để xuất');
      return;
    }

    const headers = [
      'STT',
      'Số báo giá',
      'Khách hàng',
      'Điện thoại',
      'Người phụ trách',
      'Ngày báo giá',
      'Hiệu lực đến',
      'Cộng tiền hàng',
      'VAT (%)',
      'Tiền thuế VAT',
      'Tổng tiền (VNĐ)',
      'Tình trạng',
      'Ghi chú'
    ];

    const rows = quotations.map((q, idx) => [
      idx + 1,
      q.code,
      `"${(q.customer?.name || '').replace(/"/g, '""')}"`,
      `"${q.customer?.phone || ''}"`,
      `"${(q.manager?.fullName || '').replace(/"/g, '""')}"`,
      new Date(q.date).toLocaleDateString('vi-VN'),
      q.validUntil ? new Date(q.validUntil).toLocaleDateString('vi-VN') : '',
      q.subtotal,
      q.vatRate,
      q.vatAmount,
      q.totalAmount,
      q.status,
      `"${(q.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Gia_Nam_Khanh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSingleQuotationExcel = (q: Quotation) => {
    const quotationDate = new Date(q.date);
    const validUntilDate = q.validUntil
      ? new Date(q.validUntil)
      : new Date(quotationDate.getTime() + 15 * 24 * 60 * 60 * 1000);

    const headers = [
      'STT',
      'Mã hàng',
      'Tên sản phẩm / quy cách',
      'Đơn vị tính',
      'Số lượng',
      'Đơn giá (VNĐ)',
      'Thuế VAT (%)',
      'Thành tiền (VNĐ)'
    ];

    const rows = (q.items || []).map((it, idx) => [
      idx + 1,
      `"${it.productCode}"`,
      `"${(it.productName || '').replace(/"/g, '""')}"`,
      `"${it.unit}"`,
      it.quantity,
      it.unitPrice,
      `"${it.vatRate !== undefined ? it.vatRate : q.vatRate}%"`,
      it.total || it.quantity * it.unitPrice
    ]);

    const lines = [
      '\uFEFFBẢNG BÁO GIÁ VĂN PHÒNG PHẨM & THIẾT BỊ VĂN PHÒNG - CÔNG TY TNHH TM&DV NAM KHÁNH',
      `Số báo giá: ${q.code}`,
      `Ngày báo giá: ${quotationDate.toLocaleDateString('vi-VN')}`,
      `Hiệu lực đến: ${validUntilDate.toLocaleDateString('vi-VN')}`,
      `Khách hàng: ${(q.customer?.name || '').replace(/"/g, '""')}`,
      `Mã số thuế: ${q.customer?.taxCode || ''}`,
      `Người liên hệ: ${(q.customer?.contactPerson || '').replace(/"/g, '""')}`,
      `Số điện thoại: ${q.customer?.phone || ''}`,
      `Địa chỉ giao hàng: ${(q.customer?.deliveryAddress || q.customer?.address || '').replace(/"/g, '""')}`,
      `Người phụ trách: ${(q.manager?.fullName || '').replace(/"/g, '""')}`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      `Cộng tiền hàng: ${Number(q.subtotal).toLocaleString('vi-VN')} VNĐ`,
      `Thuế GTGT (${q.vatRate}%): ${Number(q.vatAmount).toLocaleString('vi-VN')} VNĐ`,
      `Tổng cộng thanh toán: ${Number(q.totalAmount).toLocaleString('vi-VN')} VNĐ`,
      `Ghi chú: ${(q.notes || '').replace(/"/g, '""')}`
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Gia_${q.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="badge badge-gray">Bản thảo</span>;
      case 'NEGOTIATING':
        return <span className="badge badge-yellow">Đang đàm phán</span>;
      case 'SENT':
        return <span className="badge badge-blue">Đã gửi</span>;
      case 'CONFIRMED':
        return <span className="badge badge-green">Đã chốt</span>;
      case 'CANCELLED':
        return <span className="badge badge-red">Đã hủy</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Thanh công cụ */}
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
              placeholder="Tìm theo số báo giá, tên khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="DRAFT">Bản thảo</option>
            <option value="NEGOTIATING">Đang đàm phán</option>
            <option value="SENT">Đã gửi</option>
            <option value="CONFIRMED">Đã chốt</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
          {/* Nút Tùy chỉnh cột */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowColumnConfig(!showColumnConfig)}
              className="btn btn-secondary"
              title="Tùy biến hiển thị các cột trên bảng"
            >
              <Columns size={16} />
              <span>Tùy chỉnh cột</span>
            </button>

            {showColumnConfig && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '0.5rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #E5E7EB',
                  padding: '1rem',
                  width: '240px',
                  zIndex: 50
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: '#111827' }}>Cột hiển thị</span>
                  <button
                    onClick={resetColumns}
                    style={{ background: 'none', border: 'none', color: '#E53935', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    <RotateCcw size={11} />
                    <span>Mặc định</span>
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {columnOrder.map((key) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={visibleColumns[key] ?? true}
                        onChange={() => toggleColumnVisibility(key)}
                        disabled={key === 'code' || key === 'customer'}
                        style={{ accentColor: '#E53935' }}
                      />
                      <span>{columnLabels[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleExportExcel} className="btn btn-secondary" title="Xuất danh sách báo giá ra file Excel">
            <FileSpreadsheet size={16} />
            <span>Xuất Excel</span>
          </button>

          {hasPermission('B_QUOTATIONS', 'create') && (
            <button onClick={openAddModal} className="btn btn-primary">
              <Plus size={16} />
              <span>Lập báo giá mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Bảng danh sách Báo giá kèm Kéo thả thứ tự cột (Drag & Drop) */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              {columnOrder
                .filter((k) => visibleColumns[k])
                .map((colKey) => (
                  <th
                    key={colKey}
                    draggable
                    onDragStart={(e) => handleDragStart(e, colKey)}
                    onDragOver={(e) => handleDragOver(e, colKey)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, colKey)}
                    style={{
                      cursor: 'grab',
                      userSelect: 'none',
                      backgroundColor: dragOverCol === colKey ? '#FEE2E2' : undefined,
                      borderLeft: dragOverCol === colKey ? '3px solid #E53935' : undefined,
                      opacity: draggedCol === colKey ? 0.5 : 1,
                      textAlign:
                        colKey === 'stt' || colKey === 'status' || colKey === 'actions'
                          ? 'center'
                          : colKey === 'totalAmount'
                          ? 'right'
                          : 'left',
                      width: colKey === 'stt' ? '60px' : colKey === 'actions' ? '220px' : undefined
                    }}
                    title="Kéo thả để thay đổi vị trí cột"
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        justifyContent:
                          colKey === 'stt' || colKey === 'status' || colKey === 'actions'
                            ? 'center'
                            : colKey === 'totalAmount'
                            ? 'flex-end'
                            : 'flex-start'
                      }}
                    >
                      <GripVertical size={12} style={{ color: '#9CA3AF', opacity: 0.7 }} />
                      <span>{columnLabels[colKey]}</span>
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columnOrder.filter((k) => visibleColumns[k]).length}
                  style={{ textAlign: 'center', padding: '2.5rem', color: '#9CA3AF' }}
                >
                  Đang tải danh sách báo giá...
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td
                  colSpan={columnOrder.filter((k) => visibleColumns[k]).length}
                  style={{ textAlign: 'center', padding: '2.5rem', color: '#9CA3AF' }}
                >
                  Chưa có báo giá nào trong hệ thống
                </td>
              </tr>
            ) : (
              quotations.map((q, idx) => (
                <tr key={q.id}>
                  {columnOrder
                    .filter((k) => visibleColumns[k])
                    .map((colKey) => {
                      switch (colKey) {
                        case 'stt':
                          return (
                            <td key={colKey} style={{ textAlign: 'center', color: '#6B7280' }}>
                              {idx + 1}
                            </td>
                          );
                        case 'code':
                          return (
                            <td key={colKey}>
                              <span style={{ fontWeight: '700', color: '#E53935' }}>{q.code}</span>
                            </td>
                          );
                        case 'customer':
                          return (
                            <td key={colKey}>
                              <div style={{ fontWeight: '600', color: '#111827' }}>{q.customer.name}</div>
                              <div style={{ fontSize: '11.5px', color: '#6B7280' }}>
                                SĐT: {q.customer.phone} {q.customer.taxCode ? `• MST: ${q.customer.taxCode}` : ''}
                              </div>
                            </td>
                          );
                        case 'date':
                          return (
                            <td key={colKey} style={{ fontSize: '12.5px', color: '#4B5563' }}>
                              {new Date(q.date).toLocaleDateString('vi-VN')}
                            </td>
                          );
                        case 'validUntil':
                          return (
                            <td key={colKey} style={{ fontSize: '12.5px', color: '#4B5563' }}>
                              {q.validUntil ? new Date(q.validUntil).toLocaleDateString('vi-VN') : '--'}
                            </td>
                          );
                        case 'manager':
                          return (
                            <td key={colKey} style={{ fontSize: '12.5px', color: '#374151' }}>
                              {q.manager?.fullName || 'Chưa gán'}
                            </td>
                          );
                        case 'totalAmount':
                          return (
                            <td
                              key={colKey}
                              style={{
                                textAlign: 'right',
                                fontWeight: '700',
                                color: '#111827',
                                fontSize: '13.5px'
                              }}
                            >
                              {formatMoney(q.totalAmount)}
                            </td>
                          );
                        case 'status':
                          return (
                            <td key={colKey} style={{ textAlign: 'center' }}>
                              {getStatusBadge(q.status)}
                            </td>
                          );
                        case 'actions':
                          return (
                            <td key={colKey} style={{ textAlign: 'center' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.35rem'
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedQuotation(q);
                                    setIsPrintModalOpen(true);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  title="Xem chi tiết & Mẫu in A4"
                                >
                                  <Printer size={14} />
                                </button>
                                <button
                                  onClick={() => handleExportSingleQuotationExcel(q)}
                                  className="btn btn-secondary btn-sm"
                                  title="Xuất file Excel báo giá này"
                                >
                                  <FileSpreadsheet size={14} color="#16A34A" />
                                </button>
                                {q.status === 'CONFIRMED' && (
                                  <button
                                    onClick={() => handleConvertToOrder(q)}
                                    className="btn btn-primary btn-sm"
                                    title="Tạo Đơn hàng từ Báo giá này"
                                    style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}
                                  >
                                    <ShoppingBag size={14} />
                                    <span>Tạo đơn</span>
                                  </button>
                                )}
                                {q.status === 'DRAFT' && (
                                  <button
                                    onClick={() => handleStatusChange(q.id, 'SENT')}
                                    className="btn btn-secondary btn-sm"
                                    title="Đánh dấu đã gửi khách"
                                  >
                                    <Send size={13} color="#2563EB" />
                                  </button>
                                )}
                                {q.status === 'SENT' && (
                                  <button
                                    onClick={() => handleStatusChange(q.id, 'CONFIRMED')}
                                    className="btn btn-secondary btn-sm"
                                    title="Chốt báo giá thành công"
                                  >
                                    <CheckCircle2 size={13} color="#16A34A" />
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL TẠO BÁO GIÁ MỚI */}
      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="modal-content bg-white rounded-xl shadow-2xl w-full relative z-[1001] max-h-[90vh] overflow-y-auto" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>
                Lập Báo giá Văn phòng phẩm mới
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '75vh', overflowY: 'auto' }}>
                {formError && (
                  <div style={{ padding: '0.625rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '0.375rem', fontSize: '13px' }}>
                    {formError}
                  </div>
                )}

                {/* Thông tin khách hàng & ngày lập */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: '500' }}>Khách hàng *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickCustomerError(null);
                          setIsQuickCustomerModalOpen(true);
                        }}
                        className="text-[#E53935] hover:text-[#C62828] text-xs font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-none"
                        title="Tạo nhanh khách hàng mới trực tiếp tại đây"
                      >
                        <UserPlus size={13} />
                        <span>+ Tạo nhanh KH</span>
                      </button>
                    </div>
                    <select
                      className="input"
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn khách hàng nhận báo giá --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) - {c.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Ngày báo giá</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Hiệu lực đến</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                </div>

                {/* BẢNG DANH SÁCH MẶT HÀNG VĂN PHÒNG PHẨM */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#374151' }}>
                      Danh mục hàng hóa báo giá ({formData.items.length})
                    </span>
                    <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
                      <Plus size={14} />
                      <span>Thêm dòng sản phẩm</span>
                    </button>
                  </div>

                  <table className="table" style={{ border: '1px solid #E5E7EB', borderRadius: '0.5rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB' }}>
                        <th style={{ width: '40px' }}>STT</th>
                        <th style={{ width: '320px' }}>Tên sản phẩm VPP</th>
                        <th style={{ width: '80px' }}>ĐVT</th>
                        <th style={{ width: '100px' }}>Số lượng</th>
                        <th style={{ width: '130px' }}>Đơn giá (VNĐ)</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>Thành tiền</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((it, idx) => {
                        const itemAmount = it.quantity * it.unitPrice;
                        return (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', color: '#6B7280' }}>{idx + 1}</td>
                            <td>
                              <select
                                className="input"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '12.5px' }}
                                value={it.productId}
                                onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    [{p.code}] {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '12.5px' }}
                                value={it.unit}
                                onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                className="input"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '12.5px' }}
                                value={it.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                className="input"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '12.5px' }}
                                value={it.unitPrice}
                                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                              />
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                              {formatMoney(itemAmount)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {formData.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Tổng kết tiền */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '320px', backgroundColor: '#FAFAFA', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Cộng tiền hàng:</span>
                      <strong>{formatMoney(subtotal)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span>Thuế suất VAT:</span>
                      <select
                        className="input"
                        style={{ width: '80px', padding: '0.25rem 0.5rem' }}
                        value={formData.vatRate}
                        onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                      >
                        <option value="8">8%</option>
                        <option value="10">10%</option>
                        <option value="0">0%</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
                      <span>Tiền thuế VAT:</span>
                      <span>{formatMoney(vatAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '700', color: '#E53935', paddingTop: '0.5rem', borderTop: '1px solid #E5E7EB' }}>
                      <span>TỔNG CỘNG:</span>
                      <span>{formatMoney(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', marginBottom: '0.25rem' }}>Ghi chú / Điều khoản giao hàng</label>
                  <textarea
                    className="input"
                    rows={2}
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
                  Lưu & Tạo Báo Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO NHANH KHÁCH HÀNG MỚI */}
      {isQuickCustomerModalOpen && (
        <div className="modal-overlay fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" style={{ zIndex: 1100 }}>
          <div className="modal-content bg-white rounded-xl shadow-2xl w-full relative z-[1101] max-h-[90vh] overflow-y-auto" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} color="#E53935" />
                <span>Tạo Nhanh Khách Hàng Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickCustomerModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickCreateCustomer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {quickCustomerError && (
                  <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '0.375rem', fontSize: '12.5px' }}>
                    {quickCustomerError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.2rem' }}>
                    Tên công ty / Tên khách hàng *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Công ty Cổ phần Xây dựng Hà Nội..."
                    className="input"
                    value={quickCustomerData.name}
                    onChange={(e) => setQuickCustomerData({ ...quickCustomerData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.2rem' }}>
                      Số điện thoại *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0912..."
                      className="input"
                      value={quickCustomerData.phone}
                      onChange={(e) => setQuickCustomerData({ ...quickCustomerData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.2rem' }}>
                      Mã số thuế
                    </label>
                    <input
                      type="text"
                      placeholder="0108..."
                      className="input"
                      value={quickCustomerData.taxCode}
                      onChange={(e) => setQuickCustomerData({ ...quickCustomerData, taxCode: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.2rem' }}>
                      Người liên hệ
                    </label>
                    <input
                      type="text"
                      placeholder="Anh Tuấn / Chị Mai..."
                      className="input"
                      value={quickCustomerData.contactPerson}
                      onChange={(e) => setQuickCustomerData({ ...quickCustomerData, contactPerson: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.2rem' }}>
                      Loại khách hàng
                    </label>
                    <select
                      className="input"
                      value={quickCustomerData.customerType}
                      onChange={(e) => setQuickCustomerData({ ...quickCustomerData, customerType: e.target.value })}
                    >
                      <option value="ENTERPRISE">Doanh nghiệp</option>
                      <option value="HOUSEHOLD">Hộ kinh doanh</option>
                      <option value="ORGANIZATION">Cơ quan tổ chức</option>
                      <option value="SCHOOL">Trường học</option>
                      <option value="INDIVIDUAL">Cá nhân</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '0.2rem' }}>
                    Địa chỉ giao nhận
                  </label>
                  <input
                    type="text"
                    placeholder="Số nhà, đường, quận/huyện..."
                    className="input"
                    value={quickCustomerData.address}
                    onChange={(e) => setQuickCustomerData({ ...quickCustomerData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsQuickCustomerModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={quickCustomerLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={quickCustomerLoading}
                >
                  {quickCustomerLoading ? 'Đang tạo...' : 'Lưu & Chọn khách này'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MẪU IN BÁO GIÁ A4 CHUẨN NAM KHÁNH */}
      <QuotationPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        quotation={selectedQuotation}
      />
    </div>
  );
};
