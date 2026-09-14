import React, { useState, useEffect } from 'react';
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

export const ProductTypesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const defaultTypeWidths: Record<string, number> = {
    stt: 60,
    code: 140,
    name: 260,
    category: 200,
    unit: 90,
    skuCount: 130,
    actions: 140
  };

  const { columnWidths, startResize, getTableWidth } = useTableResize({
    tableKey: 'product_types',
    defaultWidths: defaultTypeWidths,
    minWidth: 50,
    minWidths: { stt: 45, actions: 120 }
  });

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

  const loadData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (categoryFilter) query.append('categoryId', categoryFilter);

      const [resTypes, resCats] = await Promise.all([
        api.get<ProductType[]>(`/product-types?${query.toString()}`),
        api.get<Category[]>('/categories')
      ]);
      setProductTypes(resTypes.data || []);
      setCategories(resCats.data || []);
    } catch (err) {
      console.error('Lỗi khi tải loại hàng hóa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
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
    <div className="space-y-6">
      {/* HEADER & FILTER */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#E53935]" />
            Loại Hàng Hóa VPP (Cấp 2)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Đơn vị phân loại chi tiết trực thuộc Danh mục Cấp 1 & dùng trong phân bổ Kế hoạch Kinh doanh
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[#E53935]"
          >
            <option value="">Tất cả danh mục Cấp 1</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <form onSubmit={handleSearch} className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã, tên loại hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
            />
          </form>

          {hasPermission('C_PRODUCT_TYPES', 'create') && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Thêm Loại Hàng
            </button>
          )}
        </div>
      </div>

      {/* BẢNG DANH SÁCH LOẠI HÀNG */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm border-collapse"
            style={{
              width: `${getTableWidth(Object.keys(defaultTypeWidths))}px`,
              minWidth: '100%',
              tableLayout: 'fixed'
            }}
          >
            <thead>
              <tr className="bg-slate-50/90 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider whitespace-nowrap">
                <th className="py-3 px-3.5 text-center select-none overflow-hidden" style={{ width: `${columnWidths.stt || defaultTypeWidths.stt}px`, position: 'relative' }}>
                  <span>STT</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('stt', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-3 px-3.5 select-none overflow-hidden" style={{ width: `${columnWidths.code || defaultTypeWidths.code}px`, position: 'relative' }}>
                  <span>Mã loại</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('code', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-3 px-3.5 select-none overflow-hidden" style={{ width: `${columnWidths.name || defaultTypeWidths.name}px`, position: 'relative' }}>
                  <span>Tên loại hàng hóa VPP</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('name', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-3 px-3.5 select-none overflow-hidden" style={{ width: `${columnWidths.category || defaultTypeWidths.category}px`, position: 'relative' }}>
                  <span>Thuộc danh mục (Cấp 1)</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('category', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-3 px-3.5 text-center select-none overflow-hidden" style={{ width: `${columnWidths.unit || defaultTypeWidths.unit}px`, position: 'relative' }}>
                  <span>ĐVT chuẩn</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('unit', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-3 px-3.5 text-center select-none overflow-hidden" style={{ width: `${columnWidths.skuCount || defaultTypeWidths.skuCount}px`, position: 'relative' }}>
                  <span>Số SKU liên kết</span>
                  <div className="col-resizer" onMouseDown={(e) => startResize('skuCount', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                </th>
                <th className="py-3 px-3.5 text-center sticky-action-th" style={{ width: `${columnWidths.actions || defaultTypeWidths.actions}px` }}>
                  <span>Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh mục loại hàng...</p>
                  </td>
                </tr>
              ) : productTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Chưa có loại hàng hóa nào
                  </td>
                </tr>
              ) : (
                productTypes.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-gray-500 text-xs font-semibold whitespace-nowrap overflow-hidden">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-[#E53935] text-xs whitespace-nowrap overflow-hidden">
                      {t.code}
                    </td>
                    <td className="py-2.5 px-3.5 overflow-hidden">
                      <div className="min-w-0" title={`${t.name}${t.description ? `\n• ${t.description}` : ''}`}>
                        <div className="font-semibold text-gray-900 text-sm truncate leading-snug">
                          {t.name}
                        </div>
                        {t.description && (
                          <div className="text-xs text-gray-400 truncate mt-0.5">
                            {t.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-xs font-medium text-gray-700 whitespace-nowrap overflow-hidden">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 font-semibold text-gray-800" title={t.category?.name || 'N/A'}>
                        <Layers className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="truncate max-w-[150px]">{t.category?.name || 'N/A'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center text-xs font-semibold text-gray-700 whitespace-nowrap overflow-hidden">
                      {t.unit || 'Sp'}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap overflow-hidden">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                        {t._count?.products || 0} SKU
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center sticky-action-td whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {hasPermission('C_PRODUCT_TYPES', 'update') && (
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa loại hàng"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('C_PRODUCT_TYPES', 'delete') && (
                          <button
                            onClick={() => handleDelete(t)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa loại hàng"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* MODAL THÊM / SỬA LOẠI HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#E53935]" />
                <h3 className="font-bold text-gray-900">
                  {editingType ? 'Chỉnh Sửa Loại Hàng' : 'Thêm Loại Hàng VPP Cấp 2'}
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
