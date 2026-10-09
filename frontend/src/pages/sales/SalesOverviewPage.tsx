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
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { SalesOverview } from '../../types';

export const SalesOverviewPage: React.FC = () => {
  const [period, setPeriod] = useState<'year' | 'quarter' | 'month'>('year');
  const [data, setData] = useState<SalesOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get<SalesOverview>(`/sales-overview?period=${period}`);
      setData(res.data);
    } catch (err) {
      console.error('Lỗi khi tải tổng quan doanh thu & sản lượng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const getPeriodLabel = () => {
    if (period === 'month') return 'Tháng này (Thg 9/2026)';
    if (period === 'quarter') return 'Quý này (Quý 3/2026)';
    return 'Năm nay (2026)';
  };

  const maxMonthlyRevenue = data?.monthlyRevenue
    ? Math.max(...data.monthlyRevenue.map((m) => m.revenue), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* HEADER & BỘ CHỌN KỲ THỐNG KÊ */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA332A] animate-pulse"></span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Tổng Quan Doanh Thu & Sản Lượng VPP
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bức tranh kinh doanh thời gian thực Công ty TNHH NK Nam Khánh • Kỳ xem:{' '}
            <span className="font-semibold text-slate-800">{getPeriodLabel()}</span>
          </p>
        </div>

        {/* Tab chọn kỳ dạng Pill */}
        <div className="pill-nav shadow-xs">
          <button
            onClick={() => setPeriod('month')}
            className={`pill-tab-item ${period === 'month' ? 'active' : ''}`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setPeriod('quarter')}
            className={`pill-tab-item ${period === 'quarter' ? 'active' : ''}`}
          >
            Quý này
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`pill-tab-item ${period === 'year' ? 'active' : ''}`}
          >
            Năm nay (2026)
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-card">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#EA332A] mb-2"></div>
          <p>Đang tổng hợp dữ liệu doanh số và công nợ...</p>
        </div>
      ) : (
        <>
          {/* 4 THẺ KPI CHÍNH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Doanh thu */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tổng doanh thu
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {formatVND(data?.kpis.totalRevenue || 0)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center text-[#EA332A] shadow-xs">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Số đơn phát sinh:</span>
                <span className="font-bold text-slate-800">{data?.kpis.totalOrders || 0} đơn</span>
              </div>
            </div>

            {/* KPI 2: Tổng sản lượng VPP */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tổng sản lượng VPP
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {data?.kpis.totalVolume.toLocaleString('vi-VN') || 0}{' '}
                    <span className="text-xs font-normal text-slate-400">sp</span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-xs">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Khách hàng giao dịch:</span>
                <span className="font-bold text-slate-800">{data?.kpis.activeCustomersCount || 0} KH</span>
              </div>
            </div>

            {/* KPI 3: Thực thu */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Thực thu (Đã trả)
                  </p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {formatVND(data?.kpis.totalPaid || 0)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Tỷ lệ thu hồi:</span>
                <span className="stat-pill-green !text-[11px] !py-0.2 !px-2">
                  {data?.kpis.totalRevenue
                    ? Math.round((data.kpis.totalPaid / data.kpis.totalRevenue) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            {/* KPI 4: Nợ phải thu */}
            <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-card relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                    Nợ còn phải thu
                  </p>
                  <p className="text-2xl font-black text-[#EA332A] mt-1">
                    {formatVND(data?.kpis.totalDebt || 0)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center text-[#EA332A] shadow-xs">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Tỷ lệ dư nợ:</span>
                <span className="stat-pill-red !text-[11px] !py-0.2 !px-2">
                  {data?.kpis.totalRevenue
                    ? Math.round((data.kpis.totalDebt / data.kpis.totalRevenue) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* GRID 2 CỘT: XU HƯỚNG 12 THÁNG & CƠ CẤU 5 NHÓM VPP */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Biểu đồ Doanh thu 12 tháng */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-red-50 text-[#EA332A] flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Xu hướng Doanh thu 12 Tháng Năm 2026
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    Đơn vị: VNĐ
                  </span>
                </div>

                {/* Thanh biểu đồ Capsule */}
                <div className="h-64 flex items-end justify-between gap-2 pt-8 pb-2 px-2 border-b border-slate-100">
                  {data?.monthlyRevenue.map((item, idx) => {
                    const heightPercent =
                      maxMonthlyRevenue > 0 ? (item.revenue / maxMonthlyRevenue) * 100 : 0;
                    const isPeak = item.revenue === maxMonthlyRevenue && item.revenue > 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        {/* Tooltip khi hover */}
                        <div className="absolute -top-11 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] rounded-xl px-2.5 py-1 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                          {item.month}: {formatVND(item.revenue)}
                        </div>

                        {/* Cột hiển thị Capsule */}
                        <div
                          style={{ height: `${Math.max(heightPercent, 6)}%` }}
                          className={`w-full max-w-[24px] capsule-bar transition-all duration-300 ${
                            isPeak
                              ? 'bg-[#EA332A] shadow-md shadow-red-200'
                              : item.revenue > 0
                              ? 'bg-red-400/80 hover:bg-red-500'
                              : 'bg-slate-100'
                          }`}
                        ></div>
                      </div>
                    );
                  })}
                </div>

                {/* Nhãn 12 tháng */}
                <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-2">
                  {data?.monthlyRevenue.map((item, idx) => (
                    <span key={idx} className="flex-1 text-center font-bold">
                      {item.month.replace('Thg ', 'T')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Doanh thu tháng cao điểm nhất:</span>
                <span className="font-extrabold text-[#EA332A] text-sm">{formatVND(maxMonthlyRevenue)}</span>
              </div>
            </div>

            {/* Cơ cấu Doanh thu theo 5 nhóm VPP */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-2xl bg-red-50 text-[#EA332A] flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Cơ Cấu Doanh Thu Ngành Hàng</h3>
                </div>

                <div className="space-y-4">
                  {data?.categoryBreakdown.map((cat, idx) => {
                    const colors = [
                      'bg-rose-500',
                      'bg-blue-500',
                      'bg-emerald-500',
                      'bg-amber-500',
                      'bg-purple-500'
                    ];
                    const color = colors[idx % colors.length];

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">{cat.name}</span>
                          <span className="font-extrabold text-slate-900">
                            {formatVND(cat.revenue)}{' '}
                            <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${cat.percentage}%` }}
                            className={`h-full rounded-full ${color} transition-all duration-700`}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Sản lượng xuất:</span>
                          <span className="font-semibold text-slate-600">
                            {cat.quantity.toLocaleString('vi-VN')} đơn vị
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center font-medium">
                Danh mục phân phối độc quyền bởi Công ty TNHH NK Nam Khánh
              </div>
            </div>
          </div>

          {/* GRID 2 CỘT DƯỚI: TOP KHÁCH HÀNG & ĐƠN HÀNG GẦN ĐÂY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Khách hàng VIP */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Top 5 Khách Hàng VIP</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Doanh số cao nhất</span>
              </div>

              {data?.topCustomers.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có dữ liệu giao dịch</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data?.topCustomers.map((c, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-2xl flex items-center justify-center text-xs font-black shadow-xs ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{c.name}</p>
                          <p className="text-[11px] text-slate-400">
                            Mã: {c.code} • SĐT: {c.phone} • {c.orderCount} đơn hàng
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-[#EA332A]">{formatVND(c.totalRevenue)}</p>
                        <p className="text-[10px] text-slate-400">
                          {data.kpis.totalRevenue > 0
                            ? ((c.totalRevenue / data.kpis.totalRevenue) * 100).toFixed(1)
                            : 0}
                          % tổng doanh thu
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Đơn hàng vừa phát sinh */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-red-50 text-[#EA332A] flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Đơn Hàng Mới Nhất</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">5 đơn gần đây</span>
              </div>

              {data?.recentOrders.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có đơn hàng nào</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data?.recentOrders.map((o) => (
                    <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{o.code}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-700 font-medium">{o.customerName}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(o.orderDate).toLocaleDateString('vi-VN')} • Phụ trách:{' '}
                          {o.managerName || 'Chưa gán'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900">{formatVND(Number(o.totalAmount))}</p>
                        <span
                          className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            o.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.paymentStatus === 'PARTIAL_PAID'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {o.paymentStatus === 'PAID'
                            ? 'Đã TT'
                            : o.paymentStatus === 'PARTIAL_PAID'
                            ? 'Nợ 1 phần'
                            : 'Chưa TT'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
