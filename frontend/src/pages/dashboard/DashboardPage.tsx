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
  Receipt,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardExecutiveOverview,
  DashboardRevenueVolume,
  DashboardProfit
} from '../../types';
import { RevenueTrendChart } from '../../components/common/RevenueTrendChart';
import { getLowToHighColor, getValueRatio } from '../../utils/chartColors';

// Bảng màu tươi mát Ocean Breeze & Nam Khánh Pastel
const CHART_PALETTE = [
  '#0284C7', // 1. Xanh Ocean chủ đạo
  '#10B981', // 2. Xanh Ngọc Emerald
  '#0EA5E9', // 3. Xanh Sky thanh khiết
  '#F59E0B', // 4. Vàng nắng dịu
  '#6366F1', // 5. Chàm Indigo
  '#14B8A6', // 6. Xanh Teal bạc hà
  '#8B5CF6', // 7. Tím Lavender
  '#F43F5E', // 8. Đỏ San hô Coral
  '#06B6D4', // 9. Xanh ngọc Cyan
  '#3B82F6'  // 10. Xanh dương Blue
];

interface DashboardPageProps {
  onNavigateTab?: (tab: string, extra?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const currentYearNum = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;

  const formatDateInput = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [period, setPeriod] = useState<'all' | 'year' | 'quarter' | 'month' | 'today' | 'custom'>('year');
  const [startDate, setStartDate] = useState<string>(`${currentYearNum}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYearNum}-12-31`);
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYearNum));
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const [activeSubTab, setActiveSubTab] = useState<'revenue' | 'profit'>('revenue');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categorySortBy, setCategorySortBy] = useState<
    'revenue_desc' | 'revenue_asc' | 'volume_desc' | 'volume_asc' | 'name_asc'
  >('revenue_desc');
  const CATEGORIES_PER_PAGE = 15;

  const [profitPage, setProfitPage] = useState(1);
  const PROFIT_PER_PAGE = 15;

  const [overview, setOverview] = useState<DashboardExecutiveOverview | null>(null);
  const [revenueVolume, setRevenueVolume] = useState<DashboardRevenueVolume | null>(null);
  const [profitData, setProfitData] = useState<DashboardProfit | null>(null);

  const handleSelectPreset = (nextPeriod: 'all' | 'year' | 'quarter' | 'month' | 'today') => {
    const now = new Date();
    setPeriod(nextPeriod);
    if (nextPeriod === 'all') {
      setStartDate('');
      setEndDate('');
      setSelectedYear('all');
      setSelectedMonth('all');
    } else if (nextPeriod === 'year') {
      const y = now.getFullYear();
      setStartDate(`${y}-01-01`);
      setEndDate(`${y}-12-31`);
      setSelectedYear(String(y));
      setSelectedMonth('all');
    } else if (nextPeriod === 'quarter') {
      const y = now.getFullYear();
      const q = Math.floor(now.getMonth() / 3);
      const s = new Date(y, q * 3, 1);
      const e = new Date(y, q * 3 + 3, 0);
      setStartDate(formatDateInput(s));
      setEndDate(formatDateInput(e));
      setSelectedYear(String(y));
      setSelectedMonth('all');
    } else if (nextPeriod === 'month') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const s = new Date(y, m, 1);
      const e = new Date(y, m + 1, 0);
      setStartDate(formatDateInput(s));
      setEndDate(formatDateInput(e));
      setSelectedYear(String(y));
      setSelectedMonth(String(m + 1));
    } else if (nextPeriod === 'today') {
      const todayStr = formatDateInput(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
      setSelectedYear(String(now.getFullYear()));
      setSelectedMonth(String(now.getMonth() + 1));
    }
  };

  const handleYearMonthChange = (yearVal: string, monthVal: string) => {
    setSelectedYear(yearVal);
    setSelectedMonth(monthVal);
    if (yearVal === 'all') {
      setPeriod('all');
      setStartDate('');
      setEndDate('');
      return;
    }
    const y = Number(yearVal);
    if (monthVal === 'all') {
      setPeriod(y === currentYearNum ? 'year' : 'custom');
      setStartDate(`${y}-01-01`);
      setEndDate(`${y}-12-31`);
    } else {
      const m = Number(monthVal);
      const s = new Date(y, m - 1, 1);
      const e = new Date(y, m, 0);
      setPeriod(y === currentYearNum && m === currentMonthNum ? 'month' : 'custom');
      setStartDate(formatDateInput(s));
      setEndDate(formatDateInput(e));
    }
  };

  const loadDashboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams();
      params.set('period', period);
      if (period !== 'all') {
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
      }
      if (isManualRefresh) params.set('refresh', 'true');
      const queryStr = params.toString();

      const [ovRes, rvRes, pfRes] = await Promise.all([
        api.get<DashboardExecutiveOverview>(`/dashboard/overview?${queryStr}`),
        api.get<DashboardRevenueVolume>(`/dashboard/revenue-volume?${queryStr}`),
        api.get<DashboardProfit>(`/dashboard/profit?${queryStr}`)
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
    setProfitPage(1);
    loadDashboard();
  }, [period, startDate, endDate]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getPeriodText = () => {
    if (period === 'all') return 'Lũy kế toàn bộ';
    if (period === 'today') return `Hôm nay (${formatDisplayDate(startDate)})`;
    if (period === 'month') return `Tháng này (Thg ${currentMonthNum}/${currentYearNum})`;
    if (period === 'quarter') {
      const q = Math.floor((currentMonthNum - 1) / 3) + 1;
      return `Quý ${q}/${currentYearNum}`;
    }
    if (period === 'year') return `Năm nay (${currentYearNum})`;
    if (startDate && endDate) return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    if (startDate) return `Từ ${formatDisplayDate(startDate)}`;
    if (endDate) return `Đến ${formatDisplayDate(endDate)}`;
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

  const totalProfitPages = Math.max(
    1,
    Math.ceil((profitData?.categoryProfits?.length || 0) / PROFIT_PER_PAGE)
  );
  const paginatedProfits = React.useMemo(() => {
    const list = profitData?.categoryProfits || [];
    return list.slice((profitPage - 1) * PROFIT_PER_PAGE, profitPage * PROFIT_PER_PAGE);
  }, [profitData?.categoryProfits, profitPage]);

  // Các chỉ số tính toán cho 5 thẻ thống kê điều hành
  const totalRevenue = overview?.kpis.totalRevenue || 0;
  const totalCogs = overview?.kpis.totalCogs || 0;
  const totalVat = overview?.kpis.totalVat ?? 0;
  const revenueBeforeTax = Math.max(0, totalRevenue - totalVat);
  const profitBeforeTax = overview?.kpis.profitBeforeTax ?? (revenueBeforeTax - totalCogs);
  const totalDebt = overview?.kpis.totalDebt || 0;

  const marginBeforeTax = revenueBeforeTax > 0 ? ((profitBeforeTax / revenueBeforeTax) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 pb-12">
      {/* ================= HEADER ĐIỀU HÀNH ================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span
                className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full border border-sky-200/80 shadow-2xs"
                style={{
                  background: 'linear-gradient(90deg, #E0F2FE 0%, #FCE7F3 55%, #D1FAE5 100%)',
                  color: '#0369A1'
                }}
              >
                Executive Real-Time Dashboard
              </span>
            </div>
            <h1
              className="text-xl md:text-2xl font-black mt-1"
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #0284C7 52%, #0D9488 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Dashboard Điều Hành Doanh Nghiệp Nam Khánh
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap truncate">
              Tổng hợp dữ liệu kinh doanh, doanh số bán lẻ/đại lý, lợi nhuận gộp và dòng tiền thời gian thực
            </p>
          </div>

          {/* Bộ lọc kỳ nhanh đa sắc thái và nút thao tác */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            <div className="inline-flex flex-wrap bg-white/80 p-1 rounded-xl border border-slate-200/80 text-xs font-medium shadow-2xs">
              <button
                id="period-btn-all"
                type="button"
                onClick={() => handleSelectPreset('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${period === 'all'
                    ? 'bg-violet-50 text-violet-700 border border-violet-200 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-violet-700'
                  }`}
              >
                Lũy kế toàn bộ
              </button>
              <button
                id="period-btn-year"
                type="button"
                onClick={() => handleSelectPreset('year')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${period === 'year'
                    ? 'bg-sky-50 text-[#0284C7] border border-sky-200 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-[#0284C7]'
                  }`}
              >
                Năm nay ({currentYearNum})
              </button>
              <button
                id="period-btn-quarter"
                type="button"
                onClick={() => handleSelectPreset('quarter')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${period === 'quarter'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-emerald-700'
                  }`}
              >
                Quý này
              </button>
              <button
                id="period-btn-month"
                type="button"
                onClick={() => handleSelectPreset('month')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${period === 'month'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-amber-700'
                  }`}
              >
                Tháng này
              </button>
              <button
                id="period-btn-today"
                type="button"
                onClick={() => handleSelectPreset('today')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${period === 'today'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-rose-700'
                  }`}
              >
                Hôm nay
              </button>
            </div>

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

        {/* Thanh điều chỉnh thời gian chọn lọc báo cáo */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Calendar className="w-4 h-4 text-[#EA332A]" />
              <span>Chọn thời gian báo cáo:</span>
            </div>

            {/* Chọn theo Năm / Tháng */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-slate-500 font-medium">Năm:</span>
              <select
                value={selectedYear}
                onChange={(e) => handleYearMonthChange(e.target.value, selectedMonth)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả</option>
                {[currentYearNum, currentYearNum - 1, currentYearNum - 2, currentYearNum - 3].map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-slate-500 font-medium">Tháng:</span>
              <select
                value={selectedMonth}
                disabled={selectedYear === 'all'}
                onChange={(e) => handleYearMonthChange(selectedYear, e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="all">Cả năm</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={String(m)}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn khoảng thời gian Từ ngày - Đến ngày */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-slate-500 font-medium">Từ ngày:</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriod('custom');
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#EA332A]"
              />
              <span className="text-slate-400 font-bold px-0.5">→</span>
              <span className="text-slate-500 font-medium">Đến ngày:</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriod('custom');
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#EA332A]"
              />
            </div>

            {(period === 'custom' || period === 'today' || period === 'quarter') && (
              <button
                type="button"
                onClick={() => handleSelectPreset('year')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#0284C7] bg-slate-100 hover:bg-sky-50 transition-colors cursor-pointer"
                title="Đặt lại về Năm nay"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= 5 EXECUTIVE STAT CARDS (NỀN TRẮNG TINH KHIẾT + ĐIỂM NHẤN ĐA SẮC) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. Doanh thu */}
        <div
          onClick={() => onNavigateTab?.('sales-overview')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate" title="Doanh thu">
              Doanh thu
            </span>
            <div
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
              style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)' }}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg xl:text-xl font-black text-emerald-600 truncate" title={formatVND(totalRevenue)}>
              {formatVND(totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-sky-700 mt-1 font-semibold">
              <span>{overview?.kpis.orderCount || 0}</span> đơn hàng
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-1.5"
            style={{ background: 'linear-gradient(90deg, #0284C7 0%, #10B981 100%)' }}
          />
        </div>

        {/* 2. Giá vốn */}
        <div
          onClick={() => onNavigateTab?.('inventory-overview')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate" title="Giá vốn">
              Giá vốn
            </span>
            <div
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
              style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)' }}
            >
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg xl:text-xl font-black text-amber-700 truncate" title={formatVND(totalCogs)}>
              {formatVND(totalCogs)}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600 mt-1 font-semibold truncate">
              SL: {new Intl.NumberFormat('vi-VN').format(overview?.kpis.totalVolume || 0)} SP
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-1.5"
            style={{ background: 'linear-gradient(90deg, #F59E0B 0%, #EA580C 100%)' }}
          />
        </div>

        {/* 3. LN trước VAT */}
        <div
          onClick={() => setActiveSubTab('profit')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate" title="LN trước VAT">
              LN trước VAT
            </span>
            <div
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
              style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #2563EB 100%)' }}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-lg xl:text-xl font-black truncate ${profitBeforeTax >= 0 ? 'text-teal-700' : 'text-red-500'}`} title={formatVND(profitBeforeTax)}>
              {formatVND(profitBeforeTax)}
            </div>
            <div className="flex items-center gap-1 text-xs text-teal-600 mt-1 font-semibold">
              Biên lãi: {marginBeforeTax}%
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-1.5"
            style={{ background: 'linear-gradient(90deg, #14B8A6 0%, #3B82F6 100%)' }}
          />
        </div>

        {/* 4. Tổng thuế VAT */}
        <div
          onClick={() => onNavigateTab?.('finances')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate" title="Tổng thuế VAT">
              Tổng thuế VAT
            </span>
            <div
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
              style={{ background: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)' }}
            >
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg xl:text-xl font-black text-rose-600 truncate" title={formatVND(totalVat)}>
              {formatVND(totalVat)}
            </div>
            <div className="flex items-center gap-1 text-xs text-rose-500 mt-1 font-medium">
              Thuế GTGT đơn hàng
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-1.5"
            style={{ background: 'linear-gradient(90deg, #F43F5E 0%, #DB2777 100%)' }}
          />
        </div>

        {/* 5. Tổng công nợ */}
        <div
          onClick={() => onNavigateTab?.('customers')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate" title="Tổng công nợ">
              Tổng công nợ
            </span>
            <div
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
              style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' }}
            >
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg xl:text-xl font-black text-violet-700 truncate" title={formatVND(totalDebt)}>
              {formatVND(totalDebt)}
            </div>
            <div className="flex items-center gap-1 text-xs text-violet-500 mt-1 font-medium">
              Chưa thanh toán hết
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-1.5"
            style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #C026D3 100%)' }}
          />
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
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeSubTab === 'revenue'
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
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeSubTab === 'profit'
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
                {/* Cột 1 & 2: Biểu đồ đường (Line Chart) biến động doanh thu 12 tháng */}
                <div className="lg:col-span-2 bg-slate-50/70 p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Biến động Doanh số 12 Tháng (Năm {currentYearNum})</h3>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      Đỉnh: {formatVND(maxMonthlyRevenue)}
                    </span>
                  </div>

                  <RevenueTrendChart
                    data={all12Months}
                    height={195}
                    defaultMode="line"
                    formatVND={formatVND}
                  />
                </div>

                {/* Cột 3: Tỷ trọng cơ cấu Danh mục (Thấp: Đỏ -> Cao: Xanh lá) */}
                <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">Cơ cấu Doanh thu theo Danh mục</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Tỷ lệ đóng góp doanh số ({getPeriodText()})</p>

                    <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
                      {(() => {
                        const list = revenueVolume?.categoryBreakdown || [];
                        const pcts = list.map((c) => Number(c.percentage) || 0);
                        const maxPct = Math.max(...pcts, 0);
                        const minPct = Math.min(...pcts, 0);
                        return list.map((cat) => {
                          const pct = Number(cat.percentage) || 0;
                          const ratio =
                            list.length > 1 && maxPct > minPct
                              ? getValueRatio(pct, minPct, maxPct)
                              : pct > 0
                              ? 1
                              : 0;
                          const color = getLowToHighColor(ratio);
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
                                <span className="font-bold ml-2" style={{ color }}>
                                  {cat.percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.max(cat.percentage, cat.volume > 0 ? 3 : 0)}%`,
                                    backgroundColor: color
                                  }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 mt-4 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Tổng Doanh Số:</span>
                    <span className="text-emerald-600 font-extrabold">{formatVND(revenueVolume?.totals.revenue || 0)}</span>
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

                  {/* Phân trang: Giới hạn 15 dòng dữ liệu 1 trang */}
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
                              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${categoryPage === pageNum
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
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-800' :
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
                      {revenueVolume?.topCustomers?.slice(0, 5).map((c, idx) => (
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
                        <th className="py-3 px-4 text-center w-28">Tỉ Lệ (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {paginatedProfits.length > 0 ? (
                        paginatedProfits.map((cat, idx) => (
                          <tr
                            key={cat.id}
                            className={`hover:bg-slate-50/80 transition-colors ${cat.isLoss ? 'bg-red-50/50' : ''
                              }`}
                          >
                            <td className="py-3 px-4 text-center font-medium text-slate-500">
                              {(profitPage - 1) * PROFIT_PER_PAGE + idx + 1}
                            </td>
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
                              className={`py-3 px-4 text-center font-bold ${cat.isLoss ? 'text-red-600' : 'text-emerald-700'
                                }`}
                            >
                              {formatVND(cat.profit)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cat.margin >= 20
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Không có dữ liệu lợi nhuận danh mục trong kỳ
                          </td>
                        </tr>
                      )}

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

                {/* Phân trang: Giới hạn 15 dòng dữ liệu 1 trang */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div>
                    {profitData?.categoryProfits && profitData.categoryProfits.length > 0 ? (
                      <span>
                        Hiển thị <span className="font-semibold text-slate-700">{(profitPage - 1) * PROFIT_PER_PAGE + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(profitPage * PROFIT_PER_PAGE, profitData.categoryProfits.length)}</span> trên <span className="font-semibold text-slate-700">{profitData.categoryProfits.length}</span> danh mục
                      </span>
                    ) : (
                      <span>0 danh mục</span>
                    )}
                  </div>

                  {totalProfitPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setProfitPage((p) => Math.max(1, p - 1))}
                        disabled={profitPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalProfitPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setProfitPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${profitPage === pageNum
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
                        onClick={() => setProfitPage((p) => Math.min(totalProfitPages, p + 1))}
                        disabled={profitPage === totalProfitPages}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Trang sau"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  )}
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
