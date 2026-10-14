import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Package
} from 'lucide-react';
import { api } from '../../services/api';
import { Category, Warehouse } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TablePagination } from '../../components/common/TablePagination';
import { useAutoTablePagination } from '../../hooks/useAutoTablePagination';
import { SearchInput } from '../../components/common/SearchInput';
import { useTableResize } from '../../hooks/useTableResize';

interface CategoriesPageProps {
  headerSlot?: React.ReactNode;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ headerSlot }) => {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  // Pagination (vừa vặn màn hình laptop, tự động tăng/giảm dòng khi zoom)
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    startIndex,
    paginate: paginateCategories
  } = useAutoTablePagination({
    totalItems: categories.length,
    rowHeight: 42,
    topOffset: 290,
    minRows: 4,
    maxRows: 50,
  });

  const defaultCategoryWidths: Record<string, number> = {
    stt: 60,
    code: 140,
    name: 260,
    warehouse: 250,
    types: 130,
    skuCount: 140,
    actions: 95
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'categories_v2',
    defaultWidths: defaultCategoryWidths,
    minWidth: 60,
    minWidths: {
      stt: 50,
      code: 110,
      name: 180,
      warehouse: 180,
      types: 110,
      skuCount: 120,
      actions: 80
    }
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    warehouseId: '',
    description: '',
    status: 'ACTIVE'
  });

  const loadWarehouses = async () => {
    try {
      const resWh = await api.get<Warehouse[]>('/warehouses');
      setWarehouses(resWh.data || []);
    } catch (err) {
      console.error('Lỗi khi tải kho:', err);
    }
  };

  const loadCategories = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (warehouseFilter) query.append('warehouseId', warehouseFilter);

      const resCat = await api.get<Category[]>(`/categories?${query.toString()}`);
      setCategories(resCat.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục hàng hóa:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadData = async (silent: boolean = false) => {
    if (warehouses.length === 0) {
      loadWarehouses();
    }
    await loadCategories(silent);
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    setCurrentPage(1);
    if (isFirstMount.current) {
      isFirstMount.current = false;
      loadWarehouses();
      loadCategories(false);
      return;
    }
    loadCategories(true);
  }, [search, warehouseFilter]);

  const paginatedCategories = paginateCategories(categories);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCategories(true);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      code: '',
      name: '',
      warehouseId: warehouses[0]?.id || '',
      description: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      code: cat.code,
      name: cat.name,
      warehouseId: cat.warehouseId || '',
      description: cat.description || '',
      status: cat.status
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name) {
      setFormError('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
      } else {
        if (!formData.code) {
          setFormError('Vui lòng nhập mã danh mục');
          return;
        }
        await api.post('/categories', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Lỗi khi lưu danh mục');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${cat.name}" (${cat.code})?`)) return;
    try {
      await api.delete(`/categories/${cat.id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa danh mục đang có loại hàng con hoặc sản phẩm!');
    }
  };

  return (
    <div className="space-y-3 pb-3">
      {/* KHỐI TẬP TRUNG: TIÊU ĐỀ, TABS & THANH CÔNG CỤ (GỘP THÀNH 1 KHỐI) */}
      <div className="card p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-100/90 shadow-sm bg-white/95 backdrop-blur-md space-y-2">
        {headerSlot}
        {headerSlot && <div className="border-t border-slate-100" />}

        {/* THANH CÔNG CỤ: BỘ LỌC, TÌM KIẾM & NÚT THAO TÁC */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="input text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-namkhanh-500"
              style={{ width: '200px', height: '32px' }}
            >
              <option value="">-- Tất cả kho lưu trữ --</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm">
              <SearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                onSearchImmediate={() => loadCategories(true)}
                placeholder="Tìm mã, tên danh mục..."
              />
            </form>
          </div>

          {hasPermission('C_CATEGORIES', 'create') && (
            <button
              onClick={openAddModal}
              className="btn btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap shadow-glow"
              style={{ padding: '0.35rem 0.75rem', fontSize: '12.5px', height: '32px' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Danh Mục</span>
            </button>
          )}
        </div>
      </div>

      {/* BẢNG DANH SÁCH DANH MỤC */}
      <div className="card rounded-3xl border border-slate-100/80 shadow-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm border-collapse"
            style={{
              width: `${getTableWidth(Object.keys(defaultCategoryWidths))}px`,
              minWidth: '100%',
              tableLayout: 'fixed'
            }}
          >
            <thead>
              <tr className="bg-slate-50/90 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider whitespace-nowrap">
                <th className="py-1.5 px-2.5 text-center select-none overflow-hidden" style={{ width: `${columnWidths.stt || defaultCategoryWidths.stt}px`, position: 'relative' }}>
                  <span>STT</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('stt', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-1.5 px-2.5 select-none overflow-hidden" style={{ width: `${columnWidths.code || defaultCategoryWidths.code}px`, position: 'relative' }}>
                  <span>Mã danh mục</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('code', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-1.5 px-2.5 select-none overflow-hidden" style={{ width: `${columnWidths.name || defaultCategoryWidths.name}px`, position: 'relative' }}>
                  <span>Tên danh mục</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('name', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-1.5 px-2.5 select-none overflow-hidden" style={{ width: `${columnWidths.warehouse || defaultCategoryWidths.warehouse}px`, position: 'relative' }}>
                  <span>Kho vật lý lưu trữ</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('warehouse', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-1.5 px-2.5 text-center select-none overflow-hidden" style={{ width: `${columnWidths.types || defaultCategoryWidths.types}px`, position: 'relative' }}>
                  <span>Số loại</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('types', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-1.5 px-2.5 text-center select-none overflow-hidden" style={{ width: `${columnWidths.skuCount || defaultCategoryWidths.skuCount}px`, position: 'relative' }}>
                  <span>Số hàng hóa</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('skuCount', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-1.5 px-2.5 text-center sticky-action-th" style={{ width: `${columnWidths.actions || defaultCategoryWidths.actions}px` }}>
                  <span>Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh mục hàng hóa...</p>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Chưa có danh mục nào
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-1 px-2.5 text-center text-gray-500 text-xs font-semibold whitespace-nowrap overflow-hidden">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-1 px-2.5 font-mono font-bold text-[#E53935] text-xs whitespace-nowrap overflow-hidden text-center">
                      {cat.code}
                    </td>
                    <td className="py-1 px-2.5 overflow-hidden">
                      <div className="font-semibold text-gray-900 text-xs truncate leading-normal" title={cat.name}>
                        {cat.name}
                      </div>
                    </td>
                    <td className="py-1 px-2.5 text-xs font-medium text-gray-700">
                      <div className="flex items-center gap-1.5 min-w-0" title={cat.warehouse?.name || 'Chưa chỉ định'}>
                        <WarehouseIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="whitespace-normal break-words leading-tight">{cat.warehouse?.name || 'Chưa chỉ định'}</span>
                      </div>
                    </td>
                    <td className="py-1 px-2.5 text-center whitespace-nowrap overflow-hidden">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700">
                        {cat._count?.productTypes || 0} Loại
                      </span>
                    </td>
                    <td className="py-1 px-2.5 text-center whitespace-nowrap overflow-hidden">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                        {cat._count?.products || 0} Hàng hóa
                      </span>
                    </td>
                    <td className="py-1 px-2.5 text-center sticky-action-td whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 w-full">
                        {hasPermission('C_CATEGORIES', 'update') && (
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Sửa danh mục"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('C_CATEGORIES', 'delete') && (
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={categories.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="danh mục"
        />
      </div>

      {/* MODAL THÊM / SỬA DANH MỤC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#E53935]" />
                <h3 className="font-bold text-gray-900">
                  {editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Cấp 1'}
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
                  Mã danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingCategory}
                  placeholder="VD: DM-GIAY, DM-BUT..."
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935] disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giấy in văn phòng, Bút viết..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Thuộc kho lưu trữ</label>
                <select
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">-- Chọn kho vật lý lưu trữ --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả quy cách</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả phạm vi nhóm sản phẩm..."
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
                  {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
