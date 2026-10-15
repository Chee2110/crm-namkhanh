import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  DollarSign,
  Layers,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  Package,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  PackagePlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { InventoryOverview } from '../../types';
import { TablePagination } from '../../components/common/TablePagination';

export const InventoryOverviewPage: React.FC = () => {
  const [data, setData] = useState<InventoryOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Phân trang: Cơ cấu giá trị tồn kho theo danh mục
  const [catPage, setCatPage] = useState(1);
  const [catPageSize, setCatPageSize] = useState(7);

  // Phân trang: Quy mô kho vật lý
  const [whPage, setWhPage] = useState(1);
  const [whPageSize, setWhPageSize] = useState(3);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get<InventoryOverview>('/inventory/overview');
      setData(res.data);
    } catch (err) {
      console.error('Lỗi khi tải tổng quan kho:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  // Danh mục sắp xếp theo giá trị giảm dần để ưu tiên nhóm tồn kho trọng điểm
  const sortedCategories = useMemo(() => {
    if (!data?.categoryBreakdown) return [];
    return [...data.categoryBreakdown].sort((a, b) => b.value - a.value || b.quantity - a.quantity);
  }, [data?.categoryBreakdown]);

  const paginatedCategories = useMemo(() => {
    const start = (catPage - 1) * catPageSize;
    return sortedCategories.slice(start, start + catPageSize);
  }, [sortedCategories, catPage, catPageSize]);

  // Kho vật lý sắp xếp theo giá trị hoặc số lượng giảm dần
  const sortedWarehouses = useMemo(() => {
    if (!data?.warehouseBreakdown) return [];
    return [...data.warehouseBreakdown].sort((a, b) => b.value - a.value || b.quantity - a.quantity);
  }, [data?.warehouseBreakdown]);

  const paginatedWarehouses = useMemo(() => {
    const start = (whPage - 1) * whPageSize;
    return sortedWarehouses.slice(start, start + whPageSize);
  }, [sortedWarehouses, whPage, whPageSize]);

  return (
    <div className="space-y-6">
      {/* HEADER TỔNG QUAN */}
      {/* HEADER & THÔNG TIN HỆ THỐNG KHO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA332A] animate-pulse"></span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Tổng Quan Quản Trị Kho & Hàng Hóa
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bức tranh toàn cảnh kho vật lý, cơ cấu giá trị tồn kho và cảnh báo định mức tồn tối thiểu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold bg-red-50 text-[#EA332A] px-3.5 py-1.5 rounded-full border border-red-100">
            <WarehouseIcon className="w-4 h-4" />
            <span>Hệ thống {data?.kpis.totalWarehouses || 2} Tổng kho Nam Khánh</span>
          </div>
          <a
            href="#/inbound-receipts"
            className="flex items-center gap-1.5 text-xs font-bold bg-[#E53935] hover:bg-[#D32F2F] text-white px-3.5 py-1.5 rounded-full transition-colors shadow-sm"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Quản lý Nhập kho</span>
          </a>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-card">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#EA332A] mb-2"></div>
          <p>Đang tổng hợp số liệu tồn kho...</p>
        </div>
      ) : (
        <>
          {/* 4 THẺ KPI CHỦ LỰC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Tổng sản lượng tồn */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tổng số lượng tồn
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {data?.kpis.totalQuantity.toLocaleString('vi-VN') || 0}{' '}
                    <span className="text-xs font-normal text-slate-400">sp</span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-xs">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Quy mô kho:</span>
                <span className="font-bold text-slate-800">{data?.kpis.totalWarehouses || 2} Kho lưu trữ</span>
              </div>
            </div>

            {/* KPI 2: Tổng giá trị tồn kho */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tổng giá trị tồn kho
                  </p>
                  <p className="text-2xl font-black text-[#EA332A] mt-1">
                    {formatVND(data?.kpis.totalInventoryValue || 0)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center text-[#EA332A] shadow-xs">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Phương pháp:</span>
                <span className="font-bold text-slate-800">Giá nhập bình quân</span>
              </div>
            </div>

            {/* KPI 3: Danh mục & Loại hàng */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Danh mục & Phân loại
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {data?.kpis.totalCategories || 0}{' '}
                    <span className="text-xs font-normal text-slate-400">Danh mục</span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Số loại hàng Cấp 2:</span>
                <span className="font-bold text-purple-700">{data?.kpis.totalProductTypes || 0} Loại hàng</span>
              </div>
            </div>

            {/* KPI 4: Cảnh báo sắp hết hàng */}
            <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                    Cảnh báo sắp hết hàng
                  </p>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {data?.kpis.lowStockCount || 0}{' '}
                    <span className="text-xs font-normal text-amber-700">mặt hàng</span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Dưới định mức:</span>
                <span className="stat-pill-red !bg-amber-50 !text-amber-800 !border-amber-200">
                  Cần nhập bổ sung
                </span>
              </div>
            </div>
          </div>

          {/* GRID 2 CỘT: CƠ CẤU THEO DANH MỤC & PHÂN BỔ KHO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cơ cấu giá trị tồn kho theo Danh mục */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-card flex flex-col justify-between min-h-[460px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-red-50 text-[#EA332A] flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Cơ Cấu Giá Trị Tồn Kho Theo Danh Mục
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {sortedCategories.length} Danh Mục
                  </span>
                </div>

                <div className="space-y-3">
                  {paginatedCategories.map((cat, idx) => {
                    const colors = [
                      'bg-rose-500',
                      'bg-blue-500',
                      'bg-emerald-500',
                      'bg-amber-500',
                      'bg-purple-500'
                    ];
                    const globalIdx = (catPage - 1) * catPageSize + idx;
                    const color = colors[globalIdx % colors.length];

                    return (
                      <div key={cat.code || idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="font-mono text-slate-400">[{cat.code}]</span>
                            {cat.name}
                          </span>
                          <span className="font-extrabold text-slate-900">
                            {formatVND(cat.value)}{' '}
                            <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                            className={`h-full rounded-full ${color} transition-all duration-700`}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Số lượng tồn kho:</span>
                          <span className="font-semibold text-slate-600">
                            {cat.quantity.toLocaleString('vi-VN')} đơn vị
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-1">
                {sortedCategories.length > catPageSize && (
                  <TablePagination
                    currentPage={catPage}
                    pageSize={catPageSize}
                    totalItems={sortedCategories.length}
                    onPageChange={setCatPage}
                    onPageSizeChange={setCatPageSize}
                    pageSizeOptions={[7, 8, 10, 15, 20]}
                    itemLabel="danh mục"
                  />
                )}
              </div>
            </div>

            {/* Phân bổ theo Kho vật lý */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card flex flex-col justify-between min-h-[460px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-red-50 text-[#EA332A] flex items-center justify-center">
                      <WarehouseIcon className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">Quy Mô Kho Vật Lý</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {sortedWarehouses.length} Kho
                  </span>
                </div>

                <div className="space-y-3.5">
                  {paginatedWarehouses.map((wh) => (
                    <div
                      key={wh.id}
                      className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 text-xs line-clamp-1">{wh.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{wh.code}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {wh.skuCount} SKU
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex justify-between text-xs">
                        <span className="text-slate-400">Số lượng:</span>
                        <span className="font-bold text-slate-800">
                          {wh.quantity.toLocaleString('vi-VN')} sp
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Giá trị tồn:</span>
                        <span className="font-extrabold text-[#EA332A]">{formatVND(wh.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                {sortedWarehouses.length > whPageSize ? (
                  <div className="flex items-center justify-between text-xs text-slate-600 select-none">
                    <span className="text-slate-500 text-[11px]">
                      Trang <strong className="text-slate-800 font-semibold">{whPage}</strong> / {Math.ceil(sortedWarehouses.length / whPageSize)} ({sortedWarehouses.length} kho)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setWhPage(Math.max(1, whPage - 1))}
                        disabled={whPage === 1}
                        className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <span className="px-2 py-0.5 text-xs font-semibold text-white bg-[#E53935] rounded-md shadow-xs">
                        {whPage}
                      </span>
                      <button
                        type="button"
                        onClick={() => setWhPage(Math.min(Math.ceil(sortedWarehouses.length / whPageSize), whPage + 1))}
                        disabled={whPage >= Math.ceil(sortedWarehouses.length / whPageSize)}
                        className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Trang sau"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center font-medium">
                    Mạng lưới kho điều phối bởi Công ty TNHH NK Nam Khánh
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GRID 2 CỘT DƯỚI: CẢNH BÁO TỒN DƯỚI ĐỊNH MỨC & TOP HÀNG TỒN GIÁ TRỊ CAO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cảnh báo tồn dưới định mức */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Hàng Cần Nhập Thêm (Dưới Định Mức)</h3>
                </div>
                <span className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
                  {data?.lowStockProducts.length || 0} mặt hàng
                </span>
              </div>

              {data?.lowStockProducts.length === 0 ? (
                <p className="text-xs text-emerald-600 py-6 text-center font-medium flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tất cả các mặt hàng đều đang ở trên định mức an toàn!</span>
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
                  {data?.lowStockProducts.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700">{p.code}</span>
                          <span className="font-bold text-slate-900">{p.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {p.warehouseName} • {p.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-amber-600">
                          Tồn: {p.stockQuantity} {p.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 5 Hàng tồn kho giá trị cao nhất */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-red-50 text-[#EA332A] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Top 5 Hàng Tồn Giá Trị Cao Nhất</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Tài sản kho</span>
              </div>

              <div className="divide-y divide-slate-100">
                {data?.topValueProducts.map((p, idx) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-2xl flex items-center justify-center text-xs font-black shadow-xs ${
                          idx === 0
                            ? 'bg-red-100 text-[#EA332A]'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700">{p.code}</span>
                          <span className="font-bold text-slate-900">{p.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tồn: {p.stockQuantity} {p.unit} • Giá vốn: {formatVND(p.costPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#EA332A]">{formatVND(p.inventoryValue)}</p>
                      <p className="text-[10px] text-slate-400">
                        {data.kpis.totalInventoryValue > 0
                          ? ((p.inventoryValue / data.kpis.totalInventoryValue) * 100).toFixed(1)
                          : 0}
                        % kho
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
