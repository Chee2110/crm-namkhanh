import React, { useState, useEffect, useMemo } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Building,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Package,
  DollarSign,
  AlertCircle,
  X,
  CheckCircle2,
  Layers,
  Boxes,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../../services/api';
import { Warehouse, Department } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { SearchInput } from '../../components/common/SearchInput';
import { TablePagination } from '../../components/common/TablePagination';

export const WarehousesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
  }, [search]);

  // Reset trang về 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, departmentFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Bộ lọc dữ liệu phía client theo Trạng thái & Đơn vị phụ trách
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      if (statusFilter !== 'ALL' && wh.status !== statusFilter) return false;
      if (departmentFilter !== 'ALL' && wh.departmentId !== departmentFilter) return false;
      return true;
    });
  }, [warehouses, statusFilter, departmentFilter]);

  // Phân trang dữ liệu
  const paginatedWarehouses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredWarehouses.slice(startIndex, startIndex + pageSize);
  }, [filteredWarehouses, currentPage, pageSize]);

  // KPI tóm tắt
  const kpiStats = useMemo(() => {
    const total = warehouses.length;
    const active = warehouses.filter((w) => w.status === 'ACTIVE').length;
    const totalStock = warehouses.reduce((sum, w) => sum + (w.totalStock || 0), 0);
    const totalValue = warehouses.reduce((sum, w) => sum + (w.totalValue || 0), 0);
    return { total, active, totalStock, totalValue };
  }, [warehouses]);

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

  const startIndex = (currentPage - 1) * pageSize;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER & THANH CÔNG CỤ TÌM KIẾM */}
      <div className="card p-6 rounded-3xl border border-slate-100/80 shadow-card bg-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-namkhanh-50 text-namkhanh-600 flex items-center justify-center font-bold shadow-inner">
              <WarehouseIcon className="w-5 h-5" />
            </div>
            <span>Quản Lý Mạng Lưới Kho Vật Lý</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Hệ thống Tổng kho lưu trữ & Các điểm trung chuyển giao nhanh nội thành Nam Khánh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Ô tìm kiếm */}
          <form onSubmit={handleSearch} className="flex-1 sm:w-60 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(val) => setSearch(val)}
              onSearchImmediate={() => loadData()}
              placeholder="Tìm theo tên kho, mã kho..."
              className="input-pill text-xs font-medium w-full"
              style={{ height: '36px', borderRadius: '9999px' }}
            />
          </form>

          {/* Lọc theo Trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input text-xs font-semibold text-slate-700 cursor-pointer shadow-xs"
            style={{
              height: '36px',
              width: '155px',
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: '0.85rem',
              paddingRight: '1.75rem',
              borderRadius: '9999px',
              lineHeight: '36px',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Tạm ngừng</option>
          </select>

          {/* Lọc theo Đơn vị phụ trách */}
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="input text-xs font-semibold text-slate-700 cursor-pointer shadow-xs"
              style={{
                height: '36px',
                width: '185px',
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: '0.85rem',
                paddingRight: '1.75rem',
                borderRadius: '9999px',
                lineHeight: '36px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="ALL">Tất cả đơn vị</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Nút thêm mới */}
          {hasPermission('C_WAREHOUSES', 'create') && (
            <button
              onClick={openAddModal}
              className="btn btn-primary text-xs shadow-glow flex items-center gap-2 whitespace-nowrap h-9 px-4 rounded-xl font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Kho Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. BẢNG DANH SÁCH KHO VẬT LÝ */}
      <div className="card rounded-3xl border border-slate-100/80 shadow-card bg-white overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1050px] border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-gray-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider select-none whitespace-nowrap">
                <th className="py-3 px-3.5 text-center w-12">STT</th>
                <th className="py-3 px-3.5 text-center w-36">Mã kho</th>
                <th className="py-3 px-3.5 text-left min-w-[200px]">Tên kho vật lý</th>
                <th className="py-3 px-3.5 text-left min-w-[220px]">Địa chỉ kho</th>
                <th className="py-3 px-3.5 text-center w-36">Số điện thoại</th>
                <th className="py-3 px-3.5 text-left min-w-[180px]">Đơn vị phụ trách</th>
                <th className="py-3 px-3.5 text-center w-28">Mặt hàng (SKU)</th>
                <th className="py-3 px-3.5 text-right w-28">Số lượng tồn</th>
                <th className="py-3 px-3.5 text-right w-36">Giá trị tồn kho</th>
                <th className="py-3 px-3.5 text-center w-32">Trạng thái</th>
                <th className="py-3 px-3.5 text-center w-24 sticky-action-th">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-namkhanh-600 mb-2"></div>
                    <p className="text-sm font-medium">Đang tải danh sách kho vật lý...</p>
                  </td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-500">
                    <WarehouseIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Không tìm thấy kho vật lý nào</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusFilter !== 'ALL' || departmentFilter !== 'ALL'
                        ? 'Không có kho nào phù hợp với bộ lọc tìm kiếm hiện tại.'
                        : 'Chưa có kho nào được thiết lập trên hệ thống.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedWarehouses.map((wh, idx) => (
                  <tr key={wh.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* STT */}
                    <td className="py-3 px-3.5 text-center text-slate-500 font-semibold">
                      {startIndex + idx + 1}
                    </td>

                    {/* Mã kho */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-namkhanh-600 bg-red-50/80 px-2.5 py-1 rounded-lg border border-red-100/60">
                        {wh.code}
                      </span>
                    </td>

                    {/* Tên kho */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-namkhanh-50 text-namkhanh-600 flex items-center justify-center shrink-0 font-bold">
                          <WarehouseIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs block truncate leading-snug" title={wh.name}>
                            {wh.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1 mt-0.5">
                            <Layers className="w-3 h-3 text-slate-400" />
                            {wh.categoryCount || 0} danh mục hàng
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Địa chỉ */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5 text-slate-600 min-w-0 max-w-xs" title={wh.address || 'Chưa cập nhật'}>
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-xs">{wh.address || 'Chưa cập nhật địa chỉ kho'}</span>
                      </div>
                    </td>

                    {/* Điện thoại */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-slate-700 font-mono text-xs">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{wh.phone || '---'}</span>
                      </div>
                    </td>

                    {/* Đơn vị phụ trách */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700 text-xs min-w-0 max-w-xs" title={wh.department?.name || 'Phòng Quản Lý Kho & Vận Chuyển'}>
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{wh.department?.name || 'Phòng Quản Lý Kho & Vận Chuyển'}</span>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {wh.totalSku || 0} SKU
                      </span>
                    </td>

                    {/* Số lượng tồn */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-800 text-xs">
                        {(wh.totalStock || 0).toLocaleString('vi-VN')}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1 font-normal">sp</span>
                    </td>

                    {/* Giá trị tồn kho */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <span className="font-extrabold text-[#EA332A] text-xs">
                        {formatVND(wh.totalValue || 0)}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          wh.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {wh.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngừng'}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap sticky-action-th">
                      <div className="flex items-center justify-center gap-1">
                        {hasPermission('C_WAREHOUSES', 'update') && (
                          <button
                            onClick={() => openEditModal(wh)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa kho"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('C_WAREHOUSES', 'delete') && (
                          <button
                            onClick={() => handleDelete(wh)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa kho (khi không còn hàng)"
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

        {/* THANH TỔNG HỢP Ở ĐÁY TRANG (THEO MẪU ĐẶC TẢ) */}
        <div className="border-t border-slate-200 bg-white py-3 px-6 flex flex-wrap items-center gap-6 sm:gap-10 select-none">
          {/* Mục 1: Icon + Tổng số kho */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#EA332A]" />
            <span className="text-xs text-slate-600 font-medium">
              Tổng số: <strong className="text-blue-700 font-extrabold text-sm">{filteredWarehouses.length}</strong>
            </span>
          </div>

          {/* Mục 2: Kho đang hoạt động */}
          <div className="border-l border-slate-200 pl-6 sm:pl-8">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Kho hoạt động
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {kpiStats.active} <span className="text-xs font-normal text-slate-400">kho</span>
            </p>
          </div>

          {/* Mục 3: Tổng lượng tồn kho */}
          <div className="border-l border-slate-200 pl-6 sm:pl-8">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tổng lượng tồn kho
            </p>
            <p className="text-sm font-bold text-emerald-600 mt-0.5">
              {kpiStats.totalStock.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">sp</span>
            </p>
          </div>

          {/* Mục 4: Tổng giá trị tồn kho */}
          <div className="border-l border-slate-200 pl-6 sm:pl-8">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tổng giá trị tồn kho
            </p>
            <p className="text-sm font-bold text-[#EA332A] mt-0.5">
              {formatVND(kpiStats.totalValue)}
            </p>
          </div>
        </div>

        {/* Thanh phân trang */}
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredWarehouses.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 15, 25, 50, 100]}
          itemLabel="kho"
        />
      </div>

      {/* 4. MODAL THÊM / CHỈNH SỬA KHO */}
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
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Trạng thái hoạt động</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm ngừng</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
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
