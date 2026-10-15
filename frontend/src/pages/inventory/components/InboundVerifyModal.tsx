import React, { useState } from 'react';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Package,
  Layers,
  MapPin
} from 'lucide-react';
import { api } from '../../../services/api';
import { InboundReceipt, InboundReceiptItem } from '../../../types';

interface InboundVerifyModalProps {
  receipt: InboundReceipt | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedReceipt: InboundReceipt) => void;
}

interface ItemVerifyState {
  id: string;
  productName: string;
  productCode: string;
  unit: string;
  expectedQuantity: number;
  actualQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  qualityStatus: 'PASSED' | 'CONDITIONAL' | 'FAILED';
  qualityNotes: string;
  locationArea: string;
  locationRack: string;
  locationShelf: string;
  locationBin: string;
}

export const InboundVerifyModal: React.FC<InboundVerifyModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen || !receipt) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generalNotes, setGeneralNotes] = useState(receipt.notes || '');

  const [items, setItems] = useState<ItemVerifyState[]>(() =>
    receipt.items.map((it) => ({
      id: it.id,
      productName: it.productName,
      productCode: it.productCode,
      unit: it.unit,
      expectedQuantity: it.expectedQuantity,
      actualQuantity: it.actualQuantity !== undefined ? it.actualQuantity : it.expectedQuantity,
      acceptedQuantity: it.acceptedQuantity !== undefined ? it.acceptedQuantity : it.actualQuantity,
      rejectedQuantity: it.rejectedQuantity || 0,
      qualityStatus: it.qualityStatus || 'PASSED',
      qualityNotes: it.qualityNotes || '',
      locationArea: it.locationArea || 'Khu A',
      locationRack: it.locationRack || 'Kệ 01',
      locationShelf: it.locationShelf || '',
      locationBin: it.locationBin || ''
    }))
  );

  const handleItemChange = (index: number, field: keyof ItemVerifyState, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const it = { ...copy[index], [field]: value };

      if (field === 'actualQuantity') {
        const act = Math.max(0, Number(value) || 0);
        it.actualQuantity = act;
        it.acceptedQuantity = act;
        it.rejectedQuantity = 0;
      } else if (field === 'acceptedQuantity') {
        const acc = Math.max(0, Number(value) || 0);
        it.acceptedQuantity = acc;
        it.rejectedQuantity = Math.max(0, it.actualQuantity - acc);
      }

      copy[index] = it;
      return copy;
    });
  };

  const handleQuickPassAll = () => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        actualQuantity: it.expectedQuantity,
        acceptedQuantity: it.expectedQuantity,
        rejectedQuantity: 0,
        qualityStatus: 'PASSED',
        qualityNotes: 'Đạt chuẩn 100% theo chứng từ gốc'
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const res = await api.post<InboundReceipt>(`/inbound-receipts/${receipt.id}/verify`, {
        items: items.map((it) => ({
          id: it.id,
          actualQuantity: Number(it.actualQuantity) || 0,
          acceptedQuantity: Number(it.acceptedQuantity) || 0,
          rejectedQuantity: Number(it.rejectedQuantity) || 0,
          qualityStatus: it.qualityStatus,
          qualityNotes: it.qualityNotes?.trim() || null,
          locationArea: it.locationArea?.trim() || null,
          locationRack: it.locationRack?.trim() || null,
          locationShelf: it.locationShelf?.trim() || null,
          locationBin: it.locationBin?.trim() || null
        })),
        notes: generalNotes.trim()
      });

      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận kiểm hàng');
    } finally {
      setLoading(false);
    }
  };

  const totalExpected = items.reduce((s, it) => s + it.expectedQuantity, 0);
  const totalActual = items.reduce((s, it) => s + it.actualQuantity, 0);
  const totalAccepted = items.reduce((s, it) => s + it.acceptedQuantity, 0);
  const totalRejected = items.reduce((s, it) => s + it.rejectedQuantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                Kiểm tra thực tế hàng nhận: {receipt.code}
              </h2>
              <p className="text-xs text-blue-100">
                Đối chiếu chứng từ, kiểm đếm số lượng, đánh giá chất lượng và xác nhận vị trí lưu kho
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-gray-800 text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Thanh đối chiếu nhanh & nút Đạt chuẩn tất cả */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-gray-500">Kho nhận:</span>{' '}
                <strong className="text-gray-900">{receipt.warehouse?.name}</strong>
              </div>
              <div>
                <span className="text-gray-500">Số chứng từ:</span>{' '}
                <strong className="text-gray-900">{receipt.documentNumber || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-gray-500">Tổng SL chứng từ:</span>{' '}
                <strong className="text-gray-900">{totalExpected}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickPassAll}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận đạt chuẩn 100% tất cả</span>
            </button>
          </div>

          {/* Bảng chi tiết đối chiếu từng mặt hàng */}
          <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 text-center">
                  <th className="px-2 py-2.5 w-10">STT</th>
                  <th className="px-3 py-2.5 text-left w-56">Mặt hàng quy cách</th>
                  <th className="px-2 py-2.5 w-14">ĐVT</th>
                  <th className="px-2 py-2.5 w-20">Chứng từ</th>
                  <th className="px-2 py-2.5 w-24">Thực nhận</th>
                  <th className="px-2 py-2.5 w-24">Chấp nhận</th>
                  <th className="px-2 py-2.5 w-20">Từ chối (Lỗi)</th>
                  <th className="px-2 py-2.5 w-32">Chất lượng</th>
                  <th className="px-2 py-2.5 w-40">Vị trí kho thực tế</th>
                  <th className="px-2 py-2.5 w-44">Ghi chú kiểm tra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it, idx) => (
                  <tr key={it.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-2 py-2 text-center text-gray-500 font-semibold">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-gray-900">{it.productName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{it.productCode}</div>
                    </td>
                    <td className="px-2 py-2 text-center text-gray-600">{it.unit}</td>
                    <td className="px-2 py-2 text-center font-semibold text-gray-700">
                      {it.expectedQuantity}
                    </td>

                    {/* SL thực tế */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        value={it.actualQuantity}
                        onChange={(e) => handleItemChange(idx, 'actualQuantity', e.target.value)}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-center font-bold text-blue-700 bg-blue-50/30"
                      />
                    </td>

                    {/* SL Chấp nhận */}
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        max={it.actualQuantity}
                        value={it.acceptedQuantity}
                        onChange={(e) => handleItemChange(idx, 'acceptedQuantity', e.target.value)}
                        className="w-full px-2 py-1 border border-green-300 rounded text-center font-bold text-green-700 bg-green-50/30"
                      />
                    </td>

                    {/* SL Từ chối */}
                    <td className="px-2 py-2 text-center font-bold">
                      <span className={it.rejectedQuantity > 0 ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded' : 'text-gray-400'}>
                        {it.rejectedQuantity}
                      </span>
                    </td>

                    {/* Đánh giá chất lượng */}
                    <td className="px-2 py-2">
                      <select
                        value={it.qualityStatus}
                        onChange={(e) => handleItemChange(idx, 'qualityStatus', e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-xs font-semibold ${
                          it.qualityStatus === 'PASSED'
                            ? 'text-green-700 bg-green-50 border-green-200'
                            : it.qualityStatus === 'CONDITIONAL'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-red-700 bg-red-50 border-red-200'
                        }`}
                      >
                        <option value="PASSED">Đạt chuẩn 100%</option>
                        <option value="CONDITIONAL">Đạt có điều kiện</option>
                        <option value="FAILED">Không đạt (Lỗi)</option>
                      </select>
                    </td>

                    {/* Vị trí lưu kho chi tiết */}
                    <td className="px-2 py-2 space-y-1">
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="text"
                          value={it.locationArea}
                          onChange={(e) => handleItemChange(idx, 'locationArea', e.target.value)}
                          placeholder="Khu"
                          className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-[11px]"
                        />
                        <input
                          type="text"
                          value={it.locationRack}
                          onChange={(e) => handleItemChange(idx, 'locationRack', e.target.value)}
                          placeholder="Kệ"
                          className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-[11px]"
                        />
                      </div>
                      <input
                        type="text"
                        value={it.locationBin}
                        onChange={(e) => handleItemChange(idx, 'locationBin', e.target.value)}
                        placeholder="Ô / Vị trí"
                        className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-[11px]"
                      />
                    </td>

                    {/* Ghi chú KCS */}
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={it.qualityNotes}
                        onChange={(e) => handleItemChange(idx, 'qualityNotes', e.target.value)}
                        placeholder="Quy cách, bao bì, tem..."
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tổng kết kiểm hàng */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-xs">
            <div>
              <div className="text-gray-500">Tổng SL theo chứng từ</div>
              <div className="text-lg font-bold text-gray-800">{totalExpected}</div>
            </div>
            <div>
              <div className="text-gray-500">Tổng SL thực nhận</div>
              <div className="text-lg font-bold text-blue-600">{totalActual}</div>
            </div>
            <div>
              <div className="text-gray-500">Tổng SL được chấp nhận</div>
              <div className="text-lg font-bold text-green-600">{totalAccepted}</div>
            </div>
            <div>
              <div className="text-gray-500">Tổng SL lỗi / từ chối</div>
              <div className="text-lg font-bold text-red-600">{totalRejected}</div>
            </div>
          </div>

          {/* Ghi chú chung người kiểm hàng */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Ghi chú của người kiểm hàng thực tế
            </label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={2}
              placeholder="Ghi chú chi tiết về tình trạng bàn giao, hàng hóa thừa/thiếu, niêm phong tem mác..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer nút bấm */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Hoàn tất kiểm hàng & Chuyển sang chờ duyệt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
