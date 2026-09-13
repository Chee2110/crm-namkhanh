import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  AlertCircle,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  RefreshCw,
  Printer,
  Boxes,
  PieChart as PieIcon,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Target,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardExecutiveOverview,
  DashboardRevenueVolume,
  DashboardProfit
} from '../../types';

// Bảng màu 6 màu chuẩn Nam Khánh theo Checklist VII.1
const CHART_PALETTE = [
  '#E53935', // 1. Đỏ Nam Khánh
  '#1E88E5', // 2. Xanh dương
  '#43A047', // 3. Xanh lá
  '#FB8C00', // 4. Cam tươi
  '#8E24AA', // 5. Tím hoa cà
  '#FDD835'  // 6. Vàng nắng
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'all' | 'year' | 'month'>('year');
  const [activeSubTab, setActiveSubTab] = useState<'revenue' | 'profit'>('revenue');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [overview, setOverview] = useState<DashboardExecutiveOverview | null>(null);
  const [revenueVolume, setRevenueVolume] = useState<DashboardRevenueVolume | null>(null);
  const [profitData, setProfitData] = useState<DashboardProfit | null>(null);

  const loadDashboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const refreshParam = isManualRefresh ? '&refresh=true' : '';
      const [ovRes, rvRes, pfRes] = await Promise.all([
        api.get<DashboardExecutiveOverview>(`/dashboard/overview?period=${period}${refreshParam}`),
        api.get<DashboardRevenueVolume>(`/dashboard/revenue-volume?period=${period}${refreshParam}`),
        api.get<DashboardProfit>(`/dashboard/profit?period=${period}${refreshParam}`)
      ]);

      setOverview(ovRes.data);
      setRevenueVolume(rvRes.data);
      setProfitData(pfRes.data);
    } catch (err) {
      console.error('Lỗi khi tải Dashboard điều hành:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const getPeriodText = () => {
    if (period === 'month') return 'Tháng này (Thg 9/2026)';
    if (period === 'year') return 'Năm nay (2026)';
    return 'Lũy kế toàn bộ';
  };

  const maxMonthlyRevenue = revenueVolume?.monthlyData
    ? Math.max(...revenueVolume.monthlyData.map((m) => m.revenue), 1)
    : 1;

  return (
    <div className="space-y-6 pb-12">
      {/* ================= HEADER ĐIỀU HÀNH ================= */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E53935] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
              Executive Real-Time Dashboard
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            Dashboard Điều Hành Doanh Nghiệp Nam Khánh
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Tổng hợp dữ liệu kinh doanh, doanh số bán lẻ/đại lý, lợi nhuận gộp và dòng tiền thời gian thực
          </p>
        </div>

        {/* Bộ lọc kỳ và nút thao tác */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-medium">
            <button
              id="period-btn-all"
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'all'
                  ? 'bg-white text-gray-900 font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lũy kế toàn bộ
            </button>
            <button
              id="period-btn-year"
              type="button"
              onClick={() => setPeriod('year')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'year'
                  ? 'bg-white text-gray-900 font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Năm nay (2026)
            </button>
            <button
              id="period-btn-month"
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'month'
                  ? 'bg-white text-gray-900 font-bold shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tháng này
            </button>
          </div>

          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 text-gray-700 hover:text-gray-900"
            title="Làm mới dữ liệu từ CSDL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 text-gray-700"
            title="In báo cáo điều hành"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In báo cáo</span>
          </button>
        </div>
      </div>

      {/* ================= 6 EXECUTIVE STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Tổng doanh thu thuần */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Doanh thu thuần</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#E53935] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-gray-900">
              {formatVND(overview?.kpis.totalRevenue || 0)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <span className="font-semibold text-gray-700">{overview?.kpis.orderCount || 0}</span> đơn hàng đã chốt
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E53935]/80"></div>
        </div>

        {/* 2. Giá vốn hàng bán (COGS) */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá vốn hàng bán</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-gray-900">
              {formatVND(overview?.kpis.totalCogs || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600 mt-1 font-medium">
              Sản lượng: {new Intl.NumberFormat('vi-VN').format(overview?.kpis.totalVolume || 0)} SP
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        {/* 3. Lợi nhuận gộp & Biên lãi */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-green-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lợi nhuận gộp</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-green-700">
              {formatVND(overview?.kpis.grossProfit || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1 font-semibold">
              Biên lãi: {overview?.kpis.grossMargin || 0}%
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
        </div>

        {/* 4. Tổng công nợ phải thu */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Công nợ phải thu</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-purple-700">
              {formatVND(overview?.kpis.totalDebt || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              Chưa thanh toán hết
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
        </div>

        {/* 5. Dòng tiền ròng thực tế */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dòng tiền ròng (Net)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-xl font-bold ${(overview?.kpis.netCashflow || 0) >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
              {formatVND(overview?.kpis.netCashflow || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 truncate">
              Thu: {formatVND(overview?.kpis.totalReceipts || 0)}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </div>

        {/* 6. Giá trị tồn kho khả dụng */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá trị tồn kho</span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-gray-800">
              {formatVND(overview?.kpis.totalInventoryValue || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              {overview?.kpis.lowStockCount ? (
                <span className="text-red-500 font-semibold">{overview.kpis.lowStockCount} mặt hàng sắp hết</span>
              ) : (
                <span>Tồn kho an toàn</span>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-500"></div>
        </div>
      </div>

      {/* ================= TABS ĐIỀU HÀNH CHUYÊN SÂU (F-D1 & F-D2) ================= */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex border-b border-gray-100 px-6 pt-4 gap-8">
          <button
            id="tab-btn-revenue"
            type="button"
            onClick={() => setActiveSubTab('revenue')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'revenue'
                ? 'border-[#E53935] text-[#E53935]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            [F-D1] Doanh Thu & Sản Lượng
          </button>
          <button
            id="tab-btn-profit"
            type="button"
            onClick={() => setActiveSubTab('profit')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'profit'
                ? 'border-[#E53935] text-[#E53935]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <PieIcon className="w-4 h-4" />
            [F-D2] Lợi Nhuận Gộp & Phân Tích Biên Lãi
          </button>
        </div>

        {/* Nội dung Tab */}
        <div className="p-6">
          {/* ================= TAB 1: [F-D1] DOANH THU & SẢN LƯỢNG ================= */}
          {activeSubTab === 'revenue' && (
            <div className="space-y-8">
              {/* Biểu đồ biến động 12 tháng & Cơ cấu danh mục */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột 1 & 2: Biểu đồ doanh thu 12 tháng */}
                <div className="lg:col-span-2 bg-gray-50/70 p-5 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Biến động Doanh số 12 Tháng (Năm 2026)</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Biểu đồ cột thể hiện doanh thu bán hàng thực tế theo từng tháng</p>
                    </div>
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                      Cao nhất: {formatVND(maxMonthlyRevenue)}
                    </span>
                  </div>

                  {/* Thanh biểu đồ tùy biến với CSS thuần */}
                  <div className="h-48 flex items-end gap-2 pt-6 pb-2 px-1">
                    {revenueVolume?.monthlyData.map((m, idx) => {
                      const heightPercent = maxMonthlyRevenue > 0 ? (m.revenue / maxMonthlyRevenue) * 100 : 0;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                          {/* Tooltip khi hover */}
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-lg">
                            <div>{m.month}: {formatVND(m.revenue)}</div>
                            <div className="text-gray-400">{m.orderCount} đơn hàng</div>
                          </div>

                          <div className="w-full bg-gray-200 rounded-t h-32 flex items-end overflow-hidden">
                            <div
                              style={{ height: `${Math.max(heightPercent, m.revenue > 0 ? 8 : 2)}%` }}
                              className="w-full bg-[#E53935] hover:bg-[#C62828] transition-all rounded-t cursor-pointer"
                            ></div>
                          </div>
                          <span className="text-[11px] font-medium text-gray-500 mt-1">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cột 3: Tỷ trọng cơ cấu Danh mục */}
                <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-100 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Cơ cấu Doanh thu theo Danh mục</h3>
                    <p className="text-xs text-gray-500 mb-4">Tỷ lệ đóng góp doanh số ({getPeriodText()})</p>

                    <div className="space-y-3">
                      {revenueVolume?.categoryBreakdown.map((cat, idx) => (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }}
                              ></span>
                              {cat.name}
                            </span>
                            <span className="font-bold text-gray-900">{cat.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${cat.percentage}%`,
                                backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-xs font-bold text-gray-900">
                    <span>Tổng doanh thu kỳ:</span>
                    <span className="text-[#E53935]">{formatVND(revenueVolume?.totals.revenue || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Bảng số liệu chi tiết F-D1 theo chuẩn đặc tả */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Bảng Số Liệu Chi Tiết Doanh Thu & Sản Lượng (F-D1)
                    </h3>
                    <p className="text-xs text-gray-500">Phân tích chi tiết số lượng sản phẩm và doanh số theo danh mục cấp 1</p>
                  </div>
                  <span className="badge-green">Kỳ: {getPeriodText()}</span>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">STT</th>
                        <th className="py-3 px-4 w-28">Mã DM</th>
                        <th className="py-3 px-4">Tên Danh Mục Hàng Hóa</th>
                        <th className="py-3 px-4 text-right">Sản Lượng Bán (ĐVT)</th>
                        <th className="py-3 px-4 text-right">Doanh Thu (VNĐ)</th>
                        <th className="py-3 px-4 text-right w-36">Tỷ Lệ Đóng Góp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {revenueVolume?.categoryBreakdown.map((cat, idx) => (
                        <tr key={cat.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-medium text-gray-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-red-600">{cat.code}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">{cat.name}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-800">
                            {new Intl.NumberFormat('vi-VN').format(cat.volume)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">
                            {formatVND(cat.revenue)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-block font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                              {cat.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* DÒNG TỔNG CỘNG CHỐT Ở CHÂN BẢNG CHUẨN ĐẶC TẢ F-D1 */}
                      <tr className="bg-red-50/70 font-bold text-gray-900 border-t-2 border-red-200">
                        <td colSpan={3} className="py-3.5 px-4 text-center uppercase tracking-wider text-red-700">
                          TỔNG CỘNG TOÀN DOANH NGHIỆP:
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-900 text-base">
                          {new Intl.NumberFormat('vi-VN').format(revenueVolume?.totals.volume || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#E53935] text-base">
                          {formatVND(revenueVolume?.totals.revenue || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-red-700 text-sm">
                          100.00%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top 5 Sản phẩm & Top 5 Khách hàng */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Top 5 Sản phẩm */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Top 5 Sản Phẩm Bán Chạy Nhất
                    </h4>
                    <span className="text-xs text-gray-400">Theo doanh số</span>
                  </div>
                  <div className="space-y-3">
                    {revenueVolume?.topProducts.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' :
                            idx === 1 ? 'bg-gray-200 text-gray-800' :
                            idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</div>
                            <div className="text-[11px] text-gray-400">{p.code} • ĐVT: {p.unit}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-[#E53935]">{formatVND(p.revenue)}</div>
                          <div className="text-[11px] text-gray-500">Đã bán: {p.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 5 Khách hàng VIP */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Top 5 Khách Hàng Doanh Nghiệp VIP
                    </h4>
                    <span className="text-xs text-gray-400">Doanh số cao nhất</span>
                  </div>
                  <div className="space-y-3">
                    {revenueVolume?.topCustomers.map((c, idx) => (
                      <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-gray-900 line-clamp-1">{c.name}</div>
                            <div className="text-[11px] text-gray-400">{c.code} • SĐT: {c.phone || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-900">{formatVND(c.totalSpent)}</div>
                          <div className="text-[11px] text-purple-600 font-medium">
                            Còn nợ: {formatVND(c.remainingDebt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: [F-D2] LỢI NHUẬN GỘP & BIÊN LÃI ================= */}
          {activeSubTab === 'profit' && (
            <div className="space-y-8">
              {/* Thẻ tóm tắt Doanh thu vs Giá vốn vs Lợi nhuận */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Tổng Doanh Thu</span>
                  <div className="text-xl font-bold text-blue-900 mt-1">
                    {formatVND(profitData?.summary.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">Giá trị đơn hàng chốt</p>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Tổng Giá Vốn (COGS)</span>
                  <div className="text-xl font-bold text-amber-900 mt-1">
                    {formatVND(profitData?.summary.totalCogs || 0)}
                  </div>
                  <p className="text-xs text-amber-600 mt-1">Tính theo giá nhập bình quân kho</p>
                </div>

                <div className="bg-green-50/60 p-4 rounded-xl border border-green-100">
                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Tổng Lợi Nhuận Gộp</span>
                  <div className="text-xl font-bold text-green-900 mt-1">
                    {formatVND(profitData?.summary.totalProfit || 0)}
                  </div>
                  <p className="text-xs text-green-700 font-semibold mt-1">
                    Biên lãi trung bình: {profitData?.summary.overallMargin || 0}%
                  </p>
                </div>
              </div>

              {/* Bảng số liệu chi tiết F-D2 theo chuẩn đặc tả */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Bảng Số Liệu Chi Tiết Lợi Nhuận Gộp (F-D2)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Công thức chuẩn: Lợi nhuận = Doanh thu bán – Giá vốn hàng bán (COGS)
                    </p>
                  </div>
                  <span className="badge-green">Kỳ: {getPeriodText()}</span>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">STT</th>
                        <th className="py-3 px-4 w-28">Mã DM</th>
                        <th className="py-3 px-4">Tên Danh Mục</th>
                        <th className="py-3 px-4 text-right">Doanh Thu (VNĐ)</th>
                        <th className="py-3 px-4 text-right">Giá Vốn COGS (VNĐ)</th>
                        <th className="py-3 px-4 text-right">Lợi Nhuận Gộp (VNĐ)</th>
                        <th className="py-3 px-4 text-right w-28">Biên Lãi (%)</th>
                        <th className="py-3 px-4 text-right w-28">Tỷ Trọng (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                      {profitData?.categoryProfits.map((cat, idx) => (
                        <tr
                          key={cat.id}
                          className={`hover:bg-gray-50/80 transition-colors ${
                            cat.isLoss ? 'bg-red-50/50' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-medium text-gray-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-gray-800">{cat.code}</td>
                          <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                            {cat.name}
                            {/* CẢNH BÁO MÀU ĐỎ NỔI BẬT NẾU ÂM LỢI NHUẬN CHUẨN ĐẶC TẢ F-D2 */}
                            {cat.isLoss && (
                              <span className="badge-red text-[11px] font-bold">
                                Cảnh báo: Âm lợi nhuận
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-gray-800">
                            {formatVND(cat.revenue)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-amber-700">
                            {formatVND(cat.cogs)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold ${
                              cat.isLoss ? 'text-red-600' : 'text-green-700'
                            }`}
                          >
                            {formatVND(cat.profit)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                cat.margin >= 20
                                  ? 'bg-green-100 text-green-800'
                                  : cat.margin >= 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {cat.margin}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-600">
                            {cat.contribution}%
                          </td>
                        </tr>
                      ))}

                      {/* DÒNG TỔNG CỘNG CHỐT Ở CHÂN BẢNG CHUẨN ĐẶC TẢ F-D2 */}
                      <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-300">
                        <td colSpan={3} className="py-3.5 px-4 text-center uppercase tracking-wider text-gray-800">
                          TỔNG CỘNG DOANH NGHIỆP:
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-900 text-sm">
                          {formatVND(profitData?.summary.totalRevenue || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-amber-800 text-sm">
                          {formatVND(profitData?.summary.totalCogs || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-green-700 text-base">
                          {formatVND(profitData?.summary.totalProfit || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-green-800 text-sm">
                          {profitData?.summary.overallMargin || 0}%
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-800 text-sm">
                          100.00%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
