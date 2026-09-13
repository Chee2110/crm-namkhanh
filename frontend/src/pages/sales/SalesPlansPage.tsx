import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  TrendingUp,
  Trash2,
  Eye,
  AlertCircle,
  X,
  Building,
  Award
} from 'lucide-react';
import { api } from '../../services/api';
import { SalesPlan, SalesPlanItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const SalesPlansPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [plans, setPlans] = useState<SalesPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [yearFilter, setYearFilter] = useState<number>(2026);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);

  // Form State
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    periodType: 'QUARTER',
    periodValue: 'Q1',
    year: 2026,
    notes: '',
    items: [
      { category: 'Giấy in văn phòng', unit: 'Ram', targetQuantity: 1000, targetRevenue: 65000000 },
      { category: 'Bút viết & Mực', unit: 'Cây/Hộp', targetQuantity: 3000, targetRevenue: 25000000 },
      { category: 'File bìa còng & Lưu trữ', unit: 'Chiếc', targetQuantity: 800, targetRevenue: 35000000 },
      { category: 'Dụng cụ văn phòng', unit: 'Cái/Cuộn', targetQuantity: 1500, targetRevenue: 20000000 },
      { category: 'Thiết bị & Máy văn phòng', unit: 'Máy', targetQuantity: 10, targetRevenue: 45000000 }
    ]
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get<SalesPlan[]>(`/sales-plans?year=${yearFilter}`);
      setPlans(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách kế hoạch kinh doanh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [yearFilter]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title) {
      setFormError('Vui lòng nhập tên kế hoạch kinh doanh');
      return;
    }

    try {
      await api.post('/sales-plans', formData);
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        periodType: 'QUARTER',
        periodValue: 'Q1',
        year: 2026,
        notes: '',
        items: [
          { category: 'Giấy in văn phòng', unit: 'Ram', targetQuantity: 1000, targetRevenue: 65000000 },
          { category: 'Bút viết & Mực', unit: 'Cây/Hộp', targetQuantity: 3000, targetRevenue: 25000000 },
          { category: 'File bìa còng & Lưu trữ', unit: 'Chiếc', targetQuantity: 800, targetRevenue: 35000000 },
          { category: 'Dụng cụ văn phòng', unit: 'Cái/Cuộn', targetQuantity: 1500, targetRevenue: 20000000 },
          { category: 'Thiết bị & Máy văn phòng', unit: 'Máy', targetQuantity: 10, targetRevenue: 45000000 }
        ]
      });
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo kế hoạch');
    }
  };

  const handleViewCompare = async (planId: string) => {
    try {
      const res = await api.get(`/sales-plans/${planId}/compare`);
      setCompareData(res.data);
      setIsCompareModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xem chi tiết đối chiếu kế hoạch');
    }
  };

  const handleDeletePlan = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa kế hoạch "${title}"?`)) return;
    try {
      await api.delete(`/sales-plans/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xóa kế hoạch thất bại');
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const calculateTotalTarget = (items: SalesPlanItem[]) => {
    return items.reduce((sum, it) => sum + Number(it.targetRevenue), 0);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#E53935]" />
            Kế Hoạch & Chỉ Tiêu Doanh Số VPP
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập chỉ tiêu bán hàng theo kỳ và theo dõi tỷ lệ hoàn thành thực tế
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#E53935]"
          >
            <option value={2026}>Năm 2026</option>
            <option value={2025}>Năm 2025</option>
          </select>

          {hasPermission('B_SALES_PLANS', 'create') && (
            <button
              onClick={() => {
                setFormError(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Lập Kế hoạch Mới
            </button>
          )}
        </div>
      </div>

      {/* DANH SÁCH CÁC KẾ HOẠCH KINH DOANH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
            <p className="text-sm">Đang tải danh sách kế hoạch bán hàng...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-700">Chưa có kế hoạch kinh doanh nào trong năm {yearFilter}</p>
            <p className="text-xs text-gray-400 mt-1">Bấm "Lập Kế hoạch Mới" để giao chỉ tiêu doanh số VPP</p>
          </div>
        ) : (
          plans.map((plan) => {
            const totalTarget = calculateTotalTarget(plan.items);
            const totalActual = plan.items.reduce((sum, it) => sum + Number(it.actualRevenue || 0), 0);
            const completionRate = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-[#E53935]">
                      {plan.periodType === 'MONTH'
                        ? 'Tháng'
                        : plan.periodType === 'QUARTER'
                        ? 'Quý'
                        : 'Năm'}{' '}
                      {plan.periodValue} - {plan.year}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Đang áp dụng
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base mt-2.5 line-clamp-1">{plan.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {plan.notes || 'Chỉ tiêu phân phối 5 nhóm văn phòng phẩm chủ lực.'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Chỉ tiêu doanh thu:</span>
                      <span className="font-bold text-gray-900">{formatVND(totalTarget)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Doanh thu thực tế:</span>
                      <span className="font-bold text-emerald-600">{formatVND(totalActual)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-gray-600">Tiến độ đạt được:</span>
                        <span className={completionRate >= 100 ? 'text-emerald-600' : 'text-[#E53935]'}>
                          {completionRate}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(completionRate, 100)}%` }}
                          className={`h-full rounded-full ${
                            completionRate >= 100 ? 'bg-emerald-500' : 'bg-[#E53935]'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Tạo bởi: {plan.createdBy?.fullName || 'Ban Giám Đốc'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewCompare(plan.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Đối chiếu
                    </button>

                    {hasPermission('B_SALES_PLANS', 'delete') && (
                      <button
                        onClick={() => handleDeletePlan(plan.id, plan.title)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL LẬP KẾ HOẠCH KINH DOANH MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-[#E53935]">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Thiết Lập Kế Hoạch Bán Hàng Mới</h3>
                  <p className="text-xs text-gray-500">Giao chỉ tiêu sản lượng và doanh số 5 nhóm ngành VPP</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#E53935]">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tiêu đề kế hoạch <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Kế hoạch Doanh số Quý 1/2026 - Toàn công ty"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kỳ áp dụng</label>
                  <select
                    value={formData.periodType}
                    onChange={(e) => setFormData({ ...formData, periodType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="MONTH">Theo Tháng</option>
                    <option value="QUARTER">Theo Quý</option>
                    <option value="YEAR">Cả Năm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giá trị kỳ</label>
                  <input
                    type="text"
                    placeholder="VD: Q1, Tháng 9"
                    value={formData.periodValue}
                    onChange={(e) => setFormData({ ...formData, periodValue: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Bảng phân bổ chỉ tiêu 5 nhóm hàng */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-xs font-bold text-gray-700">
                  Phân bổ chỉ tiêu cho 5 nhóm mặt hàng văn phòng phẩm
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100/60 border-b border-gray-200 text-gray-600">
                    <tr>
                      <th className="p-2.5">Nhóm mặt hàng</th>
                      <th className="p-2.5 w-20">ĐVT</th>
                      <th className="p-2.5 w-32">Chỉ tiêu SL</th>
                      <th className="p-2.5 w-44 text-right">Chỉ tiêu Doanh thu (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-semibold text-gray-800">{it.category}</td>
                        <td className="p-2.5 text-gray-500">{it.unit}</td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            value={it.targetQuantity}
                            onChange={(e) => {
                              const updated = [...formData.items];
                              updated[idx].targetQuantity = Math.max(0, parseInt(e.target.value) || 0);
                              setFormData({ ...formData, items: updated });
                            }}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            step="1000000"
                            value={it.targetRevenue}
                            onChange={(e) => {
                              const updated = [...formData.items];
                              updated[idx].targetRevenue = Math.max(0, parseInt(e.target.value) || 0);
                              setFormData({ ...formData, items: updated });
                            }}
                            className="w-full p-1 border border-gray-200 rounded text-right font-bold text-[#E53935]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú kế hoạch</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về định hướng thị trường hoặc chương trình khuyến mại..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 text-xs border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  Tổng chỉ tiêu doanh thu:{' '}
                  <span className="font-bold text-[#E53935] text-sm ml-1">
                    {formatVND(formData.items.reduce((s, it) => s + it.targetRevenue, 0))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Lưu kế hoạch
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT & ĐỐI CHIẾU THỰC TẾ VS KẾ HOẠCH */}
      {isCompareModalOpen && compareData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-[#E53935]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Đối Chiếu Thực Tế vs Kế Hoạch Doanh Số
                  </h3>
                  <p className="text-xs text-gray-500">{compareData.plan.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tóm tắt 3 thẻ */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-500">Chỉ tiêu Doanh thu</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {formatVND(compareData.summary.totalTargetRevenue)}
                  </p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <p className="text-xs text-emerald-700">Doanh thu Thực tế Đạt</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">
                    {formatVND(compareData.summary.totalActualRevenue)}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <p className="text-xs text-[#E53935]">Tỷ lệ Hoàn thành Chung</p>
                  <p className="text-xl font-black text-[#E53935] mt-1">
                    {compareData.summary.overallPercent}%
                  </p>
                </div>
              </div>

              {/* Bảng đối chiếu từng nhóm ngành */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Nhóm VPP</th>
                      <th className="p-3 text-center">ĐVT</th>
                      <th className="p-3 text-center">Chỉ tiêu SL</th>
                      <th className="p-3 text-center">Thực tế SL</th>
                      <th className="p-3 text-right">Chỉ tiêu Doanh thu</th>
                      <th className="p-3 text-right">Thực tế Doanh thu</th>
                      <th className="p-3 text-center">% Doanh thu</th>
                      <th className="p-3 text-center">Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {compareData.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-800">{item.category}</td>
                        <td className="p-3 text-center text-gray-500">{item.unit}</td>
                        <td className="p-3 text-center">{item.targetQuantity.toLocaleString('vi-VN')}</td>
                        <td className="p-3 text-center font-semibold text-gray-900">
                          {item.actualQuantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 text-right font-medium text-gray-600">
                          {formatVND(item.targetRevenue)}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600">
                          {formatVND(item.actualRevenue)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-black ${
                              item.revenuePercent >= 100 ? 'text-emerald-600' : 'text-[#E53935]'
                            }`}
                          >
                            {item.revenuePercent}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {item.isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Đạt chỉ tiêu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> Cần đôn đốc
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
