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
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E53935] animate-pulse"></span>
            <h2 className="text-lg font-bold text-gray-900">
              Tổng Quan Doanh Thu & Sản Lượng VPP
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi bức tranh kinh doanh thời gian thực của Công ty TNHH NK Nam Khánh • Kỳ xem:{' '}
            <span className="font-semibold text-gray-700">{getPeriodLabel()}</span>
          </p>
        </div>

        {/* Tab chọn kỳ */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              period === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setPeriod('quarter')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              period === 'quarter'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Quý này
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              period === 'year'
                ? 'bg-white text-[#E53935] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Năm nay (2026)
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-20 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
          <p>Đang tổng hợp dữ liệu doanh số và công nợ...</p>
        </div>
      ) : (
        <>
          {/* 4 THẺ KPI CHÍNH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Doanh thu */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng doanh thu
                  </p>
                  <p className="text-2xl font-black text-gray-900 mt-1">
                    {formatVND(data?.kpis.totalRevenue || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#E53935]">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">Số đơn phát sinh:</span>
                <span className="font-bold text-gray-800">{data?.kpis.totalOrders || 0} đơn</span>
              </div>
            </div>

            {/* KPI 2: Tổng sản lượng VPP */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng sản lượng VPP
                  </p>
                  <p className="text-2xl font-black text-gray-900 mt-1">
                    {data?.kpis.totalVolume.toLocaleString('vi-VN') || 0}{' '}
                    <span className="text-sm font-normal text-gray-500">sp</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Package className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">Khách hàng giao dịch:</span>
                <span className="font-bold text-gray-800">{data?.kpis.activeCustomersCount || 0} KH</span>
              </div>
            </div>

            {/* KPI 3: Thực thu */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thực thu (Đã trả)
                  </p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {formatVND(data?.kpis.totalPaid || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">Tỷ lệ thu hồi:</span>
                <span className="font-bold text-emerald-700">
                  {data?.kpis.totalRevenue
                    ? Math.round((data.kpis.totalPaid / data.kpis.totalRevenue) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            {/* KPI 4: Nợ phải thu */}
            <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm bg-red-50/20 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-[#E53935] uppercase tracking-wider">
                    Nợ còn phải thu
                  </p>
                  <p className="text-2xl font-black text-[#E53935] mt-1">
                    {formatVND(data?.kpis.totalDebt || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-[#E53935]">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">Tỷ lệ dư nợ:</span>
                <span className="font-bold text-[#E53935]">
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
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#E53935]" />
                    <h3 className="font-bold text-gray-900">
                      Xu hướng Doanh thu 12 Tháng Năm 2026
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    Đơn vị: Triệu VNĐ
                  </span>
                </div>

                {/* Thanh biểu đồ */}
                <div className="h-64 flex items-end justify-between gap-2 pt-8 pb-2 px-2 border-b border-gray-100">
                  {data?.monthlyRevenue.map((item, idx) => {
                    const heightPercent =
                      maxMonthlyRevenue > 0 ? (item.revenue / maxMonthlyRevenue) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        {/* Tooltip khi hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                          {item.month}: {formatVND(item.revenue)}
                        </div>

                        {/* Cột hiển thị */}
                        <div
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${
                            item.revenue > 0
                              ? 'bg-gradient-to-t from-red-600 to-[#E53935] group-hover:brightness-110 shadow-sm'
                              : 'bg-gray-100'
                          }`}
                        ></div>
                      </div>
                    );
                  })}
                </div>

                {/* Nhãn 12 tháng */}
                <div className="flex justify-between text-[11px] text-gray-500 mt-2 px-2">
                  {data?.monthlyRevenue.map((item, idx) => (
                    <span key={idx} className="flex-1 text-center font-medium">
                      {item.month}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Doanh thu tháng cao điểm nhất:</span>
                <span className="font-bold text-gray-900">{formatVND(maxMonthlyRevenue)}</span>
              </div>
            </div>

            {/* Cơ cấu Doanh thu theo 5 nhóm VPP */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-[#E53935]" />
                  <h3 className="font-bold text-gray-900">Cơ Cấu Doanh Thu Theo Ngành Hàng</h3>
                </div>

                <div className="space-y-4">
                  {data?.categoryBreakdown.map((cat, idx) => {
                    const colors = [
                      'bg-red-500',
                      'bg-blue-500',
                      'bg-emerald-500',
                      'bg-amber-500',
                      'bg-purple-500'
                    ];
                    const color = colors[idx % colors.length];

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-800">{cat.name}</span>
                          <span className="font-bold text-gray-900">
                            {formatVND(cat.revenue)}{' '}
                            <span className="text-gray-400 font-normal">({cat.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${cat.percentage}%` }}
                            className={`h-full rounded-full ${color} transition-all duration-700`}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span>Sản lượng xuất:</span>
                          <span className="font-medium text-gray-600">
                            {cat.quantity.toLocaleString('vi-VN')} đơn vị
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
                Danh mục phân phối độc quyền bởi Công ty TNHH NK Nam Khánh
              </div>
            </div>
          </div>

          {/* GRID 2 CỘT DƯỚI: TOP KHÁCH HÀNG & ĐƠN HÀNG GẦN ĐÂY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Khách hàng VIP */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#E53935]" />
                  <h3 className="font-bold text-gray-900">Top 5 Khách Hàng Doanh Số Cao Nhất</h3>
                </div>
                <span className="text-xs text-gray-400">Đóng góp chính</span>
              </div>

              {data?.topCustomers.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Chưa có dữ liệu giao dịch</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data?.topCustomers.map((c, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800'
                              : idx === 1
                              ? 'bg-gray-200 text-gray-700'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{c.name}</p>
                          <p className="text-[11px] text-gray-500">
                            Mã: {c.code} • SĐT: {c.phone} • {c.orderCount} đơn hàng
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#E53935]">{formatVND(c.totalRevenue)}</p>
                        <p className="text-[10px] text-gray-400">
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
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#E53935]" />
                  <h3 className="font-bold text-gray-900">Đơn Hàng Mới Nhất</h3>
                </div>
                <span className="text-xs text-gray-400">5 đơn gần đây</span>
              </div>

              {data?.recentOrders.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Chưa có đơn hàng nào</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data?.recentOrders.map((o) => (
                    <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{o.code}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-700 font-medium">{o.customerName}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {new Date(o.orderDate).toLocaleDateString('vi-VN')} • Phụ trách:{' '}
                          {o.managerName || 'Chưa gán'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatVND(Number(o.totalAmount))}</p>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-semibold ${
                            o.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.paymentStatus === 'PARTIAL_PAID'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
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
