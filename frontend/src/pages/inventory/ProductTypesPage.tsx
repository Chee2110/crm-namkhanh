import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Warehouse as WarehouseIcon
} from 'lucide-react';
import { api } from '../../services/api';
import { ProductType, Category } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTableResize } from '../../hooks/useTableResize';
import { ColumnCustomizerDropdown } from '../../components/common/ColumnCustomizerDropdown';
import { withActionsLast } from '../../utils/columnOrder';
import { TablePagination } from '../../components/common/TablePagination';
import { useAutoTablePagination } from '../../hooks/useAutoTablePagination';
import { SearchInput } from '../../components/common/SearchInput';

interface ProductTypesPageProps {
  headerSlot?: React.ReactNode;
}

export const ProductTypesPage: React.FC<ProductTypesPageProps> = ({ headerSlot }) => {
  const { hasPermission } = useAuth();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Pagination (vừa vặn màn hình laptop, tự động tăng/giảm dòng khi zoom)
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    startIndex,
    paginate: paginateProductTypes
  } = useAutoTablePagination({
    totalItems: productTypes.length,
    rowHeight: 34,
    topOffset: 250,
    minRows: 6,
    maxRows: 50,
  });

  const defaultColOrder = ['stt', 'code', 'name', 'category', 'unit', 'skuCount', 'actions'];

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'Mã loại',
    name: 'Tên loại hàng hóa',
    category: 'Danh mục',
    unit: 'ĐVT',
    skuCount: 'Số hàng hóa',
    actions: 'Thao tác'
  };

  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    name: true,
    category: true,
    unit: true,
    skuCount: true,
    actions: true
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_product_types_visible_cols');
      return saved ? JSON.parse(saved) : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_product_types_col_order');
      return saved ? withActionsLast(JSON.parse(saved), defaultColOrder) : defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const defaultTypeWidths: Record<string, number> = {
    stt: 60,
    code: 140,
    name: 260,
    category: 260,
    unit: 110,
    skuCount: 140,
    actions: 85
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'product_types_v3',
    defaultWidths: defaultTypeWidths,
    minWidth: 60,
    minWidths: {
      stt: 50,
      code: 110,
      name: 180,
      category: 180,
      unit: 80,
      skuCount: 120,
      actions: 75
    }
  });

  const handleReorderColumns = (newOrder: string[]) => {
    const normalized = withActionsLast(newOrder, defaultColOrder);
    setColumnOrder(normalized);
    try {
      localStorage.setItem('namkhanh_product_types_col_order', JSON.stringify(normalized));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleColumnVisibility = (colKey: string) => {
    const updated = { ...visibleColumns, [colKey]: !visibleColumns[colKey] };
    setVisibleColumns(updated);
    try {
      localStorage.setItem('namkhanh_product_types_visible_cols', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    try {
      localStorage.setItem('namkhanh_product_types_visible_cols', JSON.stringify(defaultVisibleCols));
      localStorage.removeItem('namkhanh_product_types_col_order');
    } catch (e) {
      console.error(e);
    }
  };

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: '',
    unit: 'Ream',
    description: '',
    status: 'ACTIVE'
  });

  const loadCategories = async () => {
    try {
      const resCats = await api.get<Category[]>('/categories');
      setCategories(resCats.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
    }
  };

  const loadProductTypes = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (categoryFilter) query.append('categoryId', categoryFilter);

      const resTypes = await api.get<ProductType[]>(`/product-types?${query.toString()}`);
      setProductTypes(resTypes.data || []);
    } catch (err) {
      console.error('Lỗi khi tải loại hàng hóa:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadData = async (silent: boolean = false) => {
    if (categories.length === 0) {
      loadCategories();
    }
    await loadProductTypes(silent);
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    setCurrentPage(1);
    if (isFirstMount.current) {
      isFirstMount.current = false;
      loadCategories();
      loadProductTypes(false);
      return;
    }
    loadProductTypes(true);
  }, [search, categoryFilter]);

  const paginatedProductTypes = paginateProductTypes(productTypes);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProductTypes(true);
  };

  const openAddModal = () => {
    setEditingType(null);
    setFormData({
      code: '',
      name: '',
      categoryId: categories[0]?.id || '',
      unit: 'Ream',
      description: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: ProductType) => {
    setEditingType(t);
    setFormData({
      code: t.code,
      name: t.name,
      categoryId: t.categoryId,
      unit: t.unit || 'Ream',
      description: t.description || '',
      status: t.status
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name || !formData.categoryId) {
      setFormError('Vui lòng điền tên loại hàng và chọn danh mục cha');
      return;
    }

    try {
      if (editingType) {
        await api.put(`/product-types/${editingType.id}`, formData);
      } else {
        if (!formData.code) {
          setFormError('Vui lòng nhập mã loại hàng');
          return;
        }
        await api.post('/product-types', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Lỗi khi lưu loại hàng hóa');
    }
  };

  const handleDelete = async (t: ProductType) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa loại hàng "${t.name}" (${t.code})?`)) return;
    try {
      await api.delete(`/product-types/${t.id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa loại hàng đang có sản phẩm con!');
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-82px)] min-h-[calc(100dvh-82px)] pb-1">
      {/* KHỐI TẬP TRUNG: TIÊU ĐỀ, TABS & THANH CÔNG CỤ (GỘP THÀNH 1 KHỐI) */}
      <div className="card p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-100/90 shadow-sm bg-white/95 backdrop-blur-md space-y-2 shrink-0 mb-2.5">
        {headerSlot}
        {headerSlot && <div className="border-t border-slate-100" />}

        {/* THANH CÔNG CỤ: BỘ LỌC, TÌM KIẾM & NÚT THAO TÁC */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#E53935]"
              style={{ width: '200px', height: '32px' }}
            >
              <option value="">-- Tất cả danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm">
              <SearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                onSearchImmediate={() => loadProductTypes(true)}
                placeholder="Tìm mã, tên loại hàng..."
              />
            </form>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ColumnCustomizerDropdown
              columnOrder={columnOrder}
              columnLabels={columnLabels}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumnVisibility}
              onReorderColumns={handleReorderColumns}
              onReset={resetColumns}
              disabledKeys={['code', 'name']}
              buttonStyle={{ height: '32px' }}
            />

            {hasPermission('C_PRODUCT_TYPES', 'create') && (
              <button
                onClick={openAddModal}
                className="btn btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap shadow-glow"
                style={{ padding: '0.35rem 0.75rem', fontSize: '12.5px', height: '32px' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Loại Hàng</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH LOẠI HÀNG */}
      <div className="card rounded-2xl border border-slate-100/80 shadow-card overflow-hidden p-0 flex flex-col flex-1 min-h-0">
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
              <tr className="bg-slate-50 text-gray-600 uppercase text-[11px] font-semibold tracking-wider whitespace-nowrap">
                {columnOrder
                  .filter((k) => visibleColumns[k])
                  .map((colKey) => (
                    <th
                      key={colKey}
                      className={`py-1.5 ${colKey === 'actions' ? 'px-1.5' : 'px-2.5'} select-none overflow-hidden ${
                        colKey === 'actions'
                          ? 'sticky-action-th text-center'
                          : colKey === 'stt' || colKey === 'unit' || colKey === 'skuCount'
                          ? 'text-center'
                          : ''
                      }`}
                      style={{
                        width: `${columnWidths[colKey] || defaultTypeWidths[colKey]}px`,
                        position: colKey === 'actions' ? 'sticky' : 'relative'
                      }}
                    >
                      <span>{columnLabels[colKey]}</span>
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
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length || 7} className="py-8 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh mục loại hàng...</p>
                  </td>
                </tr>
              ) : productTypes.length === 0 ? (
                <tr>
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length || 7} className="py-8 text-center text-gray-500">
                    Chưa có loại hàng hóa nào
                  </td>
                </tr>
              ) : (
                paginatedProductTypes.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    {columnOrder
                      .filter((k) => visibleColumns[k])
                      .map((colKey) => {
                        switch (colKey) {
                          case 'stt':
                            return (
                              <td key={colKey} className="py-1 px-2.5 text-center text-gray-500 text-xs font-semibold whitespace-nowrap overflow-hidden">
                                {startIndex + idx + 1}
                              </td>
                            );
                          case 'code':
                            return (
                              <td key={colKey} className="py-1 px-2.5 font-mono font-bold text-[#E53935] text-xs whitespace-nowrap overflow-hidden text-center">
                                {t.code}
                              </td>
                            );
                          case 'name':
                            return (
                              <td key={colKey} className="py-1 px-2.5 overflow-hidden">
                                <div className="font-semibold text-gray-900 text-xs truncate leading-normal" title={t.name}>
                                  {t.name}
                                </div>
                              </td>
                            );
                          case 'category':
                            return (
                              <td key={colKey} className="py-1 px-2.5 text-xs font-medium text-gray-700">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 font-semibold text-gray-800" title={t.category?.name || 'N/A'}>
                                  <Layers className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                  <span className="whitespace-normal break-words leading-tight">{t.category?.name || 'N/A'}</span>
                                </span>
                              </td>
                            );
                          case 'unit':
                            return (
                              <td key={colKey} className="py-1 px-2.5 text-center text-xs font-semibold text-gray-700 whitespace-nowrap overflow-hidden">
                                {t.unit || 'Sp'}
                              </td>
                            );
                          case 'skuCount':
                            return (
                              <td key={colKey} className="py-1 px-2.5 text-center whitespace-nowrap overflow-hidden">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                                  {t._count?.products || 0} Hàng hóa
                                </span>
                              </td>
                            );
                          case 'actions':
                            return (
                              <td key={colKey} className="py-1 px-1.5 text-center sticky-action-td whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1 w-full">
                                  {hasPermission('C_PRODUCT_TYPES', 'update') && (
                                    <button
                                      onClick={() => openEditModal(t)}
                                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                      title="Sửa loại hàng"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {hasPermission('C_PRODUCT_TYPES', 'delete') && (
                                    <button
                                      onClick={() => handleDelete(t)}
                                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                      title="Xóa loại hàng"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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
        <div className="shrink-0">
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={productTypes.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="loại hàng"
          />
        </div>
      </div>

      {/* MODAL THÊM / SỬA LOẠI HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#E53935]" />
                <h3 className="font-bold text-gray-900">
                  {editingType ? 'Chỉnh Sửa Loại Hàng' : 'Thêm Loại Hàng Cấp 2'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#E53935] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Thuộc danh mục (Cấp 1) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">-- Chọn danh mục cha --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mã loại hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingType}
                  placeholder="VD: LH-GIAY-A4, LH-BUT-BI..."
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935] disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên loại hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giấy in A4, Bút bi bấm..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Đơn vị tính chuẩn</label>
                <input
                  type="text"
                  placeholder="VD: Ream, Hộp, Cây, Chiếc..."
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả quy cách</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tiêu chuẩn..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {editingType ? 'Lưu thay đổi' : 'Tạo loại hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
