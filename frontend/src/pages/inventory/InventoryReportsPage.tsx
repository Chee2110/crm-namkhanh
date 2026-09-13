import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  RefreshCw,
  Layers,
  Package,
  Barcode,
  TrendingDown,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Building2,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { InventoryReportItem, Warehouse, Category } from '../../types';

export const InventoryReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'category' | 'type' | 'product'>('category');
  const [reportData, setReportData] = useState<{
    totalInventoryValue: number;
    items: InventoryReportItem[];
  }>({ totalInventoryValue: 0, items: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW' | 'NORMAL'>('ALL');

  // Warehouses & Categories list for filter dropdowns
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<{ totalInventoryValue: number; items: InventoryReportItem[] }>(
        `/inventory/reports?view=${activeTab}`
      );
      if (res.success && res.data) {
        setReportData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải báo cáo tồn kho');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [whRes, catRes] = await Promise.all([
        api.get<Warehouse[]>('/warehouses'),
        api.get<Category[]>('/categories')
      ]);
      if (whRes.success && whRes.data) setWarehouses(whRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
    } catch {
      // Bỏ qua nếu lỗi
    }
  };

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Filtered items
  const filteredItems = reportData.items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesWarehouse =
      selectedWarehouse === 'ALL' ||
      (item.warehouseName && item.warehouseName.toLowerCase().includes(selectedWarehouse.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      (item.categoryName && item.categoryName.toLowerCase().includes(selectedCategory.toLowerCase()));

    const matchesStatus =
      stockStatusFilter === 'ALL' ||
      (stockStatusFilter === 'LOW' && item.status === 'LOW_STOCK') ||
      (stockStatusFilter === 'NORMAL' && item.status !== 'LOW_STOCK');

    return matchesSearch && matchesWarehouse && matchesCategory && matchesStatus;
  });

  // Calculate summary stats
  const totalDisplayQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalDisplayValue = filteredItems.reduce((sum, item) => sum + item.value, 0);
  const lowStockCount = filteredItems.filter((i) => i.status === 'LOW_STOCK').length;

  // Xuất file CSV / Excel hỗ trợ tiếng Việt (UTF-8 with BOM)
  const handleExportExcel = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeTab === 'category') {
      headers = ['STT', 'Mã Danh Mục', 'Tên Danh Mục', 'Số Lượng Tồn', 'Tổng Giá Trị Tồn (VND)', 'Tỷ Trọng (%)'];
      rows = filteredItems.map((item, idx) => [
        String(idx + 1),
        `"${item.code}"`,
        `"${item.name}"`,
        String(item.quantity),
        String(item.value),
        `"${item.percentage}%"`
      ]);
    } else if (activeTab === 'type') {
      headers = ['STT', 'Mã Loại', 'Tên Loại Hàng', 'Thuộc Danh Mục', 'ĐVT Chuẩn', 'Số Lượng Tồn', 'Tổng Giá Trị Tồn (VND)', 'Tỷ Trọng (%)'];
      rows = filteredItems.map((item, idx) => [
        String(idx + 1),
        `"${item.code}"`,
        `"${item.name}"`,
        `"${item.categoryName || ''}"`,
        `"${item.unit || ''}"`,
        String(item.quantity),
        String(item.value),
        `"${item.percentage}%"`
      ]);
    } else {
      headers = ['STT', 'Mã SKU', 'Mã Vạch Barcode', 'Tên Sản Phẩm VPP', 'Danh Mục', 'Loại Hàng', 'Kho Lưu Trữ', 'ĐVT', 'Tồn Kho', 'Định Mức Tối Thiểu', 'Giá Nhập Bình Quân (VND)', 'Tổng Giá Trị Tồn (VND)', 'Tỷ Trọng (%)', 'Trạng Thái'];
      rows = filteredItems.map((item, idx) => [
        String(idx + 1),
        `"${item.code}"`,
        `"${item.barcode || 'N/A'}"`,
        `"${item.name}"`,
        `"${item.categoryName || ''}"`,
        `"${item.typeName || ''}"`,
        `"${item.warehouseName || ''}"`,
        `"${item.unit || ''}"`,
        String(item.quantity),
        String(item.minStockLevel || 0),
        String(item.costPrice || 0),
        String(item.value),
        `"${item.percentage}%"`,
        `"${item.status === 'LOW_STOCK' ? 'DƯỚI ĐỊNH MỨC' : 'AN TOÀN'}"`
      ]);
    }

    const csvContent = '\uFEFF' + [
      ['BÁO CÁO TỒN KHO VĂN PHÒNG PHẨM - CÔNG TY TNHH NK NAM KHÁNH'],
      [`Góc nhìn: ${activeTab === 'category' ? 'Theo Danh Mục Cấp 1' : activeTab === 'type' ? 'Theo Loại Hàng Cấp 2' : 'Chi Tiết Sản Phẩm SKU'}`],
      [`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`],
      [`Tổng giá trị tồn: ${formatCurrency(totalDisplayValue)}`],
      [],
      headers,
      ...rows
    ].map((e) => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Ton_Kho_NamKhanh_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // In ấn báo cáo
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Công cụ tác vụ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#E53935]">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  Báo Cáo Tồn Kho Đa Chiều
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Theo dõi số lượng, giá vốn bình quân gia quyền và giá trị tồn kho toàn diện
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 print:hidden">
            <button
              onClick={fetchReport}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              title="Xuất file CSV/Excel UTF-8 tiếng Việt"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#E53935] hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              title="In phiếu báo cáo A4"
            >
              <Printer className="w-4 h-4" />
              <span>In Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* 3 Thẻ Tabs chuyển đổi góc nhìn */}
        <div className="mt-6 border-b border-gray-200 print:hidden">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('category')}
              className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'category'
                  ? 'border-[#E53935] text-[#E53935]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Theo Danh Mục (Cấp 1)</span>
            </button>

            <button
              onClick={() => setActiveTab('type')}
              className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'type'
                  ? 'border-[#E53935] text-[#E53935]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Theo Loại Hàng (Cấp 2)</span>
            </button>

            <button
              onClick={() => setActiveTab('product')}
              className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'product'
                  ? 'border-[#E53935] text-[#E53935]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Barcode className="w-4 h-4" />
              <span>Chi Tiết Từng Sản Phẩm SKU</span>
            </button>
          </div>
        </div>

        {/* Thống kê vắn tắt / Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-50/50 to-rose-50 border border-red-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-[#E53935] text-white flex items-center justify-center shadow-md">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Tổng Giá Trị Tồn Kho</p>
              <p className="text-base lg:text-lg font-bold text-gray-900 leading-tight mt-0.5">
                {formatCurrency(totalDisplayValue)}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50 border border-blue-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Tổng Số Lượng Tồn</p>
              <p className="text-base lg:text-lg font-bold text-gray-900 leading-tight mt-0.5">
                {formatNumber(totalDisplayQuantity)} đơn vị
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50 border border-amber-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Dưới Định Mức Tối Thiểu</p>
              <p className="text-base lg:text-lg font-bold text-amber-700 leading-tight mt-0.5">
                {lowStockCount} mặt hàng
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50 border border-emerald-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Tỷ Trọng Hiển Thị</p>
              <p className="text-base lg:text-lg font-bold text-emerald-700 leading-tight mt-0.5">
                {reportData.totalInventoryValue > 0
                  ? ((totalDisplayValue / reportData.totalInventoryValue) * 100).toFixed(1)
                  : '100'}%
              </p>
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between mt-6 pt-4 border-t border-gray-100 print:hidden">
          <div className="w-full lg:w-96 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, mã SKU, mã vạch barcode..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935] focus:border-transparent"
            />
          </div>

          <div className="w-full lg:w-auto flex flex-wrap items-center gap-2.5">
            {/* Lọc theo Kho (cho tab SKU) */}
            {activeTab === 'product' && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E53935]"
                >
                  <option value="ALL">Tất cả kho</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.name}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Lọc theo Trạng thái tồn kho */}
            {activeTab === 'product' && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E53935]"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="LOW">Cảnh báo: Dưới định mức</option>
                  <option value="NORMAL">Tồn an toàn</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HEADER CHO BẢN IN (PRINT TEMPLATE) */}
      <div className="hidden print:block mb-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">CÔNG TY TNHH NK NAM KHÁNH</h1>
            <p className="text-xs text-gray-600">Địa chỉ: Số 123 Phố Trương Định, Q. Hai Bà Trưng, Hà Nội</p>
            <p className="text-xs text-gray-600">Hotline: 024.3868.9999 - Email: contact@namkhanh.vn</p>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold text-[#E53935]">BÁO CÁO TỒN KHO VĂN PHÒNG PHẨM</h2>
            <p className="text-xs text-gray-600">
              Góc nhìn: {activeTab === 'category' ? 'Theo Danh Mục Cấp 1' : activeTab === 'type' ? 'Theo Loại Hàng Cấp 2' : 'Chi Tiết Từng Sản Phẩm SKU'}
            </p>
            <p className="text-xs text-gray-600">Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU BÁO CÁO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#E53935]" />
            <span>Đang tải số liệu báo cáo tồn kho...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-sm bg-red-50">
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Không tìm thấy bản ghi tồn kho nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              {/* TAB 1: BÁO CÁO THEO DANH MỤC CẤP 1 */}
              {activeTab === 'category' && (
                <>
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-12 text-center">STT</th>
                      <th className="py-3 px-4 w-32">Mã Danh Mục</th>
                      <th className="py-3 px-4">Tên Danh Mục Hàng Hóa</th>
                      <th className="py-3 px-4 text-right">Tổng SL Tồn</th>
                      <th className="py-3 px-4 text-right">Giá Trị Tồn (VND)</th>
                      <th className="py-3 px-4 text-right w-36">Tỷ Trọng (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                        <td className="py-3 px-4 text-center text-gray-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-gray-800">{item.code}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-700">
                          {formatNumber(item.quantity)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                          {formatCurrency(item.value)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden hidden sm:block">
                              <div
                                className="bg-[#E53935] h-2 rounded-full"
                                style={{ width: `${Math.min(100, Number(item.percentage))}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-700 w-10 text-right">
                              {item.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Dòng tổng cộng */}
                    <tr className="bg-gray-100/80 font-bold text-gray-900 border-t-2 border-gray-300">
                      <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-[11px]">
                        Tổng Cộng:
                      </td>
                      <td className="py-3 px-4 text-right text-blue-800">
                        {formatNumber(totalDisplayQuantity)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#E53935] text-sm">
                        {formatCurrency(totalDisplayValue)}
                      </td>
                      <td className="py-3 px-4 text-right">100%</td>
                    </tr>
                  </tbody>
                </>
              )}

              {/* TAB 2: BÁO CÁO THEO LOẠI HÀNG CẤP 2 */}
              {activeTab === 'type' && (
                <>
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-12 text-center">STT</th>
                      <th className="py-3 px-4 w-28">Mã Loại</th>
                      <th className="py-3 px-4">Tên Loại Hàng</th>
                      <th className="py-3 px-4">Thuộc Danh Mục</th>
                      <th className="py-3 px-4 w-20 text-center">ĐVT</th>
                      <th className="py-3 px-4 text-right">SL Tồn</th>
                      <th className="py-3 px-4 text-right">Giá Trị Tồn (VND)</th>
                      <th className="py-3 px-4 text-right w-36">Tỷ Trọng (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                        <td className="py-3 px-4 text-center text-gray-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-gray-800">{item.code}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                        <td className="py-3 px-4 text-gray-600">{item.categoryName || 'Chung'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px]">
                            {item.unit || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-700">
                          {formatNumber(item.quantity)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                          {formatCurrency(item.value)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden hidden sm:block">
                              <div
                                className="bg-[#E53935] h-2 rounded-full"
                                style={{ width: `${Math.min(100, Number(item.percentage))}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-700 w-10 text-right">
                              {item.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Dòng tổng cộng */}
                    <tr className="bg-gray-100/80 font-bold text-gray-900 border-t-2 border-gray-300">
                      <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-[11px]">
                        Tổng Cộng:
                      </td>
                      <td className="py-3 px-4 text-right text-blue-800">
                        {formatNumber(totalDisplayQuantity)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#E53935] text-sm">
                        {formatCurrency(totalDisplayValue)}
                      </td>
                      <td className="py-3 px-4 text-right">100%</td>
                    </tr>
                  </tbody>
                </>
              )}

              {/* TAB 3: CHI TIẾT TỪNG SẢN PHẨM SKU */}
              {activeTab === 'product' && (
                <>
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3 w-10 text-center">STT</th>
                      <th className="py-3 px-3 w-28">Mã SKU</th>
                      <th className="py-3 px-3 w-28">Mã Vạch</th>
                      <th className="py-3 px-4">Tên Sản Phẩm VPP</th>
                      <th className="py-3 px-3">Loại / Danh Mục</th>
                      <th className="py-3 px-3">Kho</th>
                      <th className="py-3 px-2 text-center">ĐVT</th>
                      <th className="py-3 px-3 text-right">Tồn Kho</th>
                      <th className="py-3 px-3 text-right">Định Mức</th>
                      <th className="py-3 px-3 text-right">Giá Vốn</th>
                      <th className="py-3 px-3 text-right">Giá Trị Tồn</th>
                      <th className="py-3 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredItems.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-red-50/30 transition-colors ${
                          item.status === 'LOW_STOCK' ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-gray-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-gray-800">{item.code}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-500">{item.barcode || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-[11px]">
                          <div>{item.typeName}</div>
                          <div className="text-gray-400">{item.categoryName}</div>
                        </td>
                        <td className="py-3 px-3 text-gray-700 font-medium">
                          {item.warehouseName || 'Tổng kho'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px]">
                            {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-blue-700">
                          {formatNumber(item.quantity)}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-500 font-medium">
                          {formatNumber(item.minStockLevel || 0)}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-700 font-medium">
                          {formatCurrency(item.costPrice || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">
                          {formatCurrency(item.value)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.status === 'LOW_STOCK' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3" />
                              Dưới định mức
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              An toàn
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Dòng tổng cộng */}
                    <tr className="bg-gray-100/80 font-bold text-gray-900 border-t-2 border-gray-300">
                      <td colSpan={7} className="py-3 px-4 text-right uppercase tracking-wider text-[11px]">
                        Tổng Cộng:
                      </td>
                      <td className="py-3 px-3 text-right text-blue-800">
                        {formatNumber(totalDisplayQuantity)}
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-right"></td>
                      <td className="py-3 px-3 text-right text-[#E53935] text-sm">
                        {formatCurrency(totalDisplayValue)}
                      </td>
                      <td className="py-3 px-3 text-center"></td>
                    </tr>
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </div>

      {/* FOOTER CHỮ KÝ CHO BẢN IN (PRINT TEMPLATE) */}
      <div className="hidden print:block mt-12 pt-6">
        <div className="grid grid-cols-3 text-center text-xs">
          <div>
            <p className="font-bold text-gray-900">NGƯỜI LẬP BÁO CÁO</p>
            <p className="text-gray-500 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
            <div className="h-20"></div>
          </div>
          <div>
            <p className="font-bold text-gray-900">THỦ KHO QUẢN LÝ</p>
            <p className="text-gray-500 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
            <div className="h-20"></div>
          </div>
          <div>
            <p className="font-bold text-gray-900">KẾ TOÁN TRƯỞNG / GIÁM ĐỐC</p>
            <p className="text-gray-500 italic mt-0.5">(Ký, đóng dấu)</p>
            <div className="h-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
