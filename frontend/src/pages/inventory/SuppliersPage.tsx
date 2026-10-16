import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Eye,
  Package,
  AlertCircle,
  X,
  Columns,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { Supplier, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTableResize } from '../../hooks/useTableResize';
import { TablePagination } from '../../components/common/TablePagination';
import { useAutoTablePagination } from '../../hooks/useAutoTablePagination';
import { ColumnCustomizerDropdown } from '../../components/common/ColumnCustomizerDropdown';
import { withActionsLast } from '../../utils/columnOrder';
import { SearchInput } from '../../components/common/SearchInput';

export const SuppliersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    startIndex,
    paginate: paginateSuppliers
  } = useAutoTablePagination({
    totalItems: suppliers.length,
    rowHeight: 38,
    topOffset: 250,
    minRows: 6,
    maxRows: 50,
  });

  const paginatedSuppliers = paginateSuppliers(suppliers);

  // Cấu hình ẩn / hiện cột (Tách riêng biệt từng trường thông tin theo form Thêm NCC)
  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    name: true,
    contactPerson: true,
    phone: true,
    email: true,
    taxCode: true,
    address: true,
    notes: true,
    products: true,
    actions: true
  };

  const defaultColOrder = [
    'stt',
    'code',
    'name',
    'contactPerson',
    'phone',
    'email',
    'taxCode',
    'address',
    'notes',
    'products',
    'actions'
  ];

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'Mã NCC',
    name: 'Tên Nhà Cung Cấp',
    contactPerson: 'Người liên hệ',
    phone: 'Số điện thoại',
    email: 'Email',
    taxCode: 'Mã số thuế',
    address: 'Địa chỉ trụ sở / Nhà máy',
    notes: 'Ghi chú chính sách',
    products: 'Sản phẩm cung cấp',
    actions: 'Thao tác'
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_suppliers_visible_cols_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultVisibleCols, ...parsed };
      }
      return defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_suppliers_col_order_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = [...parsed];
        defaultColOrder.forEach((k) => {
          if (!merged.includes(k)) merged.push(k);
        });
        return withActionsLast(merged, defaultColOrder);
      }
      return defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const defaultSupplierWidths: Record<string, number> = {
    stt: 60,
    code: 110,
    name: 240,
    contactPerson: 160,
    phone: 130,
    email: 180,
    taxCode: 130,
    address: 230,
    notes: 200,
    products: 150,
    actions: 120
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'suppliers_v3',
    defaultWidths: defaultSupplierWidths,
    minWidth: 60,
    minWidths: {
      stt: 50,
      code: 90,
      name: 180,
      contactPerson: 120,
      phone: 100,
      email: 120,
      taxCode: 100,
      address: 150,
      notes: 130,
      products: 120,
      actions: 100
    }
  });

  const handleReorderColumns = (newOrder: string[]) => {
    const normalized = withActionsLast(newOrder, defaultColOrder);
    setColumnOrder(normalized);
    try {
      localStorage.setItem('namkhanh_suppliers_col_order_v3', JSON.stringify(normalized));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleColumnVisibility = (colKey: string) => {
    const updated = { ...visibleColumns, [colKey]: !visibleColumns[colKey] };
    setVisibleColumns(updated);
    try {
      localStorage.setItem('namkhanh_suppliers_visible_cols_v3', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    try {
      localStorage.setItem('namkhanh_suppliers_visible_cols_v3', JSON.stringify(defaultVisibleCols));
      localStorage.removeItem('namkhanh_suppliers_col_order_v3');
    } catch (e) {
      console.error(e);
    }
  };

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    taxCode: '',
    contactPerson: '',
    notes: '',
    status: 'ACTIVE'
  });

  // Modal View Products
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get<Supplier[]>(`/suppliers${query}`);
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải nhà cung cấp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      code: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      taxCode: '',
      contactPerson: '',
      notes: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      code: s.code,
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      taxCode: s.taxCode || '',
      contactPerson: s.contactPerson || '',
      notes: s.notes || '',
      status: s.status
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openProductsModal = async (s: Supplier) => {
    setSelectedSupplier(s);
    setIsProductsModalOpen(true);
    try {
      setLoadingProducts(true);
      const res = await api.get<Product[]>(`/suppliers/${s.id}/products`);
      setSupplierProducts(res.data || []);
    } catch (err) {
      console.error('Lỗi tải sản phẩm NCC:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name) {
      setFormError('Vui lòng nhập tên nhà cung cấp');
      return;
    }

    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, formData);
      } else {
        await api.post('/suppliers', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Lỗi khi lưu nhà cung cấp');
    }
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${s.name}" (${s.code})?`)) return;
    try {
      await api.delete(`/suppliers/${s.id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa NCC đang có sản phẩm liên kết!');
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-82px)] min-h-[calc(100dvh-82px)] pb-1">
      {/* HEADER & FILTER */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#E53935]" />
            Danh Sách Nhà Cung Cấp (C.6)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Quản trị đối tác phân phối, nhà máy sản xuất (Đồng bộ 2 chiều khi khai báo Hàng hóa mới)
          </p>
        </div>

        <div className="toolbar-pill flex items-center gap-3 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex-1 sm:w-64">
            <SearchInput
              value={search}
              onChange={(val) => setSearch(val)}
              onSearchImmediate={() => loadData()}
              placeholder="Tìm tên NCC, MST, SĐT..."
              style={{ height: '34px', borderRadius: '8px' }}
            />
          </form>

          {/* Menu ẩn/hiện cột */}
          <ColumnCustomizerDropdown
            columnOrder={columnOrder}
            columnLabels={columnLabels}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumnVisibility}
            onReorderColumns={handleReorderColumns}
            onReset={resetColumns}
            disabledKeys={['name']}
          />

          {hasPermission('C_SUPPLIERS', 'create') && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm Nhà Cung Cấp
            </button>
          )}
        </div>
      </div>

      {/* BẢNG DANH SÁCH NHÀ CUNG CẤP */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <table
            className="w-full text-left text-sm border-collapse"
            style={{
              width: `${getTableWidth(columnOrder.filter((k) => visibleColumns[k]))}px`,
              minWidth: '100%',
              tableLayout: 'fixed'
            }}
          >
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-gray-200 shadow-2xs">
              <tr className="bg-slate-50/95 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider whitespace-nowrap">
                {columnOrder
                  .filter((k) => visibleColumns[k])
                  .map((colKey) => (
                    <th
                      key={colKey}
                      className={`py-3 px-3.5 select-none overflow-hidden ${
                        colKey === 'actions'
                          ? 'sticky-action-th text-center'
                          : colKey === 'stt' || colKey === 'code' || colKey === 'phone' || colKey === 'taxCode' || colKey === 'products'
                          ? 'text-center'
                          : 'th-left'
                      }`}
                      style={{
                        width: `${columnWidths[colKey] || defaultSupplierWidths[colKey]}px`,
                        position: colKey === 'actions' ? 'sticky' : 'relative'
                      }}
                    >
                      <span>{columnLabels[colKey]}</span>
                      {colKey !== 'actions' && (
                        <div className="col-resizer" onMouseDown={(e) => startResize(colKey, e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      )}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length || 11} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh sách nhà cung cấp...</p>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length || 11} className="py-12 text-center text-gray-500">
                    Chưa có nhà cung cấp nào
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {columnOrder
                      .filter((k) => visibleColumns[k])
                      .map((colKey) => {
                        switch (colKey) {
                          case 'stt':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 text-center text-gray-500 text-xs font-semibold whitespace-nowrap overflow-hidden">
                                {startIndex + idx + 1}
                              </td>
                            );
                          case 'code':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 font-mono font-bold text-[#E53935] text-xs whitespace-nowrap overflow-hidden text-center">
                                {s.code}
                              </td>
                            );
                          case 'name':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 overflow-hidden">
                                <div className="font-semibold text-gray-900 text-sm truncate leading-snug" title={s.name}>
                                  {s.name}
                                </div>
                              </td>
                            );
                          case 'contactPerson':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 text-xs text-gray-700 overflow-hidden">
                                {s.contactPerson ? (
                                  <div className="truncate font-medium text-gray-800" title={s.contactPerson}>
                                    {s.contactPerson}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic text-[11px]">-</span>
                                )}
                              </td>
                            );
                          case 'phone':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 text-xs text-center overflow-hidden">
                                {s.phone ? (
                                  <a
                                    href={`tel:${s.phone}`}
                                    className="inline-flex items-center gap-1 font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate"
                                    title={s.phone}
                                  >
                                    <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                                    <span>{s.phone}</span>
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic text-[11px]">-</span>
                                )}
                              </td>
                            );
                          case 'email':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 text-xs text-gray-600 overflow-hidden">
                                {s.email ? (
                                  <a
                                    href={`mailto:${s.email}`}
                                    className="inline-flex items-center gap-1 text-gray-700 hover:text-blue-600 hover:underline truncate"
                                    title={s.email}
                                  >
                                    <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="truncate">{s.email}</span>
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic text-[11px]">-</span>
                                )}
                              </td>
                            );
                          case 'taxCode':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 text-xs text-center overflow-hidden">
                                {s.taxCode ? (
                                  <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200" title={s.taxCode}>
                                    {s.taxCode}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic text-[11px]">-</span>
                                )}
                              </td>
                            );
                          case 'address':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 text-xs text-gray-600 overflow-hidden">
                                {s.address ? (
                                  <div className="flex items-center gap-1 truncate text-gray-600" title={s.address}>
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span className="truncate">{s.address}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic text-[11px]">-</span>
                                )}
                              </td>
                            );
                          case 'notes':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 text-xs text-gray-500 overflow-hidden">
                                {s.notes ? (
                                  <div className="truncate text-gray-600" title={s.notes}>
                                    {s.notes}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic text-[11px]">-</span>
                                )}
                              </td>
                            );
                          case 'products':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 text-center whitespace-nowrap overflow-hidden">
                                <button
                                  onClick={() => openProductsModal(s)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                  <Package className="w-3.5 h-3.5" />
                                  <span>{s._count?.products || 0} Mặt hàng</span>
                                </button>
                              </td>
                            );
                          case 'actions':
                            return (
                              <td key={colKey} className="py-2.5 px-3.5 text-center sticky-action-td whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1 w-full">
                                  <button
                                    onClick={() => openProductsModal(s)}
                                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                    title="Xem danh sách sản phẩm của NCC"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {hasPermission('C_SUPPLIERS', 'update') && (
                                    <button
                                      onClick={() => openEditModal(s)}
                                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                      title="Sửa thông tin NCC"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  {hasPermission('C_SUPPLIERS', 'delete') && (
                                    <button
                                      onClick={() => handleDelete(s)}
                                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                      title="Xóa NCC"
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
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={suppliers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="nhà cung cấp"
        />
      </div>

      {/* MODAL THÊM / SỬA NHÀ CUNG CẤP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#E53935]" />
                <h3 className="font-bold text-gray-900">
                  {editingSupplier ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#E53935] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mã NCC (tùy chọn)</label>
                  <input
                    type="text"
                    disabled={!!editingSupplier}
                    placeholder="Tự sinh nếu trống"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mã số thuế</label>
                  <input
                    type="text"
                    placeholder="Mã số thuế doanh nghiệp"
                    value={formData.taxCode}
                    onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên Nhà Cung Cấp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Công ty TNHH Double A (Việt Nam)..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="Hotline / SĐT cố định"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@supplier.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ trụ sở / Nhà máy</label>
                <input
                  type="text"
                  placeholder="Địa chỉ sản xuất, văn phòng đại diện..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Người đại diện liên hệ</label>
                <input
                  type="text"
                  placeholder="Họ tên & Chức vụ đại diện kinh doanh"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú chính sách</label>
                <textarea
                  rows={2}
                  placeholder="Chính sách chiết khấu, thời hạn công nợ gối đầu..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 text-xs border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {editingSupplier ? 'Lưu thay đổi' : 'Tạo NCC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CÁC MẶT HÀNG DO NCC CUNG CẤP */}
      {isProductsModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-gray-900">
                    Mặt Hàng Do [{selectedSupplier.name}] Cung Ứng
                  </h3>
                  <p className="text-xs text-gray-500">Mã: {selectedSupplier.code}</p>
                </div>
              </div>
              <button
                onClick={() => setIsProductsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingProducts ? (
                <div className="py-12 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-xs">Đang tải danh sách hàng hóa...</p>
                </div>
              ) : supplierProducts.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Nhà cung cấp này hiện chưa được gán vào mặt hàng nào trong kho
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 uppercase font-bold text-[10px]">
                      <th className="p-2.5 text-center w-12">STT</th>
                      <th className="p-2.5 text-center">Mã SKU</th>
                      <th className="p-2.5">Tên sản phẩm</th>
                      <th className="p-2.5 text-center">ĐVT</th>
                      <th className="p-2.5 text-center">Giá vốn</th>
                      <th className="p-2.5 text-center">Giá bán</th>
                      <th className="p-2.5 text-center">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supplierProducts.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-2.5 text-center font-medium text-gray-500 tabular-nums w-12">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-gray-800 text-center">{p.code}</td>
                        <td className="p-2.5 font-semibold text-gray-900">{p.name}</td>
                        <td className="p-2.5 text-center text-gray-500">{p.unit}</td>
                        <td className="p-2.5 text-center font-medium text-gray-600">
                          {formatVND(Number(p.costPrice))}
                        </td>
                        <td className="p-2.5 text-center font-bold text-[#E53935]">
                          {formatVND(Number(p.sellingPrice))}
                        </td>
                        <td className="p-2.5 text-center font-bold text-blue-600">
                          {p.stockQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
