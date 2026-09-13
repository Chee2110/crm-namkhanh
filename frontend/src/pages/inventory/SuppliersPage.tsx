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

export const SuppliersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Cấu hình ẩn / hiện cột
  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    name: true,
    contact: true,
    products: true,
    actions: true
  };

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'Mã NCC',
    name: 'Tên Nhà Cung Cấp & MST',
    contact: 'Liên hệ & Địa chỉ',
    products: 'Sản phẩm cung cấp',
    actions: 'Thao tác'
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_suppliers_visible_cols');
      return saved ? JSON.parse(saved) : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const toggleColumnVisibility = (colKey: string) => {
    const updated = { ...visibleColumns, [colKey]: !visibleColumns[colKey] };
    setVisibleColumns(updated);
    try {
      localStorage.setItem('namkhanh_suppliers_visible_cols', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    try {
      localStorage.setItem('namkhanh_suppliers_visible_cols', JSON.stringify(defaultVisibleCols));
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
  }, []);

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
    <div className="space-y-6">
      {/* HEADER & FILTER */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#E53935]" />
            Danh Sách Nhà Cung Cấp VPP (C.6)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Quản trị đối tác phân phối, nhà máy sản xuất (Đồng bộ 2 chiều khi khai báo Hàng hóa mới)
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên NCC, MST, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
            />
          </form>

          {/* Menu ẩn/hiện cột */}
          <div className="relative">
            <button
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Tùy biến hiển thị các cột trên bảng"
            >
              <Columns className="w-3.5 h-3.5 text-gray-500" />
              <span>Tùy chỉnh cột</span>
            </button>

            {isColumnDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-30 space-y-1.5 text-xs">
                <div className="font-bold text-gray-800 pb-1.5 border-b border-gray-100 flex justify-between items-center">
                  <span>Cột hiển thị</span>
                  <button
                    onClick={resetColumns}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Mặc định</span>
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {Object.keys(columnLabels).map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key] ?? true}
                        onChange={() => toggleColumnVisibility(key)}
                        disabled={key === 'name'}
                        className="rounded text-[#E53935]"
                      />
                      <span>{columnLabels[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider">
                {visibleColumns.stt && <th className="py-3 px-4 w-12 text-center">STT</th>}
                {visibleColumns.code && <th className="py-3 px-4 w-32">Mã NCC</th>}
                {visibleColumns.name && <th className="py-3 px-4">Tên Nhà Cung Cấp & MST</th>}
                {visibleColumns.contact && <th className="py-3 px-4">Liên hệ & Địa chỉ</th>}
                {visibleColumns.products && <th className="py-3 px-4 text-center w-36">Sản phẩm cung cấp</th>}
                {visibleColumns.actions && <th className="py-3 px-4 text-center w-28">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length || 6} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh sách nhà cung cấp...</p>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length || 6} className="py-12 text-center text-gray-500">
                    Chưa có nhà cung cấp nào
                  </td>
                </tr>
              ) : (
                suppliers.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    {visibleColumns.stt && (
                      <td className="py-3.5 px-4 text-center text-gray-500 text-xs font-semibold">
                        {idx + 1}
                      </td>
                    )}
                    {visibleColumns.code && (
                      <td className="py-3.5 px-4 font-mono font-bold text-[#E53935] text-xs">
                        {s.code}
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          MST: <span className="font-mono">{s.taxCode || 'N/A'}</span>
                          {s.contactPerson && <span> • Người liên hệ: {s.contactPerson}</span>}
                        </div>
                      </td>
                    )}
                    {visibleColumns.contact && (
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5 font-medium text-gray-800">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{s.phone || 'Chưa có SĐT'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-gray-500 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{s.address || 'Chưa cập nhật'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.products && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openProductsModal(s)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" />
                          {s._count?.products || 0} Mặt hàng
                        </button>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openProductsModal(s)}
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Xem danh sách sản phẩm của NCC"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasPermission('C_SUPPLIERS', 'update') && (
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Sửa thông tin NCC"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('C_SUPPLIERS', 'delete') && (
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa NCC"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM / SỬA NHÀ CUNG CẤP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#E53935]" />
                <h3 className="font-bold text-gray-900">
                  {editingSupplier ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp VPP Mới'}
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
                      <th className="p-2.5">Mã SKU</th>
                      <th className="p-2.5">Tên sản phẩm</th>
                      <th className="p-2.5 text-center">ĐVT</th>
                      <th className="p-2.5 text-right">Giá vốn</th>
                      <th className="p-2.5 text-right">Giá bán</th>
                      <th className="p-2.5 text-center">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supplierProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-2.5 font-mono font-bold text-gray-800">{p.code}</td>
                        <td className="p-2.5 font-semibold text-gray-900">{p.name}</td>
                        <td className="p-2.5 text-center text-gray-500">{p.unit}</td>
                        <td className="p-2.5 text-right font-medium text-gray-600">
                          {formatVND(Number(p.costPrice))}
                        </td>
                        <td className="p-2.5 text-right font-bold text-[#E53935]">
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
