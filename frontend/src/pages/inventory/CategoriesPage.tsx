import React, { useState, useEffect } from 'react';
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

export const CategoriesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

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

  const loadData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (warehouseFilter) query.append('warehouseId', warehouseFilter);

      const [resCat, resWh] = await Promise.all([
        api.get<Category[]>(`/categories?${query.toString()}`),
        api.get<Warehouse[]>('/warehouses')
      ]);
      setCategories(resCat.data || []);
      setWarehouses(resWh.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục hàng hóa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [warehouseFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
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
    <div className="space-y-6">
      {/* HEADER & FILTER */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#E53935]" />
            Danh Mục Hàng Hóa VPP (Cấp 1)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Phân loại cấp cao nhất của ngành hàng văn phòng phẩm & phân bổ kho lưu trữ
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[#E53935]"
          >
            <option value="">Tất cả kho</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <form onSubmit={handleSearch} className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã, tên danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
            />
          </form>

          {hasPermission('C_CATEGORIES', 'create') && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Thêm Danh Mục
            </button>
          )}
        </div>
      </div>

      {/* BẢNG DANH SÁCH DANH MỤC */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-32">Mã danh mục</th>
                <th className="py-3 px-4">Tên danh mục VPP</th>
                <th className="py-3 px-4">Kho vật lý lưu trữ</th>
                <th className="py-3 px-4 text-center w-36">Loại hàng Cấp 2</th>
                <th className="py-3 px-4 text-center w-32">Số lượng SKU</th>
                <th className="py-3 px-4 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh mục hàng hóa...</p>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Chưa có danh mục nào
                  </td>
                </tr>
              ) : (
                categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-gray-500 text-xs font-semibold">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#E53935] text-xs">
                      {cat.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{cat.name}</div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {cat.description || 'Chưa có mô tả'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <WarehouseIcon className="w-3.5 h-3.5 text-gray-400" />
                        <span>{cat.warehouse?.name || 'Chưa chỉ định'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700">
                        {cat._count?.productTypes || 0} Loại hàng
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">
                        {cat._count?.products || 0} SKU
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {hasPermission('C_CATEGORIES', 'update') && (
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa danh mục"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('C_CATEGORIES', 'delete') && (
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa danh mục"
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

      {/* MODAL THÊM / SỬA DANH MỤC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#E53935]" />
                <h3 className="font-bold text-gray-900">
                  {editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục VPP Cấp 1'}
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
