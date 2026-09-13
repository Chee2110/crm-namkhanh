import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Users,
  Package,
  Layers,
  Search,
  Printer,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Download,
  Calendar
} from 'lucide-react';
import { api } from '../../services/api';

export const SalesReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'debts'>('revenue');

  // Revenue Report states
  const [revenueView, setRevenueView] = useState<'category' | 'product' | 'manager'>('category');
  const [revenueData, setRevenueData] = useState<{ totalRevenue: number; items: any[] }>({
    totalRevenue: 0,
    items: []
  });
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  // Debts Report states
  const [debtSearch, setDebtSearch] = useState('');
  const [debtsData, setDebtsData] = useState<{
    summary: {
      totalPurchased: number;
      totalPaid: number;
      totalDebt: number;
      customerWithDebtCount: number;
    };
    customers: any[];
  }>({
    summary: {
      totalPurchased: 0,
      totalPaid: 0,
      totalDebt: 0,
      customerWithDebtCount: 0
    },
    customers: []
  });
  const [loadingDebts, setLoadingDebts] = useState(false);

  const loadRevenueData = async () => {
    try {
      setLoadingRevenue(true);
      const res = await api.get(`/sales-reports/revenue?view=${revenueView}`);
      setRevenueData(res.data);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo doanh thu:', err);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const loadDebtsData = async () => {
    try {
      setLoadingDebts(true);
      const query = debtSearch ? `?search=${encodeURIComponent(debtSearch)}` : '';
      const res = await api.get(`/sales-reports/debts${query}`);
      setDebtsData(res.data);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo công nợ:', err);
    } finally {
      setLoadingDebts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'revenue') {
      loadRevenueData();
    } else {
      loadDebtsData();
    }
  }, [activeTab, revenueView]);

  const handleDebtSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDebtsData();
  };

  const handleExportExcel = () => {
    if (activeTab === 'revenue') {
      if (!revenueData.items || revenueData.items.length === 0) {
        alert('Không có dữ liệu doanh thu để xuất');
        return;
      }
      let headers: string[] = [];
      let rows: any[][] = [];

      if (revenueView === 'category') {
        headers = ['STT', 'Mã danh mục', 'Tên nhóm hàng VPP', 'Sản lượng bán', 'Doanh thu thuần (VNĐ)', 'Tỷ lệ đóng góp (%)'];
        rows = revenueData.items.map((item, idx) => [
          idx + 1,
          item.code,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          item.volume,
          item.revenue,
          `"${item.percentage}%"`
        ]);
      } else if (revenueView === 'product') {
        headers = ['STT', 'Mã SKU', 'Tên mặt hàng VPP', 'Đơn vị tính', 'Sản lượng bán', 'Doanh thu thuần (VNĐ)', 'Tỷ lệ đóng góp (%)'];
        rows = revenueData.items.map((item, idx) => [
          idx + 1,
          item.code,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          item.unit || '',
          item.volume,
          item.revenue,
          `"${item.percentage}%"`
        ]);
      } else {
        headers = ['STT', 'Mã nhân viên', 'Họ tên nhân viên phụ trách', 'Email', 'Phòng ban', 'Số đơn phụ trách', 'Doanh thu đem về (VNĐ)', 'Tỷ lệ đóng góp (%)'];
        rows = revenueData.items.map((item, idx) => [
          idx + 1,
          item.code,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          item.email || '',
          item.department || '',
          item.orderCount,
          item.revenue,
          `"${item.percentage}%"`
        ]);
      }

      const csvContent = '\uFEFF' + [
        ['BÁO CÁO DOANH THU & SẢN LƯỢNG VPP - CÔNG TY TNHH NK NAM KHÁNH'],
        [`Góc nhìn phân tích: ${revenueView === 'category' ? 'Theo Nhóm hàng VPP' : revenueView === 'product' ? 'Theo Từng mặt hàng SKU' : 'Theo Nhân viên phụ trách'}`],
        [`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`],
        [`Tổng doanh thu: ${revenueData.totalRevenue} VNĐ`],
        [],
        headers.join(','),
        ...rows.map((r) => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Bao_Cao_Doanh_Thu_NamKhanh_${revenueView}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Xuất Báo cáo Công nợ
      if (!debtsData.customers || debtsData.customers.length === 0) {
        alert('Không có dữ liệu công nợ để xuất');
        return;
      }
      const headers = [
        'STT',
        'Mã KH',
        'Tên khách hàng / Doanh nghiệp',
        'Mã số thuế',
        'Số điện thoại',
        'Địa chỉ',
        'Nhân viên phụ trách',
        'Tổng giá trị mua sau thuế (VNĐ)',
        'Đã thanh toán (VNĐ)',
        'Còn nợ (Còn phải thu VNĐ)',
        'Số dư ký quỹ / Trả trước (VNĐ)',
        'Tình trạng'
      ];
      const rows = debtsData.customers.map((c, idx) => [
        idx + 1,
        c.code,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${c.taxCode || ''}"`,
        `"${c.phone || ''}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${(c.manager?.fullName || '').replace(/"/g, '""')}"`,
        c.totalPurchased,
        c.totalPaid,
        c.totalDebt,
        c.creditBalance || 0,
        c.totalDebt > 0 ? 'Đang có nợ đọng' : 'Đã tất toán'
      ]);

      const csvContent = '\uFEFF' + [
        ['BÁO CÁO TỔNG HỢP CÔNG NỢ PHẢI THU KHÁCH HÀNG - CÔNG TY TNHH NK NAM KHÁNH'],
        [`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`],
        [`Tổng mua: ${debtsData.summary.totalPurchased} VNĐ | Thực thu: ${debtsData.summary.totalPaid} VNĐ | Tổng nợ đọng: ${debtsData.summary.totalDebt} VNĐ`],
        [],
        headers.join(','),
        ...rows.map((r) => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Bao_Cao_Cong_No_NamKhanh_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  return (
    <div className="space-y-6">
      {/* HEADER TỔNG & TABS CHỌN BÁO CÁO */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#E53935]" />
            Báo Cáo Bán Hàng & Quản Trị Công Nợ VPP
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Hệ thống báo cáo tài chính nội bộ Công ty TNHH NK Nam Khánh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setActiveTab('revenue')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'revenue'
                  ? 'bg-white text-[#E53935] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Báo cáo Doanh thu & Sản lượng
            </button>
            <button
              onClick={() => setActiveTab('debts')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'debts'
                  ? 'bg-white text-[#E53935] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Báo cáo Công nợ Phải thu
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            title="Xuất bảng báo cáo sang file Excel/CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BÁO CÁO DOANH THU & SẢN LƯỢNG */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Sub-view selection */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">Góc nhìn phân tích:</span>
              <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                <button
                  onClick={() => setRevenueView('category')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    revenueView === 'category'
                      ? 'bg-white text-[#E53935] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Theo Nhóm hàng VPP
                </button>
                <button
                  onClick={() => setRevenueView('product')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    revenueView === 'product'
                      ? 'bg-white text-[#E53935] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Theo Từng mặt hàng VPP
                </button>
                <button
                  onClick={() => setRevenueView('manager')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    revenueView === 'manager'
                      ? 'bg-white text-[#E53935] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Theo Nhân viên phụ trách
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-gray-500">Tổng doanh thu toàn hệ thống:</span>
              <span className="text-base font-black text-[#E53935] ml-2">
                {formatVND(revenueData.totalRevenue)}
              </span>
            </div>
          </div>

          {/* Bảng dữ liệu chi tiết */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 w-28">Mã</th>
                    <th className="py-3 px-4">
                      {revenueView === 'category'
                        ? 'Nhóm sản phẩm VPP'
                        : revenueView === 'product'
                        ? 'Tên sản phẩm VPP'
                        : 'Họ tên nhân viên kinh doanh'}
                    </th>
                    {revenueView === 'product' && (
                      <th className="py-3 px-4 w-20 text-center">ĐVT</th>
                    )}
                    {revenueView === 'manager' ? (
                      <th className="py-3 px-4 w-32 text-center">Số đơn chốt</th>
                    ) : (
                      <th className="py-3 px-4 w-32 text-center">Số lượng bán</th>
                    )}
                    <th className="py-3 px-4 w-44 text-right">Doanh thu (VNĐ)</th>
                    <th className="py-3 px-4 w-56">Tỷ trọng (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingRevenue ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                        <p>Đang tính toán số liệu thống kê...</p>
                      </td>
                    </tr>
                  ) : revenueData.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        Chưa có số liệu phát sinh
                      </td>
                    </tr>
                  ) : (
                    revenueData.items.map((row) => (
                      <tr key={row.stt} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 text-center text-gray-500 text-xs font-semibold">
                          {row.stt}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-gray-700">
                          {row.code}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{row.name}</td>
                        {revenueView === 'product' && (
                          <td className="py-3 px-4 text-center text-xs text-gray-500">{row.unit}</td>
                        )}
                        {revenueView === 'manager' ? (
                          <td className="py-3 px-4 text-center font-bold text-gray-700">
                            {row.orderCount} đơn
                          </td>
                        ) : (
                          <td className="py-3 px-4 text-center font-bold text-gray-700">
                            {row.quantity?.toLocaleString('vi-VN')}
                          </td>
                        )}
                        <td className="py-3 px-4 text-right font-bold text-[#E53935]">
                          {formatVND(Number(row.revenue))}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.min(100, Number(row.percentage))}%` }}
                                className="h-full bg-[#E53935] rounded-full"
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-gray-700 w-12 text-right">
                              {row.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BÁO CÁO CÔNG NỢ PHẢI THU */}
      {activeTab === 'debts' && (
        <div className="space-y-6">
          {/* 4 Thẻ tóm tắt công nợ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Tổng doanh số xuất bán</p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {formatVND(debtsData.summary.totalPurchased)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Gồm thuế VAT 8%</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Tổng tiền đã thu</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatVND(debtsData.summary.totalPaid)}
              </p>
              <p className="text-xs text-emerald-700 mt-1">Đã vào tài khoản hoặc tiền mặt</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm bg-red-50/20">
              <p className="text-xs font-semibold text-[#E53935] uppercase">Tổng nợ còn phải thu</p>
              <p className="text-2xl font-black text-[#E53935] mt-1">
                {formatVND(debtsData.summary.totalDebt)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Công thức: Doanh số - Đã thu</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Khách hàng đang nợ</p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {debtsData.summary.customerWithDebtCount} khách
              </p>
              <p className="text-xs text-amber-700 mt-1">Cần theo dõi đôn đốc thanh toán</p>
            </div>
          </div>

          {/* Ô tìm kiếm khách nợ */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <form onSubmit={handleDebtSearchSubmit} className="flex gap-2 w-full sm:w-96">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên khách, mã KH, SĐT..."
                  value={debtSearch}
                  onChange={(e) => setDebtSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium"
              >
                Tìm
              </button>
            </form>

            <span className="text-xs text-gray-500">
              Hiển thị: <strong>{debtsData.customers.length}</strong> khách hàng có lịch sử giao dịch
            </span>
          </div>

          {/* Bảng danh sách công nợ chi tiết */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">SĐT & MST</th>
                    <th className="py-3 px-4">Phụ trách</th>
                    <th className="py-3 px-4 text-center">Số đơn</th>
                    <th className="py-3 px-4 text-right">Tổng mua</th>
                    <th className="py-3 px-4 text-right">Đã trả</th>
                    <th className="py-3 px-4 text-right">Còn nợ phải thu</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingDebts ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                        <p>Đang tải dữ liệu công nợ...</p>
                      </td>
                    </tr>
                  ) : debtsData.customers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        Không có khách hàng nào phù hợp với bộ lọc
                      </td>
                    </tr>
                  ) : (
                    debtsData.customers.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 text-center text-gray-500 text-xs font-semibold">
                          {c.stt}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{c.name}</div>
                          <div className="text-xs font-mono text-gray-500">{c.code}</div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <p className="font-medium text-gray-800">{c.phone}</p>
                          <p className="text-gray-400">MST: {c.taxCode || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-gray-700">
                          {c.managerName}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-gray-700">
                          {c.orderCount}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                          {formatVND(c.totalPurchased)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600">
                          {formatVND(c.totalPaid)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-bold ${
                              c.totalDebt > 0 ? 'text-[#E53935]' : 'text-gray-400'
                            }`}
                          >
                            {formatVND(c.totalDebt)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.totalDebt > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                              Đang còn nợ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              Đã hết nợ
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
