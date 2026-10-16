import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  RefreshCw,
  Printer,
  Eye,
  Edit2,
  Trash2,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  DollarSign,
  Boxes,
  Warehouse,
  Truck,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Layers,
  Check,
  ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';
import {
  InboundReceipt,
  InboundReceiptKPIs,
  InboundReceiptType,
  InboundReceiptStatus,
  Warehouse as WarehouseType,
  Supplier
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { SearchInput } from '../../components/common/SearchInput';
import { TablePagination } from '../../components/common/TablePagination';
import { InboundReceiptCreatePage } from './components/InboundReceiptCreatePage';
import { InboundReceiptDetailModal } from './components/InboundReceiptDetailModal';
import { InboundVerifyModal } from './components/InboundVerifyModal';
import { InboundApproveModal } from './components/InboundApproveModal';
import { InboundPrintModal } from './components/InboundPrintModal';
import { useTableResize } from '../../hooks/useTableResize';
import { ColumnCustomizerDropdown } from '../../components/common/ColumnCustomizerDropdown';
import { withActionsLast } from '../../utils/columnOrder';

export const InboundReceiptsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();

  // Dữ liệu chính
  const [receipts, setReceipts] = useState<InboundReceipt[]>([]);
  const [kpis, setKpis] = useState<InboundReceiptKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Trạng thái mở Trang tạo/sửa & Modals
  const [isCreatePage, setIsCreatePage] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<InboundReceipt | null>(null);
  const [selectedReceiptForDetail, setSelectedReceiptForDetail] = useState<InboundReceipt | null>(null);
  const [selectedReceiptForVerify, setSelectedReceiptForVerify] = useState<InboundReceipt | null>(null);
  const [selectedReceiptForApprove, setSelectedReceiptForApprove] = useState<InboundReceipt | null>(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<InboundReceipt | null>(null);

  // Dialog Từ chối & Hủy & Xóa
  const [rejectDialog, setRejectDialog] = useState<{ isOpen: boolean; receipt: InboundReceipt | null; reason: string }>({
    isOpen: false,
    receipt: null,
    reason: ''
  });
  const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean; receipt: InboundReceipt | null; reason: string }>({
    isOpen: false,
    receipt: null,
    reason: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; receipt: InboundReceipt | null }>({
    isOpen: false,
    receipt: null
  });

  // Cấu hình Cột & Tùy chỉnh độ rộng cột
  const defaultColOrder = [
    'stt',
    'code',
    'receiptDate',
    'type',
    'supplier',
    'warehouse',
    'itemsCount',
    'totalAmount',
    'createdByName',
    'status',
    'actions'
  ];

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'Mã phiếu',
    receiptDate: 'Ngày nhập',
    type: 'Loại nhập',
    supplier: 'Nhà cung cấp / Nguồn',
    warehouse: 'Kho nhận',
    itemsCount: 'Số SP / SL',
    totalAmount: 'Tổng tiền (VNĐ)',
    createdByName: 'Người lập',
    status: 'Trạng thái',
    actions: 'Thao tác'
  };

  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    receiptDate: true,
    type: true,
    supplier: true,
    warehouse: true,
    itemsCount: true,
    totalAmount: true,
    createdByName: true,
    status: true,
    actions: true
  };

  const defaultInboundWidths: Record<string, number> = {
    stt: 55,
    code: 140,
    receiptDate: 110,
    type: 130,
    supplier: 230,
    warehouse: 160,
    itemsCount: 120,
    totalAmount: 140,
    createdByName: 125,
    status: 130,
    actions: 140
  };

  const minInboundWidths: Record<string, number> = {
    stt: 45,
    code: 100,
    receiptDate: 90,
    type: 100,
    supplier: 140,
    warehouse: 110,
    itemsCount: 85,
    totalAmount: 100,
    createdByName: 90,
    status: 100,
    actions: 120
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_inbound_visible_cols_v1');
      return saved ? { ...defaultVisibleCols, ...JSON.parse(saved) } : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_inbound_col_order_v1');
      return saved ? withActionsLast(JSON.parse(saved), defaultColOrder) : defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'inbound_receipts_v1',
    defaultWidths: defaultInboundWidths,
    minWidth: 50,
    minWidths: minInboundWidths
  });

  const handleReorderColumns = (newOrder: string[]) => {
    const normalized = withActionsLast(newOrder, defaultColOrder);
    setColumnOrder(normalized);
    try {
      localStorage.setItem('namkhanh_inbound_col_order_v1', JSON.stringify(normalized));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleColumnVisibility = (colKey: string) => {
    const updated = { ...visibleColumns, [colKey]: !visibleColumns[colKey] };
    setVisibleColumns(updated);
    try {
      localStorage.setItem('namkhanh_inbound_visible_cols_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    try {
      localStorage.removeItem('namkhanh_inbound_visible_cols_v1');
      localStorage.removeItem('namkhanh_inbound_col_order_v1');
    } catch (e) {
      console.error(e);
    }
  };

  const canCreate =
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('CEO') ||
    hasPermission('C_INBOUND_RECEIPTS', 'create');

  const canEdit =
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('CEO') ||
    hasPermission('C_INBOUND_RECEIPTS', 'update');

  const canDelete =
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('CEO') ||
    hasPermission('C_INBOUND_RECEIPTS', 'delete');

  // Tải danh mục hỗ trợ (Kho, Nhà cung cấp)
  useEffect(() => {
    Promise.all([
      api.get<WarehouseType[]>('/warehouses'),
      api.get<Supplier[]>('/suppliers')
    ])
      .then(([resWh, resSup]) => {
        if (Array.isArray(resWh.data)) setWarehouses(resWh.data);
        if (Array.isArray(resSup.data)) setSuppliers(resSup.data);
      })
      .catch((err) => console.error('Lỗi tải danh mục kho/NCC:', err));
  }, []);

  // Tải danh sách phiếu nhập kho
  const loadReceipts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (warehouseFilter !== 'ALL') params.append('warehouseId', warehouseFilter);
      if (supplierFilter !== 'ALL') params.append('supplierId', supplierFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get<{ kpis: InboundReceiptKPIs; receipts: InboundReceipt[] }>(
        `/inbound-receipts?${params.toString()}`
      );

      setReceipts(res.data.receipts || []);
      setKpis(res.data.kpis || null);
    } catch (err) {
      console.error('Lỗi tải danh sách phiếu nhập:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
    setCurrentPage(1);
  }, [typeFilter, statusFilter, warehouseFilter, supplierFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReceipts();
  };

  const handleResetFilter = () => {
    setSearch('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setWarehouseFilter('ALL');
    setSupplierFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Cấu hình nhãn và màu sắc loại nhập
  const typeConfig: Record<InboundReceiptType, { label: string; color: string }> = {
    PURCHASE: { label: 'Nhập mua hàng', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    FINISHED_GOODS: { label: 'Nhập thành phẩm', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    RETURN: { label: 'Nhập hàng hoàn', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    ADJUSTMENT: { label: 'Nhập điều chỉnh', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  };

  // Cấu hình trạng thái
  const statusConfig: Record<InboundReceiptStatus, { label: string; color: string; dot: string }> = {
    DRAFT: { label: 'Bản nháp', color: 'bg-gray-100 text-gray-700 border-gray-300', dot: 'bg-gray-400' },
    CHECKING: { label: 'Đang kiểm hàng', color: 'bg-amber-50 text-amber-700 border-amber-300', dot: 'bg-amber-500' },
    APPROVED: { label: 'Đã nhập kho', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
    REJECTED: { label: 'Từ chối duyệt', color: 'bg-rose-50 text-rose-700 border-rose-300', dot: 'bg-rose-500' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-50 text-red-700 border-red-300', dot: 'bg-red-500' }
  };

  // Thao tác Từ chối duyệt
  const handleConfirmReject = async () => {
    if (!rejectDialog.receipt || !rejectDialog.reason.trim()) return;
    try {
      await api.post(`/inbound-receipts/${rejectDialog.receipt.id}/reject`, {
        reason: rejectDialog.reason.trim()
      });
      setRejectDialog({ isOpen: false, receipt: null, reason: '' });
      loadReceipts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối phiếu');
    }
  };

  // Thao tác Hủy phiếu
  const handleConfirmCancel = async () => {
    if (!cancelDialog.receipt || !cancelDialog.reason.trim()) return;
    try {
      await api.post(`/inbound-receipts/${cancelDialog.receipt.id}/cancel`, {
        reason: cancelDialog.reason.trim()
      });
      setCancelDialog({ isOpen: false, receipt: null, reason: '' });
      loadReceipts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi hủy phiếu');
    }
  };

  // Thao tác Xóa phiếu
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.receipt) return;
    try {
      await api.delete(`/inbound-receipts/${deleteConfirm.receipt.id}`);
      setDeleteConfirm({ isOpen: false, receipt: null });
      loadReceipts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa phiếu');
    }
  };

  // Xuất file CSV danh sách phiếu nhập
  const handleExportListCSV = () => {
    const lines = [
      '\uFEFFDANH SÁCH PHIẾU NHẬP KHO - CÔNG TY TNHH NK NAM KHÁNH',
      `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`,
      `Tổng số phiếu: ${receipts.length}`,
      '',
      'STT,Mã phiếu,Ngày nhập,Loại nhập,Nhà cung cấp/Nguồn,Kho nhận,Số mặt hàng,Tổng tiền (VNĐ),Người lập,Trạng thái'
    ];

    receipts.forEach((r, idx) => {
      const typeLabel = typeConfig[r.type]?.label || r.type;
      const statusLabel = statusConfig[r.status]?.label || r.status;
      const supplierName = r.supplier?.name || r.sourceName || 'Nhập nội bộ';
      lines.push(
        `${idx + 1},"${r.code}","${new Date(r.receiptDate).toLocaleDateString('vi-VN')}","${typeLabel}","${supplierName}","${r.warehouse?.name || ''}",${r.items?.length || 0},${r.totalAmount},"${r.createdBy?.fullName || ''}","${statusLabel}"`
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DanhSachPhieuNhapKho_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Phân trang dữ liệu hiển thị
  const paginatedReceipts = receipts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Nếu đang ở chế độ tạo/sửa phiếu, hiển thị giao diện trang riêng biệt
  if (isCreatePage) {
    return (
      <InboundReceiptCreatePage
        editingReceipt={editingReceipt}
        warehouses={warehouses}
        suppliers={suppliers}
        onBack={() => {
          setIsCreatePage(false);
          setEditingReceipt(null);
        }}
        onSuccess={() => {
          setIsCreatePage(false);
          setEditingReceipt(null);
          loadReceipts();
        }}
      />
    );
  }

  return (
    <div className="space-y-3 pb-8">
      {/* 1. HEADER CHÍNH */}
      <div className="card px-5 py-3 rounded-2xl border border-slate-100/80 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E53935] flex items-center justify-center font-bold shadow-inner border border-red-100">
              <PackagePlus className="w-4 h-4" />
            </div>
            <span>Quản Lý Nhập Kho & Quản Lý Lô Hàng</span>
          </h2>
          <p className="text-[11.5px] text-slate-500 mt-0.5 font-medium">
            Lập phiếu, phân loại nguồn hàng, kiểm tra thực tế, định vị kệ/ô lưu trữ và tự động cộng tồn kho
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportListCSV}
            className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            title="Xuất danh sách sang file CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
            <span>Xuất Excel/CSV</span>
          </button>

          <ColumnCustomizerDropdown
            columnOrder={columnOrder}
            columnLabels={columnLabels}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumnVisibility}
            onReorderColumns={handleReorderColumns}
            onReset={resetColumns}
            disabledKeys={['code']}
            buttonClassName="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          />

          <button
            onClick={loadReceipts}
            disabled={loading}
            className="p-1.5 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canCreate && (
            <button
              onClick={() => {
                setEditingReceipt(null);
                setIsCreatePage(true);
              }}
              className="btn btn-primary text-xs shadow-glow flex items-center gap-1.5 py-1.5 px-3.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lập phiếu nhập kho</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TOP KPI CARDS (5 THẺ THỐNG KÊ NGHIỆP VỤ) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Card 1: Tổng số phiếu */}
        <div className="card p-2.5 sm:p-3 rounded-xl border border-slate-100/80 shadow-xs bg-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Tổng phiếu nhập</div>
            <div className="text-base font-black text-slate-900 leading-tight">{kpis?.totalReceipts || 0}</div>
          </div>
        </div>

        {/* Card 2: Chờ kiểm hàng & duyệt */}
        <div className="card p-2.5 sm:p-3 rounded-xl border border-slate-100/80 shadow-xs bg-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Chờ kiểm / Duyệt</div>
            <div className="text-base font-black text-amber-600 leading-tight">{kpis?.pendingReceipts || 0}</div>
          </div>
        </div>

        {/* Card 3: Đã nhập kho thành công */}
        <div className="card p-2.5 sm:p-3 rounded-xl border border-slate-100/80 shadow-xs bg-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Đã cộng tồn kho</div>
            <div className="text-base font-black text-emerald-600 leading-tight">{kpis?.approvedReceipts || 0}</div>
          </div>
        </div>

        {/* Card 4: Tổng giá trị hàng nhập */}
        <div className="card p-2.5 sm:p-3 rounded-xl border border-slate-100/80 shadow-xs bg-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-[#E53935] flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Tổng giá trị nhập</div>
            <div className="text-sm font-black text-[#E53935] truncate max-w-[130px] leading-tight" title={`${(kpis?.totalValue || 0).toLocaleString('vi-VN')} đ`}>
              {(kpis?.totalValue || 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        {/* Card 5: Tổng số lượng sản phẩm nhập */}
        <div className="card p-2.5 sm:p-3 rounded-xl border border-slate-100/80 shadow-xs bg-white flex items-center gap-2.5 col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Tổng SP thực nhận</div>
            <div className="text-base font-black text-purple-600 leading-tight">
              {(kpis?.totalItemsAccepted || 0).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BỘ LỌC TÌM KIẾM & TAB TRẠNG THÁI */}
      <div className="card px-4 py-2.5 rounded-2xl border border-slate-100/80 shadow-card bg-white space-y-2">
        {/* Hàng Tab trạng thái nhanh */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2">
          {[
            { id: 'ALL', label: 'Tất cả phiếu', count: kpis?.totalReceipts },
            { id: 'CHECKING', label: 'Chờ kiểm & duyệt', count: kpis?.pendingReceipts, color: 'text-amber-600' },
            { id: 'APPROVED', label: 'Đã nhập kho', count: kpis?.approvedReceipts, color: 'text-emerald-600' },
            { id: 'DRAFT', label: 'Bản nháp' },
            { id: 'REJECTED', label: 'Từ chối duyệt', count: kpis?.rejectedReceipts, color: 'text-rose-600' },
            { id: 'CANCELLED', label: 'Đã hủy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === tab.id ? 'bg-white/20 text-white' : tab.color || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Các Dropdown lọc chi tiết */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Tìm kiếm văn bản */}
          <div className="md:col-span-2">
            <SearchInput
              value={search}
              onChange={(val) => setSearch(val)}
              onSearchImmediate={() => loadReceipts()}
              placeholder="Tìm theo mã phiếu, số hóa đơn, NCC, tên SP, mã lô..."
              className="input-pill text-xs font-medium w-full"
              style={{ height: '36px', borderRadius: '9999px' }}
            />
          </div>

          {/* Lọc theo Loại nhập kho */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-semibold bg-white text-slate-800 cursor-pointer shadow-xs leading-normal"
              style={{
                height: '36px',
                lineHeight: 'normal',
                paddingTop: 0,
                paddingBottom: 0,
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="ALL">Loại nhập: Tất cả</option>
              <option value="PURCHASE">Nhập mua hàng</option>
              <option value="FINISHED_GOODS">Nhập thành phẩm</option>
              <option value="RETURN">Nhập hàng hoàn</option>
              <option value="ADJUSTMENT">Nhập điều chỉnh</option>
            </select>
          </div>

          {/* Lọc theo Kho nhận */}
          <div>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-semibold bg-white text-slate-800 cursor-pointer shadow-xs leading-normal"
              style={{
                height: '36px',
                lineHeight: 'normal',
                paddingTop: 0,
                paddingBottom: 0,
                color: '#1e293b',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="ALL">Kho nhận: Tất cả</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nút đặt lại bộ lọc */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilter}
              className="h-9 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors w-full"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa lọc</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. BẢNG DỮ LIỆU PHIẾU NHẬP KHO */}
      <div className="card rounded-2xl border border-slate-100/80 shadow-card bg-white overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-[#E53935] mb-2"></div>
            <p className="text-xs font-medium">Đang tải danh sách phiếu nhập kho...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <PackagePlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">Không tìm thấy phiếu nhập kho nào</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
              Không có phiếu nhập kho phù hợp với điều kiện tìm kiếm hoặc bạn chưa tạo phiếu nhập nào.
            </p>
            {canCreate && (
              <button
                onClick={() => {
                  setEditingReceipt(null);
                  setIsCreatePage(true);
                }}
                className="mt-3 px-3.5 py-1.5 text-xs font-bold text-white bg-[#E53935] hover:bg-[#D32F2F] rounded-xl inline-flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo phiếu nhập kho ngay</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table
                className="w-full text-left text-xs border-collapse"
                style={{
                  width: `${getTableWidth(columnOrder.filter((k) => visibleColumns[k]))}px`,
                  minWidth: '100%',
                  tableLayout: 'fixed'
                }}
              >
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
                    {columnOrder
                      .filter((colKey) => visibleColumns[colKey])
                      .map((colKey) => {
                        const width = columnWidths[colKey] || defaultInboundWidths[colKey] || 100;
                        const isAction = colKey === 'actions';
                        const alignClass =
                          colKey === 'code' || colKey === 'supplier' || colKey === 'warehouse'
                            ? 'text-left'
                            : colKey === 'totalAmount'
                            ? 'text-right'
                            : 'text-center';

                        return (
                          <th
                            key={colKey}
                            className={`py-2 px-2.5 select-none overflow-hidden relative ${alignClass} ${
                              isAction ? 'sticky-action-th' : ''
                            }`}
                            style={{
                              width: `${width}px`,
                              position: isAction ? 'sticky' : 'relative',
                              ...(isAction ? { right: 0 } : {})
                            }}
                          >
                            <span className="truncate">{columnLabels[colKey]}</span>
                            {!isAction && (
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
                  {paginatedReceipts.map((r, idx) => {
                    const typeInfo = typeConfig[r.type] || { label: r.type, color: 'bg-slate-50 text-slate-700 border-slate-200' };
                    const statusInfo = statusConfig[r.status] || {
                      label: r.status,
                      color: 'bg-slate-50 text-slate-700 border-slate-200',
                      dot: 'bg-slate-400'
                    };
                    const totalQty = r.items?.reduce(
                      (s, it) => s + (it.acceptedQuantity > 0 ? it.acceptedQuantity : it.actualQuantity),
                      0
                    );

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                        {columnOrder
                          .filter((colKey) => visibleColumns[colKey])
                          .map((colKey) => {
                            switch (colKey) {
                              case 'stt':
                                return (
                                  <td key={colKey} className="px-2.5 py-1.5 text-center text-slate-400 font-semibold whitespace-nowrap overflow-hidden">
                                    {(currentPage - 1) * pageSize + idx + 1}
                                  </td>
                                );
                              case 'code':
                                return (
                                  <td key={colKey} className="px-3 py-1.5 overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedReceiptForDetail(r)}
                                      className="font-bold text-slate-900 font-mono hover:text-[#E53935] hover:underline transition-colors flex items-center gap-1 truncate max-w-full text-left"
                                    >
                                      <span className="truncate">{r.code}</span>
                                    </button>
                                    {r.documentNumber && (
                                      <div className="text-[10px] text-slate-400 font-mono leading-none mt-0.5 truncate" title={`Số chứng từ: ${r.documentNumber}`}>
                                        HĐ: {r.documentNumber}
                                      </div>
                                    )}
                                  </td>
                                );
                              case 'receiptDate':
                                return (
                                  <td key={colKey} className="px-2.5 py-1.5 text-center text-slate-600 font-medium whitespace-nowrap overflow-hidden">
                                    {new Date(r.receiptDate).toLocaleDateString('vi-VN')}
                                  </td>
                                );
                              case 'type':
                                return (
                                  <td key={colKey} className="px-2.5 py-1.5 text-center whitespace-nowrap overflow-hidden">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${typeInfo.color}`}>
                                      {typeInfo.label}
                                    </span>
                                  </td>
                                );
                              case 'supplier':
                                return (
                                  <td key={colKey} className="px-3 py-1.5 overflow-hidden">
                                    <div className="font-semibold text-slate-800 truncate leading-snug" title={r.supplier ? r.supplier.name : r.sourceName || 'Nhập nội bộ / Khác'}>
                                      {r.supplier ? r.supplier.name : r.sourceName || 'Nhập nội bộ / Khác'}
                                    </div>
                                    {r.supplier?.phone && (
                                      <div className="text-[10px] text-slate-400 leading-none mt-0.5 truncate">{r.supplier.phone}</div>
                                    )}
                                  </td>
                                );
                              case 'warehouse':
                                return (
                                  <td key={colKey} className="px-2.5 py-1.5 text-slate-700 font-medium truncate overflow-hidden" title={r.warehouse?.name || 'Tổng kho'}>
                                    {r.warehouse?.name || 'Tổng kho'}
                                  </td>
                                );
                              case 'itemsCount':
                                return (
                                  <td key={colKey} className="px-2.5 py-1.5 text-center whitespace-nowrap overflow-hidden">
                                    <span className="font-bold text-slate-900">{r.items?.length || 0}</span> SP
                                    <span className="text-slate-400 mx-1">•</span>
                                    <span className="font-bold text-blue-600">{totalQty}</span>
                                  </td>
                                );
                              case 'totalAmount':
                                return (
                                  <td key={colKey} className="px-3 py-1.5 text-right font-black text-slate-900 whitespace-nowrap overflow-hidden">
                                    {Number(r.totalAmount).toLocaleString('vi-VN')} đ
                                  </td>
                                );
                              case 'createdByName':
                                return (
                                  <td key={colKey} className="px-2.5 py-1.5 text-center text-slate-600 truncate overflow-hidden" title={r.createdBy?.fullName || 'Người lập'}>
                                    {r.createdBy?.fullName || 'Người lập'}
                                  </td>
                                );
                              case 'status':
                                return (
                                  <td key={colKey} className="px-2.5 py-1.5 text-center whitespace-nowrap overflow-hidden">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.color}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                                      <span>{statusInfo.label}</span>
                                    </span>
                                  </td>
                                );
                              case 'actions':
                                return (
                                  <td
                                    key={colKey}
                                    className="px-3 py-1.5 text-center sticky-action-td overflow-hidden"
                                    style={{
                                      position: 'sticky',
                                      right: 0
                                    }}
                                  >
                                    <div className="flex items-center justify-center gap-0.5">
                                      {/* Xem chi tiết */}
                                      <button
                                        onClick={() => setSelectedReceiptForDetail(r)}
                                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                        title="Xem chi tiết phiếu nhập"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>

                                      {/* In phiếu */}
                                      <button
                                        onClick={() => setSelectedReceiptForPrint(r)}
                                        className="p-1 text-slate-400 hover:text-[#E53935] rounded-lg hover:bg-red-50 transition-colors"
                                        title="In phiếu nhập kho A4"
                                      >
                                        <Printer className="w-4 h-4" />
                                      </button>

                                      {/* Kiểm hàng thực tế (nếu DRAFT hoặc CHECKING) */}
                                      {canEdit && (r.status === 'DRAFT' || r.status === 'CHECKING') && (
                                        <button
                                          onClick={() => setSelectedReceiptForVerify(r)}
                                          className="p-1 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                                          title="Kiểm hàng thực tế & đối chiếu chứng từ"
                                        >
                                          <ClipboardCheck className="w-4 h-4" />
                                        </button>
                                      )}

                                      {/* Phê duyệt nhập kho (nếu DRAFT hoặc CHECKING) */}
                                      {canEdit && (r.status === 'DRAFT' || r.status === 'CHECKING') && (
                                        <button
                                          onClick={() => setSelectedReceiptForApprove(r)}
                                          className="p-1 text-emerald-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                                          title="Duyệt phiếu & Cộng tồn kho tự động"
                                        >
                                          <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                      )}

                                      {/* Sửa phiếu (nếu DRAFT hoặc REJECTED) */}
                                      {canEdit && (r.status === 'DRAFT' || r.status === 'REJECTED') && (
                                        <button
                                          onClick={() => {
                                            setEditingReceipt(r);
                                            setIsCreatePage(true);
                                          }}
                                          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                          title="Chỉnh sửa phiếu"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                      )}

                                      {/* Xóa phiếu (nếu DRAFT hoặc REJECTED) */}
                                      {canDelete && (r.status === 'DRAFT' || r.status === 'REJECTED') && (
                                        <button
                                          onClick={() => setDeleteConfirm({ isOpen: true, receipt: r })}
                                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                          title="Xóa phiếu nhập kho"
                                        >
                                          <Trash2 className="w-4 h-4" />
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            <TablePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={receipts.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="phiếu nhập"
            />
          </>
        )}
      </div>

      {/* 5. MODALS & DIALOGS */}

      {/* Modal Xem chi tiết phiếu */}
      <InboundReceiptDetailModal
        receipt={selectedReceiptForDetail}
        isOpen={Boolean(selectedReceiptForDetail)}
        onClose={() => setSelectedReceiptForDetail(null)}
        onPrint={(rec) => {
          setSelectedReceiptForPrint(rec);
        }}
        onEdit={(rec) => {
          setSelectedReceiptForDetail(null);
          setEditingReceipt(rec);
          setIsCreatePage(true);
        }}
        onVerify={(rec) => {
          setSelectedReceiptForDetail(null);
          setSelectedReceiptForVerify(rec);
        }}
        onApprove={(rec) => {
          setSelectedReceiptForDetail(null);
          setSelectedReceiptForApprove(rec);
        }}
        onReject={(rec) => {
          setSelectedReceiptForDetail(null);
          setRejectDialog({ isOpen: true, receipt: rec, reason: '' });
        }}
        onCancel={(rec) => {
          setSelectedReceiptForDetail(null);
          setCancelDialog({ isOpen: true, receipt: rec, reason: '' });
        }}
      />

      {/* Modal Kiểm hàng thực tế (Bước 3) */}
      <InboundVerifyModal
        receipt={selectedReceiptForVerify}
        isOpen={Boolean(selectedReceiptForVerify)}
        onClose={() => setSelectedReceiptForVerify(null)}
        onSuccess={() => {
          loadReceipts();
        }}
      />

      {/* Modal Duyệt & Tự động cộng tồn kho (Bước 4 & 5) */}
      <InboundApproveModal
        receipt={selectedReceiptForApprove}
        isOpen={Boolean(selectedReceiptForApprove)}
        onClose={() => setSelectedReceiptForApprove(null)}
        onSuccess={() => {
          loadReceipts();
        }}
      />

      {/* Modal In phiếu nhập kho A4 */}
      <InboundPrintModal
        receipt={selectedReceiptForPrint}
        onClose={() => setSelectedReceiptForPrint(null)}
      />

      {/* Dialog Từ chối duyệt */}
      {rejectDialog.isOpen && rejectDialog.receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Từ chối duyệt phiếu {rejectDialog.receipt.code}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Vui lòng nhập lý do từ chối để nhân viên tạo phiếu hoặc nhà cung cấp kiểm tra lại:
            </p>
            <textarea
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="VD: Thiếu chứng từ xuất xưởng, hàng hóa sai quy cách so với hợp đồng..."
              rows={3}
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectDialog({ isOpen: false, receipt: null, reason: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectDialog.reason.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Hủy phiếu */}
      {cancelDialog.isOpen && cancelDialog.receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl">
                <Ban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Hủy phiếu nhập kho {cancelDialog.receipt.code}
              </h3>
            </div>
            {cancelDialog.receipt.status === 'APPROVED' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <strong>Cảnh báo quan trọng:</strong> Phiếu này đã được duyệt nhập kho trước đó. Khi hủy phiếu, hệ thống sẽ{' '}
                <span className="font-bold underline">tự động trừ lại số lượng tồn kho</span> đã cộng.
              </div>
            )}
            <p className="text-xs text-slate-500">Nhập lý do hủy phiếu nhập kho:</p>
            <textarea
              value={cancelDialog.reason}
              onChange={(e) => setCancelDialog((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="VD: Hủy do sai đơn hàng, NCC giao nhầm địa chỉ..."
              rows={3}
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelDialog({ isOpen: false, receipt: null, reason: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!cancelDialog.reason.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
              >
                Xác nhận hủy phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Xác nhận Xóa phiếu */}
      {deleteConfirm.isOpen && deleteConfirm.receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Xóa phiếu nhập kho</h3>
            </div>
            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn xóa vĩnh viễn phiếu nhập kho{' '}
              <strong className="text-slate-900 font-mono">{deleteConfirm.receipt.code}</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, receipt: null })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
