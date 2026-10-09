import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  CreditCard,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Printer,
  PieChart as PieIcon,
  BarChart3,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardExecutiveOverview,
  DashboardRevenueVolume,
  DashboardProfit
} from '../../types';

// Bảng màu nhận diện chuẩn Nam Khánh theo Logo (Đỏ - Xanh dương - Xanh lá - Vàng nắng)
const CHART_PALETTE = [
  '#EA332A', // 1. Đỏ Nam Khánh
  '#1A7FED', // 2. Xanh dương
  '#22BB4E', // 3. Xanh lá
  '#F9BB12', // 4. Vàng nắng
  '#8B5CF6', // 5. Tím phụ trợ
  '#06B6D4', // 6. Xanh ngọc Cyan
  '#EC4899', // 7. Hồng cánh sen
  '#F97316', // 8. Cam tươi
  '#14B8A6', // 9. Xanh Teal
  '#6366F1'  // 10. Chàm Indigo
];

interface DashboardPageProps {
  onNavigateTab?: (tab: string, extra?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'all' | 'year' | 'month'>('year');
  const [activeSubTab, setActiveSubTab] = useState<'revenue' | 'profit'>('revenue');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categorySortBy, setCategorySortBy] = useState<
    'revenue_desc' | 'revenue_asc' | 'volume_desc' | 'volume_asc' | 'name_asc'
  >('revenue_desc');
  const CATEGORIES_PER_PAGE = 10;

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
    setCategoryPage(1);
    loadDashboard();
  }, [period]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const currentYearNum = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;

  const getPeriodText = () => {
    if (period === 'month') return `Tháng này (Thg ${currentMonthNum}/${currentYearNum})`;
    if (period === 'year') return `Năm nay (${currentYearNum})`;
    return 'Lũy kế toàn bộ';
  };

  // Mảng chuẩn 12 tháng từ T1 đến T12
  const all12Months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mNum) => {
    const found = revenueVolume?.monthlyData?.find(
      (m) => m.monthNumber === mNum || m.month === `Thg ${mNum}` || m.month === `T${mNum}`
    );
    return {
      monthNumber: mNum,
      label: `T${mNum}`,
      fullLabel: `Tháng ${mNum}`,
      revenue: found?.revenue || 0,
      orderCount: found?.orderCount || 0
    };
  });

  const maxMonthlyRevenue = Math.max(
    ...all12Months.map((m) => m.revenue),
    1
  );

  const sortedCategories = React.useMemo(() => {
    const list = [...(revenueVolume?.categoryBreakdown || [])];
    switch (categorySortBy) {
      case 'revenue_desc':
        return list.sort((a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0));
      case 'revenue_asc':
        return list.sort((a, b) => (Number(a.revenue) || 0) - (Number(b.revenue) || 0));
      case 'volume_desc':
        return list.sort((a, b) => (Number(b.volume) || 0) - (Number(a.volume) || 0));
      case 'volume_asc':
        return list.sort((a, b) => (Number(a.volume) || 0) - (Number(b.volume) || 0));
      case 'name_asc':
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
      default:
        return list;
    }
  }, [revenueVolume?.categoryBreakdown, categorySortBy]);

  const totalCategoryPages = Math.max(1, Math.ceil(sortedCategories.length / CATEGORIES_PER_PAGE));
  const paginatedCategories = sortedCategories.slice(
    (categoryPage - 1) * CATEGORIES_PER_PAGE,
    categoryPage * CATEGORIES_PER_PAGE
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ================= HEADER ĐIỀU HÀNH ================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA332A] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#EA332A] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
              Executive Real-Time Dashboard
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
            Dashboard Điều Hành Doanh Nghiệp Nam Khánh
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Tổng hợp dữ liệu kinh doanh, doanh số bán lẻ/đại lý, lợi nhuận gộp và dòng tiền thời gian thực
          </p>
        </div>

        {/* Bộ lọc kỳ và nút thao tác */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              id="period-btn-all"
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Năm nay ({currentYearNum})
            </button>
            <button
              id="period-btn-month"
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'month'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng này
            </button>
          </div>

          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="btn btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 text-slate-700 hover:text-slate-900"
            title="Làm mới dữ liệu từ CSDL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#EA332A]' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 text-slate-700"
            title="In báo cáo điều hành"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In báo cáo</span>
          </button>
        </div>
      </div>

      {/* ================= 4 EXECUTIVE STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Tổng doanh thu thuần */}
        <div
          onClick={() => onNavigateTab?.('sales-overview')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-red-200 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Doanh thu thuần</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#EA332A] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900">
              {formatVND(overview?.kpis.totalRevenue || 0)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">{overview?.kpis.orderCount || 0}</span> đơn hàng đã chốt
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EA332A]"></div>
        </div>

        {/* 2. Giá vốn hàng bán (COGS) */}
        <div
          onClick={() => onNavigateTab?.('inventory-overview')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-200 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Giá vốn hàng bán</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900">
              {formatVND(overview?.kpis.totalCogs || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600 mt-1 font-semibold">
              Sản lượng: {new Intl.NumberFormat('vi-VN').format(overview?.kpis.totalVolume || 0)} SP
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        {/* 3. Lợi nhuận gộp & Biên lãi */}
        <div
          onClick={() => setActiveSubTab('profit')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-200 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lợi nhuận gộp</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-emerald-600">
              {formatVND(overview?.kpis.grossProfit || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1 font-semibold">
              Biên lãi: {overview?.kpis.grossMargin || 0}%
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* 4. Tổng công nợ phải thu */}
        <div
          onClick={() => onNavigateTab?.('customers')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-200 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Công nợ phải thu</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-purple-700">
              {formatVND(overview?.kpis.totalDebt || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              Chưa thanh toán hết
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
        </div>
      </div>

      {/* ================= TABS ĐIỀU HÀNH CHUYÊN SÂU ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex border-b border-slate-200 px-6 pt-4 gap-8">
          <button
            id="tab-btn-revenue"
            type="button"
            onClick={() => setActiveSubTab('revenue')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'revenue'
                ? 'border-[#EA332A] text-[#EA332A]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Doanh Thu & Sản Lượng
          </button>
          <button
            id="tab-btn-profit"
            type="button"
            onClick={() => setActiveSubTab('profit')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'profit'
                ? 'border-[#EA332A] text-[#EA332A]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-4 h-4" />
            Lợi Nhuận Gộp & Phân Tích Biên Lãi
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
                <div className="lg:col-span-2 bg-slate-50/70 p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Biến động Doanh số 12 Tháng (Năm {currentYearNum})</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Biểu đồ cột thể hiện doanh thu bán hàng thực tế theo từng tháng</p>
                    </div>
                    <span className="text-xs font-semibold text-[#EA332A] bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                      Cao nhất: {formatVND(maxMonthlyRevenue)}
                    </span>
                  </div>

                  {/* Thanh biểu đồ tùy biến với CSS thuần */}
                  <div className="h-48 flex items-end gap-2 pt-6 pb-2 px-1">
                    {all12Months.map((m, idx) => {
                      const isPeak = m.revenue === maxMonthlyRevenue && m.revenue > 0;
                      const heightPercent = maxMonthlyRevenue > 0 ? (m.revenue / maxMonthlyRevenue) * 100 : 0;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                          {/* Tooltip khi hover */}
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                            <div>{m.fullLabel}: {formatVND(m.revenue)}</div>
                            <div className="text-slate-400">{m.orderCount} đơn hàng</div>
                          </div>

                          <div className="w-full bg-slate-200 rounded-t h-32 flex items-end overflow-hidden">
                            <div
                              style={{ height: `${Math.max(heightPercent, m.revenue > 0 ? 8 : 2)}%` }}
                              className={`w-full transition-all rounded-t cursor-pointer ${
                                isPeak ? 'bg-[#EA332A] hover:bg-[#D32F2F]' : m.revenue > 0 ? 'bg-[#EA332A]/80 hover:bg-[#EA332A]' : 'bg-slate-200'
                              }`}
                            ></div>
                          </div>
                          <span className={`text-[11px] font-semibold mt-1 ${isPeak ? 'text-[#EA332A]' : 'text-slate-500'}`}>
                            {m.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cột 3: Tỷ trọng cơ cấu Danh mục */}
                <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Cơ cấu Doanh thu theo Danh mục</h3>
                    <p className="text-xs text-slate-500 mb-4">Tỷ lệ đóng góp doanh số ({getPeriodText()})</p>

                    <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
                      {revenueVolume?.categoryBreakdown.map((cat, idx) => {
                        const color = CHART_PALETTE[idx % CHART_PALETTE.length];
                        return (
                          <div key={cat.id} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="truncate">{cat.name}</span>
                              </span>
                              <span className="font-bold text-slate-800 ml-2">{cat.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.max(cat.percentage, cat.volume > 0 ? 3 : 0)}%`,
                                  backgroundColor: color
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 mt-4 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Tổng Doanh Số:</span>
                    <span className="text-[#EA332A] font-extrabold">{formatVND(revenueVolume?.totals.revenue || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Grid 2 cột song song: Bảng số liệu chi tiết Doanh thu & Sản lượng vs Top 5 Sản phẩm & Top 5 Khách hàng */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Cột trái (7/12): Bảng số liệu chi tiết Doanh thu & Sản lượng */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Bảng Số Liệu Chi Tiết Doanh Thu & Sản Lượng
                        </h3>
                        <p className="text-xs text-slate-500">Phân tích chi tiết số lượng sản phẩm và doanh số theo danh mục cấp I</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        {/* Bộ lọc sắp xếp cao nhất và thấp nhất */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-500 font-medium whitespace-nowrap">Sắp xếp:</span>
                          <select
                            value={categorySortBy}
                            onChange={(e) => {
                              setCategorySortBy(e.target.value as any);
                              setCategoryPage(1);
                            }}
                            className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
                          >
                            <option value="revenue_desc">Doanh thu cao nhất ↓</option>
                            <option value="revenue_asc">Doanh thu thấp nhất ↑</option>
                            <option value="volume_desc">Sản lượng cao nhất ↓</option>
                            <option value="volume_asc">Sản lượng thấp nhất ↑</option>
                            <option value="name_asc">Tên danh mục: A - Z</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="table-container border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider select-none">
                            <th className="py-3 px-3 w-12 text-center">STT</th>
                            <th className="py-3 px-3 w-20 text-center">MÃ DM</th>
                            <th
                              onClick={() => {
                                setCategorySortBy(categorySortBy === 'name_asc' ? 'revenue_desc' : 'name_asc');
                                setCategoryPage(1);
                              }}
                              className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                              title="Bấm để sắp xếp theo Tên danh mục"
                            >
                              <div className="inline-flex items-center gap-1">
                                <span>TÊN DANH MỤC</span>
                                {categorySortBy === 'name_asc' && <ArrowUp className="w-3.5 h-3.5 text-[#EA332A]" />}
                              </div>
                            </th>
                            <th
                              onClick={() => {
                                setCategorySortBy(categorySortBy === 'volume_desc' ? 'volume_asc' : 'volume_desc');
                                setCategoryPage(1);
                              }}
                              className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                              title="Bấm để sắp xếp theo Sản lượng (Cao nhất / Thấp nhất)"
                            >
                              <div className="inline-flex items-center justify-center gap-1 w-full">
                                <span>SẢN LƯỢNG</span>
                                {categorySortBy === 'volume_desc' ? (
                                  <ArrowDown className="w-3.5 h-3.5 text-[#EA332A]" />
                                ) : categorySortBy === 'volume_asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-[#EA332A]" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => {
                                setCategorySortBy(categorySortBy === 'revenue_desc' ? 'revenue_asc' : 'revenue_desc');
                                setCategoryPage(1);
                              }}
                              className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                              title="Bấm để sắp xếp theo Doanh thu (Cao nhất / Thấp nhất)"
                            >
                              <div className="inline-flex items-center justify-center gap-1 w-full">
                                <span>DOANH THU</span>
                                {categorySortBy === 'revenue_desc' ? (
                                  <ArrowDown className="w-3.5 h-3.5 text-[#EA332A]" />
                                ) : categorySortBy === 'revenue_asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-[#EA332A]" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => {
                                setCategorySortBy(categorySortBy === 'revenue_desc' ? 'revenue_asc' : 'revenue_desc');
                                setCategoryPage(1);
                              }}
                              className="py-3 px-3 text-right w-24 cursor-pointer hover:bg-slate-100 transition-colors"
                              title="Bấm để sắp xếp theo Tỷ lệ (Cao nhất / Thấp nhất)"
                            >
                              <div className="inline-flex items-center justify-end gap-1 w-full">
                                <span>TỶ LỆ</span>
                                {categorySortBy === 'revenue_desc' ? (
                                  <ArrowDown className="w-3.5 h-3.5 text-[#EA332A]" />
                                ) : categorySortBy === 'revenue_asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-[#EA332A]" />
                                ) : null}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {paginatedCategories.length > 0 ? (
                            paginatedCategories.map((cat, idx) => (
                              <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                                  {(categoryPage - 1) * CATEGORIES_PER_PAGE + idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-[#EA332A] text-center">{cat.code}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[150px]" title={cat.name}>
                                  {cat.name}
                                </td>
                                <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                                  {new Intl.NumberFormat('vi-VN').format(cat.volume)}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                                  {formatVND(cat.revenue)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="inline-block font-bold text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                                    {cat.percentage}%
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400">
                                Không có dữ liệu danh mục trong kỳ
                              </td>
                            </tr>
                          )}
                          {/* DÒNG TỔNG CỘNG CHỐT Ở CHÂN BẢNG */}
                          <tr className="bg-red-50/70 font-bold text-slate-900 border-t-2 border-red-200">
                            <td colSpan={3} className="py-3 px-3 text-center uppercase tracking-wider text-[#EA332A] font-bold text-xs">
                              TỔNG CỘNG TOÀN DOANH NGHIỆP:
                            </td>
                            <td className="py-3 px-3 text-center text-slate-900 font-extrabold text-xs">
                              {new Intl.NumberFormat('vi-VN').format(revenueVolume?.totals.volume || 0)}
                            </td>
                            <td className="py-3 px-3 text-center text-[#EA332A] font-black text-xs">
                              {formatVND(revenueVolume?.totals.revenue || 0)}
                            </td>
                            <td className="py-3 px-3 text-right text-[#EA332A] font-bold text-xs">
                              100.00%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Phân trang: Giới hạn 10 dòng dữ liệu 1 trang */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div>
                      {sortedCategories.length > 0 ? (
                        <span>
                          Hiển thị <span className="font-semibold text-slate-700">{(categoryPage - 1) * CATEGORIES_PER_PAGE + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(categoryPage * CATEGORIES_PER_PAGE, sortedCategories.length)}</span> trên <span className="font-semibold text-slate-700">{sortedCategories.length}</span> danh mục
                        </span>
                      ) : (
                        <span>0 danh mục</span>
                      )}
                    </div>

                    {totalCategoryPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                          disabled={categoryPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                          title="Trang trước"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalCategoryPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setCategoryPage(pageNum)}
                              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                                categoryPage === pageNum
                                  ? 'bg-[#EA332A] text-white shadow-xs'
                                  : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setCategoryPage((p) => Math.min(totalCategoryPages, p + 1))}
                          disabled={categoryPage === totalCategoryPages}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                          title="Trang sau"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cột phải (5/12): Top 5 Sản phẩm & Top 5 Khách hàng */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Top 5 Sản phẩm */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Top 5 Sản Phẩm Bán Chạy Nhất
                      </h4>
                      <span className="text-xs text-slate-400">Theo doanh số</span>
                    </div>
                    <div className="space-y-3">
                      {revenueVolume?.topProducts.map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              idx === 0 ? 'bg-amber-100 text-amber-800' :
                              idx === 1 ? 'bg-slate-200 text-slate-800' :
                              idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</div>
                              <div className="text-[11px] text-slate-400">{p.code} • ĐVT: {p.unit}</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-xs font-bold text-[#EA332A]">{formatVND(p.revenue)}</div>
                            <div className="text-[11px] text-slate-500">Đã bán: {p.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 5 Khách hàng VIP */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Top 5 Khách Hàng Doanh Nghiệp VIP
                      </h4>
                      <span className="text-xs text-slate-400">Doanh số cao nhất</span>
                    </div>
                    <div className="space-y-3">
                      {revenueVolume?.topCustomers.map((c, idx) => (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-slate-900 line-clamp-1">{c.name}</div>
                              <div className="text-[11px] text-slate-400">{c.code} • SĐT: {c.phone || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-xs font-bold text-slate-900">{formatVND(c.totalSpent)}</div>
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

                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Tổng Lợi Nhuận Gộp</span>
                  <div className="text-xl font-bold text-emerald-900 mt-1">
                    {formatVND(profitData?.summary.totalProfit || 0)}
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    Biên lãi trung bình: {profitData?.summary.overallMargin || 0}%
                  </p>
                </div>
              </div>

              {/* Bảng số liệu chi tiết F-D2 theo chuẩn đặc tả */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Bảng Số Liệu Chi Tiết Lợi Nhuận Gộp
                    </h3>
                    <p className="text-xs text-slate-500">
                      Công thức chuẩn: Lợi nhuận = Doanh thu bán – Giá vốn hàng bán (COGS)
                    </p>
                  </div>
                </div>

                <div className="table-container border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">STT</th>
                        <th className="py-3 px-4 w-28 text-center">Mã DM</th>
                        <th className="py-3 px-4 text-center">Tên Danh Mục</th>
                        <th className="py-3 px-4 text-center">Doanh Thu (VNĐ)</th>
                        <th className="py-3 px-4 text-center">Giá Vốn COGS (VNĐ)</th>
                        <th className="py-3 px-4 text-center">Lợi Nhuận Gộp (VNĐ)</th>
                        <th className="py-3 px-4 text-center w-28">Biên Lãi (%)</th>
                        <th className="py-3 px-4 text-center w-28">Tỷ Trọng (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {profitData?.categoryProfits.map((cat, idx) => (
                        <tr
                          key={cat.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            cat.isLoss ? 'bg-red-50/50' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#EA332A] text-center">{cat.code}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            {cat.name}
                            {/* CẢNH BÁO MÀU ĐỎ NỔI BẬT NẾU ÂM LỢI NHUẬN CHUẨN ĐẶC TẢ F-D2 */}
                            {cat.isLoss && (
                              <span className="badge-red text-[11px] font-bold">
                                Cảnh báo: Âm lợi nhuận
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-800">
                            {formatVND(cat.revenue)}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-amber-700">
                            {formatVND(cat.cogs)}
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-bold ${
                              cat.isLoss ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {formatVND(cat.profit)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                cat.margin >= 20
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : cat.margin >= 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {cat.margin}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-600">
                            {cat.contribution}%
                          </td>
                        </tr>
                      ))}

                      {/* DÒNG TỔNG CỘNG CHỐT Ở CHÂN BẢNG CHUẨN ĐẶC TẢ F-D2 */}
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                        <td colSpan={3} className="py-3.5 px-4 text-center uppercase tracking-wider text-slate-800 font-bold">
                          TỔNG CỘNG TOÀN DOANH NGHIỆP:
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-900 text-xs font-bold">
                          {formatVND(profitData?.summary.totalRevenue || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-amber-800 text-xs font-bold">
                          {formatVND(profitData?.summary.totalCogs || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-700 text-sm font-extrabold">
                          {formatVND(profitData?.summary.totalProfit || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-800 text-xs font-bold">
                          {profitData?.summary.overallMargin || 0}%
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-800 text-xs font-bold">
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
