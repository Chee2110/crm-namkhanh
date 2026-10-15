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
    <div className="space-y-6 pb-12">
      {/* 1. HEADER CHÍNH */}
      <div className="card p-6 rounded-3xl border border-slate-100/80 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E53935] flex items-center justify-center font-bold shadow-inner border border-red-100">
              <PackagePlus className="w-5 h-5" />
            </div>
            <span>Quản Lý Nhập Kho & Quản Lý Lô Hàng</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Lập phiếu, phân loại nguồn hàng, kiểm tra thực tế, định vị kệ/ô lưu trữ và tự động cộng tồn kho
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportListCSV}
            className="px-3.5 py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            title="Xuất danh sách sang file CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Xuất Excel/CSV</span>
          </button>

          <button
            onClick={loadReceipts}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canCreate && (
            <button
              onClick={() => {
                setEditingReceipt(null);
                setIsCreatePage(true);
              }}
              className="btn btn-primary text-xs shadow-glow flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Lập phiếu nhập kho</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TOP KPI CARDS (5 THẺ THỐNG KÊ NGHIỆP VỤ) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Tổng số phiếu */}
        <div className="card p-4 rounded-2xl border border-slate-100/80 shadow-sm bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tổng phiếu nhập</div>
            <div className="text-lg font-black text-slate-900">{kpis?.totalReceipts || 0}</div>
          </div>
        </div>

        {/* Card 2: Chờ kiểm hàng & duyệt */}
        <div className="card p-4 rounded-2xl border border-slate-100/80 shadow-sm bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Chờ kiểm / Duyệt</div>
            <div className="text-lg font-black text-amber-600">{kpis?.pendingReceipts || 0}</div>
          </div>
        </div>

        {/* Card 3: Đã nhập kho thành công */}
        <div className="card p-4 rounded-2xl border border-slate-100/80 shadow-sm bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Đã cộng tồn kho</div>
            <div className="text-lg font-black text-emerald-600">{kpis?.approvedReceipts || 0}</div>
          </div>
        </div>

        {/* Card 4: Tổng giá trị hàng nhập */}
        <div className="card p-4 rounded-2xl border border-slate-100/80 shadow-sm bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E53935] flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tổng giá trị nhập</div>
            <div className="text-base font-black text-[#E53935] truncate max-w-[130px]" title={`${(kpis?.totalValue || 0).toLocaleString('vi-VN')} đ`}>
              {(kpis?.totalValue || 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        {/* Card 5: Tổng số lượng sản phẩm nhập */}
        <div className="card p-4 rounded-2xl border border-slate-100/80 shadow-sm bg-white flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tổng SP thực nhận</div>
            <div className="text-lg font-black text-purple-600">
              {(kpis?.totalItemsAccepted || 0).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BỘ LỌC TÌM KIẾM & TAB TRẠNG THÁI */}
      <div className="card p-5 rounded-3xl border border-slate-100/80 shadow-card bg-white space-y-4">
        {/* Hàng Tab trạng thái nhanh */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
      <div className="card rounded-3xl border border-slate-100/80 shadow-card bg-white overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
            <p className="text-sm font-medium">Đang tải danh sách phiếu nhập kho...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <PackagePlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-800">Không tìm thấy phiếu nhập kho nào</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Không có phiếu nhập kho phù hợp với điều kiện tìm kiếm hoặc bạn chưa tạo phiếu nhập nào.
            </p>
            {canCreate && (
              <button
                onClick={() => {
                  setEditingReceipt(null);
                  setIsCreatePage(true);
                }}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-[#E53935] hover:bg-[#D32F2F] rounded-xl inline-flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo phiếu nhập kho ngay</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1050px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-center select-none">
                    <th className="px-3 py-3 w-12">STT</th>
                    <th className="px-4 py-3 text-left w-36">Mã phiếu</th>
                    <th className="px-3 py-3 w-28">Ngày nhập</th>
                    <th className="px-3 py-3 w-36">Loại nhập</th>
                    <th className="px-4 py-3 text-left">Nhà cung cấp / Nguồn</th>
                    <th className="px-3 py-3 text-left w-36">Kho nhận</th>
                    <th className="px-3 py-3 w-24 text-center">Số SP / SL</th>
                    <th className="px-4 py-3 text-right w-32">Tổng tiền (VNĐ)</th>
                    <th className="px-3 py-3 w-28">Người lập</th>
                    <th className="px-3 py-3 w-32">Trạng thái</th>
                    <th className="px-4 py-3 text-center w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedReceipts.map((r, idx) => {
                    const typeInfo = typeConfig[r.type] || { label: r.type, color: 'bg-slate-50 text-slate-700' };
                    const statusInfo = statusConfig[r.status] || {
                      label: r.status,
                      color: 'bg-slate-50 text-slate-700',
                      dot: 'bg-slate-400'
                    };
                    const totalQty = r.items?.reduce(
                      (s, it) => s + (it.acceptedQuantity > 0 ? it.acceptedQuantity : it.actualQuantity),
                      0
                    );

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-3 py-3 text-center text-slate-400 font-semibold">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>

                        {/* Mã phiếu clickable */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptForDetail(r)}
                            className="font-bold text-slate-900 font-mono hover:text-[#E53935] hover:underline transition-colors flex items-center gap-1"
                          >
                            <span>{r.code}</span>
                          </button>
                          {r.documentNumber && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5" title="Số chứng từ gốc">
                              HĐ: {r.documentNumber}
                            </div>
                          )}
                        </td>

                        {/* Ngày nhập */}
                        <td className="px-3 py-3 text-center text-slate-600 font-medium">
                          {new Date(r.receiptDate).toLocaleDateString('vi-VN')}
                        </td>

                        {/* Loại nhập kho */}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${typeInfo.color}`}
                          >
                            {typeInfo.label}
                          </span>
                        </td>

                        {/* Nhà cung cấp / Nguồn hàng */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                            {r.supplier ? r.supplier.name : r.sourceName || 'Nhập nội bộ / Khác'}
                          </div>
                          {r.supplier?.phone && (
                            <div className="text-[10px] text-slate-400">{r.supplier.phone}</div>
                          )}
                        </td>

                        {/* Kho lưu trữ */}
                        <td className="px-3 py-3 text-slate-700 font-medium">
                          {r.warehouse?.name || 'Tổng kho'}
                        </td>

                        {/* Số mặt hàng & tổng SL */}
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-slate-900">{r.items?.length || 0}</span> SP
                          <span className="text-slate-400 mx-1">•</span>
                          <span className="font-bold text-blue-600">{totalQty}</span>
                        </td>

                        {/* Tổng tiền */}
                        <td className="px-4 py-3 text-right font-black text-slate-900">
                          {Number(r.totalAmount).toLocaleString('vi-VN')} đ
                        </td>

                        {/* Người lập */}
                        <td className="px-3 py-3 text-center text-slate-600 truncate max-w-[120px]">
                          {r.createdBy?.fullName || 'Người lập'}
                        </td>

                        {/* Trạng thái */}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>

                        {/* Thao tác */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Xem chi tiết */}
                            <button
                              onClick={() => setSelectedReceiptForDetail(r)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Xem chi tiết phiếu nhập"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* In phiếu */}
                            <button
                              onClick={() => setSelectedReceiptForPrint(r)}
                              className="p-1.5 text-slate-400 hover:text-[#E53935] rounded-lg hover:bg-red-50 transition-colors"
                              title="In phiếu nhập kho A4"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Kiểm hàng thực tế (nếu DRAFT hoặc CHECKING) */}
                            {canEdit && (r.status === 'DRAFT' || r.status === 'CHECKING') && (
                              <button
                                onClick={() => setSelectedReceiptForVerify(r)}
                                className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Kiểm hàng thực tế & đối chiếu chứng từ"
                              >
                                <ClipboardCheck className="w-4 h-4" />
                              </button>
                            )}

                            {/* Phê duyệt nhập kho (nếu DRAFT hoặc CHECKING) */}
                            {canEdit && (r.status === 'DRAFT' || r.status === 'CHECKING') && (
                              <button
                                onClick={() => setSelectedReceiptForApprove(r)}
                                className="p-1.5 text-emerald-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
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
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Chỉnh sửa phiếu"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Xóa phiếu (nếu DRAFT hoặc REJECTED) */}
                            {canDelete && (r.status === 'DRAFT' || r.status === 'REJECTED') && (
                              <button
                                onClick={() => setDeleteConfirm({ isOpen: true, receipt: r })}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                title="Xóa phiếu nhập kho"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
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
