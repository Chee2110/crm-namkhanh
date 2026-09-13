import React, { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  Building,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Package,
  DollarSign,
  AlertCircle,
  X,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { Warehouse, Department } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const WarehousesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    departmentId: '',
    status: 'ACTIVE'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const [resWh, resDept] = await Promise.all([
        api.get<Warehouse[]>(`/warehouses${query}`),
        api.get<Department[]>('/departments?format=flat')
      ]);
      setWarehouses(resWh.data || []);
      setDepartments(resDept.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách kho:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    setEditingWarehouse(null);
    setFormData({
      code: '',
      name: '',
      address: '',
      phone: '',
      departmentId: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setFormData({
      code: wh.code,
      name: wh.name,
      address: wh.address || '',
      phone: wh.phone || '',
      departmentId: wh.departmentId || '',
      status: wh.status
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name) {
      setFormError('Vui lòng nhập tên kho');
      return;
    }

    try {
      if (editingWarehouse) {
        await api.put(`/warehouses/${editingWarehouse.id}`, formData);
      } else {
        if (!formData.code) {
          setFormError('Vui lòng nhập mã kho');
          return;
        }
        await api.post('/warehouses', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin kho');
    }
  };

  const handleDelete = async (wh: Warehouse) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa kho "${wh.name}" (${wh.code})?`)) return;
    try {
      await api.delete(`/warehouses/${wh.id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa kho khi đang có hàng tồn!');
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5 text-[#E53935]" />
            Quản Lý Mạng Lưới Kho Vật Lý
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Hệ thống Tổng kho lưu trữ & Các điểm trung chuyển giao nhanh nội thành Nam Khánh
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên kho, mã kho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
            />
          </form>

          {hasPermission('C_WAREHOUSES', 'create') && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Thêm Kho Mới
            </button>
          )}
        </div>
      </div>

      {/* DANH SÁCH KHO DẠNG THẺ GRID & BẢNG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
            <p>Đang tải danh sách kho vật lý...</p>
          </div>
        ) : warehouses.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            <WarehouseIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Chưa có kho nào được thiết lập</p>
          </div>
        ) : (
          warehouses.map((wh, idx) => (
            <div
              key={wh.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#E53935] font-bold">
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{wh.name}</h3>
                      <span className="font-mono text-xs text-[#E53935] font-semibold">{wh.code}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      wh.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {wh.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngừng'}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{wh.address || 'Chưa cập nhật địa chỉ kho'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{wh.phone || '(024) 3768 9999'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>Phụ trách: <strong>{wh.department?.name || 'Phòng Quản Lý Kho & Vận Chuyển'}</strong></span>
                  </div>
                </div>

                {/* Thống kê hàng lưu trong kho */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center bg-gray-50/70 p-2.5 rounded-lg">
                  <div>
                    <p className="text-[11px] text-gray-500">Mặt hàng (SKU)</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{wh.totalSku || 0}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Số lượng tồn</p>
                    <p className="text-sm font-bold text-blue-600 mt-0.5">
                      {(wh.totalStock || 0).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Giá trị tồn kho</p>
                    <p className="text-sm font-bold text-[#E53935] mt-0.5">
                      {formatVND(wh.totalValue || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thao tác */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">
                  {wh.categoryCount || 0} Danh mục hàng trực thuộc
                </span>

                <div className="flex items-center gap-1">
                  {hasPermission('C_WAREHOUSES', 'update') && (
                    <button
                      onClick={() => openEditModal(wh)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa kho"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {hasPermission('C_WAREHOUSES', 'delete') && (
                    <button
                      onClick={() => handleDelete(wh)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa kho (khi không còn hàng)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL THÊM / CHỈNH SỬA KHO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2">
                <WarehouseIcon className="w-5 h-5 text-[#E53935]" />
                <h3 className="font-bold text-gray-900">
                  {editingWarehouse ? 'Chỉnh Sửa Kho Vật Lý' : 'Thêm Kho Vật Lý Mới'}
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
                  Mã kho <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingWarehouse}
                  placeholder="VD: KHO-CAUGIAY, KHO-DONGDA..."
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935] disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên kho <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tổng kho Cầu Giấy, Kho trung tâm..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ kho</label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, quận huyện..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  placeholder="SĐT thủ kho / Hotline kho..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Đơn vị quản lý</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">-- Chọn đơn vị phòng ban phụ trách --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
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
                  {editingWarehouse ? 'Lưu thay đổi' : 'Tạo kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
