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
  GripVertical,
  ArrowLeft,
  Edit2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { Quotation, Customer, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { QuotationPrintModal } from './components/QuotationPrintModal';
import { ImportItemsModal } from '../../components/common/ImportItemsModal';
import { useTableResize } from '../../hooks/useTableResize';
import { ProductSearchSelect } from '../../components/common/ProductSearchSelect';
import { Toast } from '../../components/common/Toast';
import { StatusBadgeDropdown, StatusOption } from '../../components/common/StatusBadgeDropdown';
import { ColumnCustomizerDropdown } from '../../components/common/ColumnCustomizerDropdown';

const QUOTATION_STATUS_OPTIONS: StatusOption[] = [
  { value: 'DRAFT', label: 'Bản thảo', colorClass: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'NEGOTIATING', label: 'Đang đàm phán', colorClass: 'bg-amber-50 text-amber-700 border-amber-300' },
  { value: 'SENT', label: 'Đã gửi', colorClass: 'bg-blue-50 text-blue-700 border-blue-300' },
  { value: 'CONFIRMED', label: 'Đã chốt', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  { value: 'ORDERED', label: 'Đã lên đơn', colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-300', disabled: true },
  { value: 'CANCELLED', label: 'Đã hủy', colorClass: 'bg-red-50 text-red-700 border-red-300' }
];

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

  const defaultQuotationWidths: Record<string, number> = {
    stt: 60,
    code: 150,
    customer: 280,
    date: 130,
    validUntil: 150,
    manager: 160,
    totalAmount: 170,
    status: 140,
    actions: 220
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'quotations_v3',
    defaultWidths: defaultQuotationWidths,
    minWidth: 60,
    minWidths: {
      stt: 50,
      code: 120,
      customer: 180,
      date: 110,
      validUntil: 130,
      manager: 140,
      totalAmount: 150,
      status: 120,
      actions: 180
    }
  });

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

  const handleReorderColumns = (newOrder: string[]) => {
    setColumnOrder(newOrder);
    localStorage.setItem('namkhanh_quotations_col_order', JSON.stringify(newOrder));
  };

  const toggleColumnVisibility = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    localStorage.setItem('namkhanh_quotations_visible_cols', JSON.stringify(updated));
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    localStorage.removeItem('namkhanh_quotations_visible_cols');
    localStorage.removeItem('namkhanh_quotations_col_order');
  };

  // Trang Tạo Báo giá mới (thay thế modal popup thành trang riêng)
  const [isCreatePage, setIsCreatePage] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);
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
  const [isImportItemsModalOpen, setIsImportItemsModalOpen] = useState(false);

  // Modal xác nhận hủy bỏ soạn thảo báo giá (tránh mất dữ liệu)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);

  const isFormDirty = () => {
    return Boolean(
      formData.customerId ||
      formData.items.length > 0 ||
      formData.notes?.trim()
    );
  };

  const handleCancelCreate = () => {
    if (isFormDirty()) {
      setIsDiscardModalOpen(true);
    } else {
      setIsCreatePage(false);
      setEditingQuotation(null);
    }
  };

  const handleConfirmDiscard = () => {
    setIsDiscardModalOpen(false);
    setIsCreatePage(false);
    setEditingQuotation(null);
  };

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

  const renderQuickCustomerModal = () => {
    if (!isQuickCustomerModalOpen) return null;
    return (
      <div className="modal-overlay fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" style={{ zIndex: 1100 }}>
        <div className="modal-content bg-white rounded-xl shadow-2xl w-full relative z-[1101] max-h-[90vh] overflow-y-auto" style={{ maxWidth: '540px' }}>
          <div className="modal-header">
            <h3 style={{ margin: 0, fontSize: '1.155rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '0.375rem', fontSize: '13.75px' }}>
                  {quickCustomerError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13.2px', fontWeight: '600', marginBottom: '0.2rem' }}>
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
                  <label style={{ display: 'block', fontSize: '13.2px', fontWeight: '600', marginBottom: '0.2rem' }}>
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
                  <label style={{ display: 'block', fontSize: '13.2px', fontWeight: '600', marginBottom: '0.2rem' }}>
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
                  <label style={{ display: 'block', fontSize: '13.2px', fontWeight: '600', marginBottom: '0.2rem' }}>
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
                  <label style={{ display: 'block', fontSize: '13.2px', fontWeight: '600', marginBottom: '0.2rem' }}>
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
                <label style={{ display: 'block', fontSize: '13.2px', fontWeight: '600', marginBottom: '0.2rem' }}>
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
    );
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
    setEditingQuotation(null);
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
    setIsCreatePage(true);
  };

  const openEditModal = (q: Quotation) => {
    setEditingQuotation(q);
    setFormData({
      customerId: q.customerId,
      date: q.date ? new Date(q.date).toISOString().split('T')[0] : '',
      validUntil: q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : '',
      status: q.status || 'DRAFT',
      vatRate: q.vatRate ?? 8,
      notes: q.notes || '',
      items: (q.items && q.items.length > 0)
        ? q.items.map((it) => ({
            productId: it.productId || '',
            productCode: it.productCode,
            productName: it.productName,
            unit: it.unit,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            vatRate: it.vatRate !== undefined ? Number(it.vatRate) : (q.vatRate ?? 8)
          }))
        : []
    });
    setFormError(null);
    setIsPrintModalOpen(false);
    setSelectedQuotation(null);
    setIsCreatePage(true);
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn báo giá [${code}] không?`)) {
      return;
    }
    try {
      await api.delete(`/quotations/${id}`);
      setToastMessage(`Đã xóa thành công báo giá [${code}]!`);
      setIsPrintModalOpen(false);
      setSelectedQuotation(null);
      if (isCreatePage && editingQuotation?.id === id) {
        setIsCreatePage(false);
        setEditingQuotation(null);
      }
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa báo giá');
    }
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

  const handleBulkImportItems = (importedItems: any[]) => {
    setFormData((prev) => {
      const validExisting = prev.items.filter((it) => it.productId || it.productCode);
      return {
        ...prev,
        items: [...validExisting, ...importedItems]
      };
    });
    setToastMessage(`Đã nhập thành công ${importedItems.length} sản phẩm từ file Excel/CSV!`);
  };

  const handleProductSelect = (index: number, product: Product) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        unit: product.unit || 'Cái',
        unitPrice: Number(product.sellingPrice) || 0
      };
      return { ...prev, items: updated };
    });
  };

  const handleQuickAddProduct = (product: Product) => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          unit: product.unit || 'Cái',
          quantity: 1,
          unitPrice: Number(product.sellingPrice) || 0,
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
      setIsSubmitting(true);
      if (editingQuotation) {
        await api.put(`/quotations/${editingQuotation.id}`, formData);
        setToastMessage('Đã cập nhật thành công');
      } else {
        await api.post('/quotations', formData);
      }
      setIsCreatePage(false);
      setEditingQuotation(null);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Lỗi khi lưu báo giá');
    } finally {
      setIsSubmitting(false);
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
      setConvertingQuoteId(quote.id);
      await api.post(`/quotations/${quote.id}/convert-to-order`);
      alert('Đã chuyển đổi thành Đơn hàng thành công! Vui lòng kiểm tra trang Đơn hàng.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi chuyển đổi đơn hàng');
    } finally {
      setConvertingQuoteId(null);
    }
  };

  const handleStatusChange = async (quoteId: string, newStatus: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    try {
      setQuotations((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus as any } : q))
      );
      await api.put(`/quotations/${quoteId}`, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
      loadData();
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
      case 'ORDERED':
        return (
          <span
            className="badge"
            style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}
          >
            Đã lên đơn
          </span>
        );
      case 'CANCELLED':
        return <span className="badge badge-red">Đã hủy</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  if (isCreatePage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {/* Thanh tiêu đề & Điều hướng trang Tạo Báo Giá */}
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleCancelCreate}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer"
              title="Quay lại danh sách báo giá"
            >
              <ArrowLeft size={16} />
              <span>Quay lại</span>
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.21rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileSpreadsheet size={20} color="#E53935" />
                <span>{editingQuotation ? `Chỉnh Sửa Báo Giá [${editingQuotation.code}]` : 'Lập Báo Giá Văn Phòng Phẩm Mới'}</span>
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '13.2px', color: '#6B7280' }}>
                {editingQuotation
                  ? 'Cập nhật thông tin khách hàng, thời hạn hiệu lực và danh mục các sản phẩm báo giá'
                  : 'Nhập thông tin khách hàng, thời hạn hiệu lực và danh mục các sản phẩm báo giá'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {editingQuotation && hasPermission('B_QUOTATIONS', 'delete') && (
              <button
                type="button"
                onClick={() => handleDelete(editingQuotation.id, editingQuotation.code)}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                title="Xóa báo giá này"
              >
                <Trash2 size={15} />
                <span>Xóa báo giá</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleCancelCreate}
              className="btn btn-secondary btn-sm cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-primary btn-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Đang lưu báo giá...</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>{editingQuotation ? 'Cập nhật Báo Giá' : 'Lưu & Tạo Báo Giá'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card Form Nhập Liệu Báo Giá */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {formError && (
              <div style={{ padding: '0.625rem 1rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '0.375rem', fontSize: '14.3px' }}>
                {formError}
              </div>
            )}

            {/* Thông tin khách hàng & ngày lập */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '13.75px', fontWeight: '600', color: '#374151' }}>Khách hàng nhận báo giá *</label>
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
                <label style={{ display: 'block', fontSize: '13.75px', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>Ngày báo giá</label>
                <input
                  type="date"
                  className="input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.75px', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>Hiệu lực đến ngày</label>
                <input
                  type="date"
                  className="input"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>

              {editingQuotation && (
                <div>
                  <label style={{ display: 'block', fontSize: '13.75px', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>Trạng thái báo giá</label>
                  <select
                    className="input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="DRAFT">Bản thảo</option>
                    <option value="NEGOTIATING">Đang đàm phán</option>
                    <option value="SENT">Đã gửi</option>
                    <option value="CONFIRMED">Đã chốt</option>
                    <option value="ORDERED">Đã lên đơn</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
              )}
            </div>

            {/* BẢNG DANH SÁCH MẶT HÀNG VĂN PHÒNG PHẨM */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem', backgroundColor: '#F9FAFB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: '700', fontSize: '14.85px', color: '#1F2937' }}>
                  Danh mục hàng hóa báo giá ({formData.items.length})
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '480px', justifyContent: 'flex-end' }}>
                  <ProductSearchSelect
                    products={products}
                    onSelect={handleQuickAddProduct}
                    placeholder="+ Tìm kiếm & thêm nhanh sản phẩm..."
                    clearOnSelect={true}
                    minWidth={360}
                  />
                  <button
                    type="button"
                    onClick={() => setIsImportItemsModalOpen(true)}
                    className="btn btn-secondary btn-sm flex items-center gap-1 shrink-0 text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
                    title="Nhập danh sách sản phẩm từ file Excel hoặc CSV"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    <span>Nhập Excel/CSV</span>
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                      <th style={{ minWidth: '300px', textAlign: 'center' }}>Tên sản phẩm VPP (Nhập tìm kiếm)</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>ĐVT</th>
                      <th style={{ width: '110px', textAlign: 'center' }}>Số lượng</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Đơn giá (VNĐ)</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>Thành tiền</th>
                      <th style={{ width: '50px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((it, idx) => {
                      const itemAmount = it.quantity * it.unitPrice;
                      return (
                        <tr key={idx} style={{ borderTop: '1px solid #F3F4F6' }}>
                          <td style={{ textAlign: 'center', color: '#6B7280' }}>{idx + 1}</td>
                          <td style={{ padding: '0.35rem 0.5rem', minWidth: '300px' }}>
                            <ProductSearchSelect
                              products={products}
                              selectedProductId={it.productId}
                              valueDisplay={it.productName ? `[${it.productCode}] ${it.productName}` : ''}
                              onSelect={(product) => handleProductSelect(idx, product)}
                              placeholder="Nhập tên hoặc mã sản phẩm..."
                              minWidth={320}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input"
                              style={{ padding: '0.4rem 0.5rem', fontSize: '13.75px', textAlign: 'center' }}
                              value={it.unit}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              className="input"
                              style={{ padding: '0.4rem 0.5rem', fontSize: '13.75px', textAlign: 'center' }}
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
                              style={{ padding: '0.4rem 0.5rem', fontSize: '13.75px', textAlign: 'center' }}
                              value={it.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '600', color: '#111827' }}>
                            {formatMoney(itemAmount)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                                title="Xóa dòng"
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

              {/* Nút Thêm dòng được chuyển xuống dưới bảng */}
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 shrink-0"
                  title="Thêm dòng sản phẩm"
                >
                  <Plus size={14} />
                  <span>Thêm dòng</span>
                </button>
              </div>
            </div>

            {/* Tổng kết tiền & Ghi chú */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13.75px', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>
                  Ghi chú / Điều khoản giao hàng
                </label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Ví dụ: Báo giá đã bao gồm chi phí vận chuyển tận nơi trong nội thành Hà Nội..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', maxWidth: '360px', backgroundColor: '#FAFAFA', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14.3px' }}>
                    <span style={{ color: '#4B5563' }}>Cộng tiền hàng:</span>
                    <strong style={{ color: '#111827' }}>{formatMoney(subtotal)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14.3px' }}>
                    <span style={{ color: '#4B5563' }}>Thuế suất VAT:</span>
                    <select
                      className="input"
                      style={{ width: '85px', padding: '0.25rem 0.5rem' }}
                      value={formData.vatRate}
                      onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                    >
                      <option value="8">8%</option>
                      <option value="10">10%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14.3px', color: '#6B7280' }}>
                    <span>Tiền thuế VAT:</span>
                    <span>{formatMoney(vatAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17.6px', fontWeight: '700', color: '#E53935', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB' }}>
                    <span>TỔNG CỘNG:</span>
                    <span>{formatMoney(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
              <div>
                {editingQuotation && hasPermission('B_QUOTATIONS', 'delete') && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingQuotation.id, editingQuotation.code)}
                    className="btn btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex items-center gap-1.5 cursor-pointer"
                    title="Xóa vĩnh viễn báo giá này"
                  >
                    <Trash2 size={16} />
                    <span>Xóa báo giá</span>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCancelCreate}
                  className="btn btn-secondary cursor-pointer"
                >
                  Hủy
                </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang lưu báo giá...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>{editingQuotation ? 'Cập nhật Báo Giá' : 'Lưu & Tạo Báo Giá'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        </div>

        {/* Quick Customer Modal */}
        {renderQuickCustomerModal()}

        {/* MODAL IMPORT SẢN PHẨM TỪ EXCEL/CSV */}
        <ImportItemsModal
          isOpen={isImportItemsModalOpen}
          onClose={() => setIsImportItemsModalOpen(false)}
          products={products}
          onImport={handleBulkImportItems}
          defaultVatRate={formData.vatRate || 8}
        />

        {/* Modal Xác nhận hủy bỏ thông tin báo giá (chống mất dữ liệu) */}
        {isDiscardModalOpen && (
          <div className="modal-overlay fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                  Hủy bỏ thông tin đang soạn?
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Bạn đã nhập thông tin hoặc sản phẩm báo giá. Nếu rời khỏi bây giờ, tất cả dữ liệu chưa lưu sẽ bị mất hoàn toàn.
                </p>
              </div>
              <div className="bg-gray-50 px-5 py-3.5 flex justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDiscardModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Tiếp tục soạn thảo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer transition-colors"
                >
                  Xác nhận hủy & Thoát
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Thanh công cụ */}
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
            <option value="ORDERED">Đã lên đơn</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
          {/* Nút Tùy chỉnh cột */}
          <ColumnCustomizerDropdown
            columnOrder={columnOrder}
            columnLabels={columnLabels}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumnVisibility}
            onReorderColumns={handleReorderColumns}
            onReset={resetColumns}
            disabledKeys={['code', 'customer']}
          />

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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm"
            style={{
              width: `${getTableWidth(columnOrder.filter((k) => visibleColumns[k]))}px`,
              minWidth: '100%',
              tableLayout: 'fixed',
              borderCollapse: 'separate',
              borderSpacing: 0
            }}
          >
            <thead>
              <tr className="bg-slate-50/90 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider">
                {columnOrder
                  .filter((k) => visibleColumns[k])
                  .map((colKey) => (
                    <th
                      key={colKey}
                      className={`py-3 px-3.5 select-none transition-colors whitespace-nowrap overflow-hidden text-center ${
                        colKey === 'actions' ? 'sticky-action-th' : ''
                      }`}
                      style={{
                        width: `${columnWidths[colKey] || defaultQuotationWidths[colKey] || 120}px`,
                        position: colKey === 'actions' ? 'sticky' : 'relative'
                      }}
                    >
                      <div className="inline-flex items-center justify-center gap-1.5 w-full">
                        <span className="whitespace-nowrap select-none font-semibold">{columnLabels[colKey]}</span>
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
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={columnOrder.filter((k) => visibleColumns[k]).length}
                    className="text-center py-10 text-gray-400"
                  >
                    Đang tải danh sách báo giá...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnOrder.filter((k) => visibleColumns[k]).length}
                    className="text-center py-10 text-gray-400"
                  >
                    Chưa có báo giá nào trong hệ thống
                  </td>
                </tr>
              ) : (
                quotations.map((q, idx) => (
                  <tr
                    key={q.id}
                    onClick={() => {
                      setSelectedQuotation(q);
                      setIsPrintModalOpen(true);
                    }}
                    className="hover:bg-red-50/40 transition-colors cursor-pointer"
                  >
                    {columnOrder
                      .filter((k) => visibleColumns[k])
                      .map((colKey) => {
                        switch (colKey) {
                          case 'stt':
                            return (
                              <td key={colKey} className="py-3 px-3.5 text-center text-gray-500 text-xs font-semibold whitespace-nowrap overflow-hidden">
                                {idx + 1}
                              </td>
                            );
                          case 'code':
                            return (
                              <td key={colKey} className="py-3 px-3.5 text-center whitespace-nowrap overflow-hidden">
                                <span className="font-bold text-[#E53935] font-mono text-xs">{q.code}</span>
                              </td>
                            );
                          case 'customer': {
                            const fullCust = `${q.customer.name} - SĐT: ${q.customer.phone || 'N/A'}${q.customer.taxCode ? ` • MST: ${q.customer.taxCode}` : ''}`;
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 overflow-hidden">
                                <div className="min-w-0" title={fullCust}>
                                  <div className="font-semibold text-gray-900 text-sm truncate leading-snug">
                                    {q.customer.name}
                                  </div>
                                  {(q.customer.phone || q.customer.taxCode) && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 truncate">
                                      {q.customer.phone && (
                                        <span className="font-mono text-gray-600 shrink-0">📞 {q.customer.phone}</span>
                                      )}
                                      {q.customer.phone && q.customer.taxCode && <span className="text-gray-300">•</span>}
                                      {q.customer.taxCode && (
                                        <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-1 py-0.2 rounded shrink-0">MST: {q.customer.taxCode}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          }
                          case 'date':
                            return (
                              <td key={colKey} className="py-3 px-3.5 text-xs text-gray-600 whitespace-nowrap overflow-hidden">
                                {new Date(q.date).toLocaleDateString('vi-VN')}
                              </td>
                            );
                          case 'validUntil':
                            return (
                              <td key={colKey} className="py-3 px-3.5 text-xs text-gray-600 whitespace-nowrap overflow-hidden">
                                {q.validUntil ? new Date(q.validUntil).toLocaleDateString('vi-VN') : '--'}
                              </td>
                            );
                          case 'manager':
                            return (
                              <td key={colKey} className="py-3 px-3.5 text-xs text-gray-700 whitespace-nowrap overflow-hidden">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 max-w-[140px] truncate" title={q.manager?.fullName || 'Chưa gán'}>
                                  {q.manager?.fullName || 'Chưa gán'}
                                </span>
                              </td>
                            );
                          case 'totalAmount':
                            return (
                              <td
                                key={colKey}
                                className="py-3 px-3.5 text-center font-bold text-gray-900 text-sm whitespace-nowrap overflow-hidden tabular-nums"
                              >
                                {formatMoney(q.totalAmount)}
                              </td>
                            );
                          case 'status':
                            return (
                              <td
                                key={colKey}
                                className="py-3 px-3.5 text-center whitespace-nowrap overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center">
                                  <StatusBadgeDropdown
                                    value={q.status}
                                    options={QUOTATION_STATUS_OPTIONS}
                                    onChange={(newStatus) => handleStatusChange(q.id, newStatus)}
                                  />
                                </div>
                              </td>
                            );
                          case 'actions':
                            return (
                              <td
                                key={colKey}
                                onClick={(e) => e.stopPropagation()}
                                className="py-2.5 px-2 text-center sticky-action-td whitespace-nowrap bg-white overflow-hidden"
                                style={{
                                  width: `${columnWidths[colKey] || defaultQuotationWidths[colKey] || 220}px`,
                                  minWidth: `${columnWidths[colKey] || defaultQuotationWidths[colKey] || 220}px`,
                                  maxWidth: `${columnWidths[colKey] || defaultQuotationWidths[colKey] || 220}px`
                                }}
                              >
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
                                {hasPermission('B_QUOTATIONS', 'update') && (
                                  <button
                                    onClick={() => openEditModal(q)}
                                    className="btn btn-secondary btn-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    title="Chỉnh sửa báo giá"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                {hasPermission('B_QUOTATIONS', 'delete') && (
                                  <button
                                    onClick={() => handleDelete(q.id, q.code)}
                                    className="btn btn-secondary btn-sm text-red-600 hover:text-red-800 hover:bg-red-50"
                                    title="Xóa báo giá"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
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
                                    disabled={convertingQuoteId === q.id}
                                    className="btn btn-primary btn-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    title="Tạo Đơn hàng từ Báo giá này"
                                    style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}
                                  >
                                    {convertingQuoteId === q.id ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <ShoppingBag size={14} />
                                    )}
                                  </button>
                                )}
                                {q.status === 'ORDERED' && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
                                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}
                                    title="Báo giá đã được lên đơn hàng thành công"
                                  >
                                    <CheckCircle2 size={13} />
                                    Đã lên đơn
                                  </span>
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
      </div>

      {/* Modal Tạo nhanh Khách hàng mới */}
      {renderQuickCustomerModal()}

      {/* MODAL MẪU IN BÁO GIÁ A4 CHUẨN NAM KHÁNH */}
      <QuotationPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        quotation={selectedQuotation}
        onEdit={(q) => openEditModal(q)}
        onDelete={(id, code) => handleDelete(id, code)}
        canEdit={hasPermission('B_QUOTATIONS', 'update')}
        canDelete={hasPermission('B_QUOTATIONS', 'delete')}
      />

      {/* MODAL IMPORT SẢN PHẨM TỪ EXCEL/CSV */}
      <ImportItemsModal
        isOpen={isImportItemsModalOpen}
        onClose={() => setIsImportItemsModalOpen(false)}
        products={products}
        onImport={handleBulkImportItems}
        defaultVatRate={formData.vatRate || 8}
      />

      <Toast
        show={!!toastMessage}
        message={toastMessage || ''}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
};
