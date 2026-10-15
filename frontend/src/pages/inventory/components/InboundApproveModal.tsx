import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Package,
  Layers,
  Loader2,
  DollarSign
} from 'lucide-react';
import { api } from '../../../services/api';
import { InboundReceipt } from '../../../types';

interface InboundApproveModalProps {
  receipt: InboundReceipt | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (approvedReceipt: InboundReceipt) => void;
}

export const InboundApproveModal: React.FC<InboundApproveModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen || !receipt) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateCostPrice, setUpdateCostPrice] = useState(false);
  const [notes, setNotes] = useState('');

  const totalAcceptedQty = receipt.items.reduce(
    (sum, it) => sum + (it.acceptedQuantity > 0 ? it.acceptedQuantity : it.actualQuantity),
    0
  );

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post<InboundReceipt>(`/inbound-receipts/${receipt.id}/approve`, {
        updateCostPrice,
        notes: notes.trim() || undefined
      });

      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      console.error('Lỗi duyệt phiếu nhập kho:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt phiếu nhập kho');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Phê duyệt & Cập nhật tồn kho tự động</h2>
              <p className="text-xs text-emerald-100">
                Xác nhận nhập kho phiếu: <strong className="underline">{receipt.code}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm text-gray-800">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Banner thông báo quan trọng */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 space-y-1">
              <div className="font-bold text-emerald-900 text-sm">
                Cập nhật tự động cộng tồn kho vào hệ thống
              </div>
              <p>
                Khi xác nhận phê duyệt, toàn bộ <strong>{totalAcceptedQty}</strong> đơn vị sản phẩm được chấp nhận sẽ được hệ thống{' '}
                <span className="font-bold underline">tự động cộng trực tiếp vào số lượng tồn kho</span> của từng mặt hàng tại kho{' '}
                <strong>{receipt.warehouse?.name}</strong>.
              </p>
            </div>
          </div>

          {/* Thông tin phiếu tóm tắt */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
            <div>
              <span className="text-gray-500">Mã phiếu:</span>
              <div className="font-bold text-gray-900 font-mono">{receipt.code}</div>
            </div>
            <div>
              <span className="text-gray-500">Kho lưu trữ:</span>
              <div className="font-bold text-gray-900">{receipt.warehouse?.name}</div>
            </div>
            <div>
              <span className="text-gray-500">Tổng giá trị phiếu:</span>
              <div className="font-bold text-emerald-600">
                {Number(receipt.totalAmount).toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          {/* Danh sách mặt hàng và số lượng sẽ cộng tồn */}
          <div>
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Chi tiết số lượng cộng tồn kho ({receipt.items.length} mặt hàng)</span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 text-center">
                    <th className="px-2 py-2 w-8">STT</th>
                    <th className="px-3 py-2 text-left">Tên sản phẩm</th>
                    <th className="px-2 py-2 w-16">ĐVT</th>
                    <th className="px-2 py-2 w-24 text-right">SL Nhập kho</th>
                    <th className="px-2 py-2 w-28 text-right">Đơn giá nhập</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipt.items.map((it, idx) => {
                    const qty = it.acceptedQuantity > 0 ? it.acceptedQuantity : it.actualQuantity;
                    return (
                      <tr key={it.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 text-center text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{it.productName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{it.productCode}</div>
                        </td>
                        <td className="px-2 py-2 text-center text-gray-600">{it.unit}</td>
                        <td className="px-2 py-2 text-right font-bold text-emerald-600">
                          +{qty}
                        </td>
                        <td className="px-2 py-2 text-right text-gray-700">
                          {Number(it.unitPrice).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tùy chọn cập nhật giá vốn */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={updateCostPrice}
                onChange={(e) => setUpdateCostPrice(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <span className="font-semibold text-gray-800">
                Đồng thời cập nhật giá vốn sản phẩm (Cost Price) theo đơn giá nhập kho này
              </span>
            </label>
            <p className="text-[11px] text-gray-500 pl-6">
              (Nếu tích chọn, giá vốn trong danh mục sản phẩm sẽ tự động cập nhật theo đơn giá mua mới nhất)
            </p>
          </div>

          {/* Ghi chú duyệt */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Ghi chú phê duyệt (tùy chọn)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã đối chiếu hóa đơn hợp lệ, đồng ý nhập kho..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleApprove}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Xác nhận Duyệt & Tự động cộng tồn kho</span>
          </button>
        </div>
      </div>
    </div>
  );
};
