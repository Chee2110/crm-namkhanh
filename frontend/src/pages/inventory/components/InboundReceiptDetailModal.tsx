import React, { useState } from 'react';
import {
  X,
  Printer,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Ban,
  Edit2,
  Layers,
  History,
  FileText,
  Warehouse,
  Truck,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Download,
  AlertCircle,
  Package,
  Tag,
  Check,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { InboundReceipt, InboundReceiptType, InboundReceiptStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface InboundReceiptDetailModalProps {
  receipt: InboundReceipt | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (receipt: InboundReceipt) => void;
  onEdit?: (receipt: InboundReceipt) => void;
  onVerify?: (receipt: InboundReceipt) => void;
  onApprove?: (receipt: InboundReceipt) => void;
  onReject?: (receipt: InboundReceipt) => void;
  onCancel?: (receipt: InboundReceipt) => void;
  onDelete?: (receipt: InboundReceipt) => void;
}

export const InboundReceiptDetailModal: React.FC<InboundReceiptDetailModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onPrint,
  onEdit,
  onVerify,
  onApprove,
  onReject,
  onCancel,
  onDelete
}) => {
  if (!isOpen || !receipt) return null;

  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'items' | 'history' | 'document'>('items');

  const canApproveOrEdit =
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('CEO') ||
    hasPermission('C_INBOUND_RECEIPTS', 'update');

  const canDelete =
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('CEO') ||
    user?.roles?.includes('WAREHOUSE') ||
    hasPermission('C_INBOUND_RECEIPTS', 'delete');

  const typeConfig: Record<InboundReceiptType, { label: string; color: string }> = {
    PURCHASE: { label: 'Nhập mua hàng từ NCC', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    FINISHED_GOODS: { label: 'Nhập thành phẩm sản xuất', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    RETURN: { label: 'Nhập hàng hoàn trả', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    ADJUSTMENT: { label: 'Nhập điều chỉnh kiểm kê', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  };

  const statusConfig: Record<InboundReceiptStatus, { label: string; color: string; dot: string }> = {
    DRAFT: { label: 'Bản nháp', color: 'bg-gray-100 text-gray-700 border-gray-300', dot: 'bg-gray-400' },
    CHECKING: { label: 'Đang kiểm hàng', color: 'bg-amber-50 text-amber-700 border-amber-300', dot: 'bg-amber-500' },
    APPROVED: { label: 'Đã duyệt & Đã nhập kho', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
    REJECTED: { label: 'Từ chối duyệt', color: 'bg-rose-50 text-rose-700 border-rose-300', dot: 'bg-rose-500' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-50 text-red-700 border-red-300', dot: 'bg-red-500' }
  };

  const currentType = typeConfig[receipt.type] || { label: receipt.type, color: 'bg-gray-50 text-gray-700 border-gray-200' };
  const currentStatus = statusConfig[receipt.status] || {
    label: receipt.status,
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    dot: 'bg-gray-400'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-gray-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-[#E53935] rounded-xl border border-red-100">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 font-mono tracking-tight">
                  {receipt.code}
                </h2>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${currentType.color}`}>
                  {currentType.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${currentStatus.color}`}>
                  <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`}></span>
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Kho nhận: <strong className="text-gray-700">{receipt.warehouse?.name}</strong> • Ngày lập:{' '}
                {new Date(receipt.receiptDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onPrint(receipt)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-gray-600" />
              <span>In phiếu (A4)</span>
            </button>

            {canApproveOrEdit && (receipt.status === 'DRAFT' || receipt.status === 'CHECKING') && (
              <>
                {onVerify && (
                  <button
                    onClick={() => onVerify(receipt)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kiểm hàng thực tế</span>
                  </button>
                )}

                {onApprove && (
                  <button
                    onClick={() => onApprove(receipt)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Duyệt nhập kho</span>
                  </button>
                )}

                {onReject && (
                  <button
                    onClick={() => onReject(receipt)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Từ chối</span>
                  </button>
                )}
              </>
            )}

            {canApproveOrEdit && (receipt.status === 'DRAFT' || receipt.status === 'REJECTED') && onEdit && (
              <button
                onClick={() => onEdit(receipt)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                <span>Sửa phiếu</span>
              </button>
            )}

            {canApproveOrEdit && receipt.status !== 'CANCELLED' && onCancel && (
              <button
                onClick={() => onCancel(receipt)}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Hủy phiếu nhập kho (Sẽ trừ lại tồn kho nếu phiếu đã duyệt)"
              >
                <Ban className="w-3.5 h-3.5 text-red-600" />
                <span>Hủy phiếu</span>
              </button>
            )}

            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(receipt)}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Xóa vĩnh viễn phiếu nhập kho này"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Xóa phiếu</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thông tin vắn tắt (Cards) */}
        <div className="bg-gray-50/70 px-6 py-3.5 border-b border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Nhà cung cấp / Nguồn:</span>
            <div className="font-semibold text-gray-900 truncate">
              {receipt.supplier ? receipt.supplier.name : receipt.sourceName || 'Nhập nội bộ / Khác'}
            </div>
            {receipt.supplier?.phone && (
              <div className="text-[11px] text-gray-500">{receipt.supplier.phone}</div>
            )}
          </div>

          <div>
            <span className="text-gray-500">Số hóa đơn / Chứng từ:</span>
            <div className="font-semibold text-gray-900 font-mono">
              {receipt.documentNumber || 'Không đính kèm'}
            </div>
            {receipt.documentDate && (
              <div className="text-[11px] text-gray-500">
                Ngày: {new Date(receipt.documentDate).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>

          <div>
            <span className="text-gray-500">Người lập phiếu:</span>
            <div className="font-semibold text-gray-900">
              {receipt.createdBy?.fullName || 'Người lập'} ({receipt.createdBy?.code || 'NV'})
            </div>
            <div className="text-[11px] text-gray-500">
              Lúc: {new Date(receipt.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>

          <div>
            <span className="text-gray-500">Người duyệt / Tình trạng:</span>
            <div className="font-semibold text-gray-900">
              {receipt.approvedBy?.fullName || (receipt.status === 'APPROVED' ? 'Đã duyệt' : 'Chưa duyệt')}
            </div>
            {receipt.approvedAt && (
              <div className="text-[11px] text-emerald-600 font-medium">
                Duyệt lúc: {new Date(receipt.approvedAt).toLocaleString('vi-VN')}
              </div>
            )}
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex items-center px-6 border-b border-gray-200 bg-white gap-8 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'items'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Chi tiết mặt hàng & NVL ({receipt.items?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử nhập kho & Nhật ký ({receipt.history?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('document')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'document'
                ? 'border-red-600 text-red-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Chứng từ & Hóa đơn đính kèm</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-800 flex-1">
          {/* TAB 1: DANH SÁCH MẶT HÀNG */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 text-center">
                      <th className="px-2 py-2.5 w-10">STT</th>
                      <th className="px-3 py-2.5 text-left w-56">Tên mặt hàng quy cách</th>
                      <th className="px-2 py-2.5 w-20">Mã SKU</th>
                      <th className="px-2 py-2.5 w-14">ĐVT</th>
                      <th className="px-2 py-2.5 w-28">Lô hàng / HSD</th>
                      <th className="px-2 py-2.5 w-28">Vị trí kho</th>
                      <th className="px-2 py-2.5 w-20">Chứng từ</th>
                      <th className="px-2 py-2.5 w-20">Thực nhận</th>
                      <th className="px-2 py-2.5 w-20">Chấp nhận</th>
                      <th className="px-2 py-2.5 w-24 text-right">Đơn giá</th>
                      <th className="px-2 py-2.5 w-28 text-right">Thành tiền</th>
                      <th className="px-2 py-2.5 w-24">Chất lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {receipt.items?.map((it, idx) => {
                      const expDateStr = it.expiryDate
                        ? new Date(it.expiryDate).toLocaleDateString('vi-VN')
                        : '';
                      const locStr = [it.locationArea, it.locationRack, it.locationShelf, it.locationBin]
                        .filter(Boolean)
                        .join(' - ');

                      return (
                        <tr key={it.id || idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-2 py-2.5 text-center text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-medium text-gray-900">
                            {it.productName}
                            {it.qualityNotes && (
                              <div className="text-[11px] text-gray-500 italic mt-0.5">
                                KCS: {it.qualityNotes}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-center font-mono text-gray-600">{it.productCode}</td>
                          <td className="px-2 py-2.5 text-center">{it.unit}</td>
                          <td className="px-2 py-2.5 text-center">
                            {it.batchNumber ? (
                              <div>
                                <span className="font-semibold text-gray-800">{it.batchNumber}</span>
                                {expDateStr && <div className="text-[10px] text-gray-500">HSD: {expDateStr}</div>}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-center text-gray-700 font-medium">
                            {locStr || <span className="text-gray-400">Kho chính</span>}
                          </td>
                          <td className="px-2 py-2.5 text-center text-gray-600">{it.expectedQuantity}</td>
                          <td className="px-2 py-2.5 text-center font-semibold text-blue-700">
                            {it.actualQuantity}
                          </td>
                          <td className="px-2 py-2.5 text-center font-bold text-emerald-700 bg-emerald-50/50">
                            {it.acceptedQuantity || it.actualQuantity}
                          </td>
                          <td className="px-2 py-2.5 text-right text-gray-700">
                            {Number(it.unitPrice).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-2 py-2.5 text-right font-bold text-gray-900">
                            {Number(it.amount).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                it.qualityStatus === 'PASSED'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : it.qualityStatus === 'CONDITIONAL'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {it.qualityStatus === 'PASSED'
                                ? 'Đạt 100%'
                                : it.qualityStatus === 'CONDITIONAL'
                                ? 'Đạt có ĐK'
                                : 'Không đạt'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tóm tắt tiền hàng & Ghi chú */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700">Ghi chú diễn giải:</div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 min-h-[60px]">
                    {receipt.notes || 'Không có ghi chú thêm.'}
                  </div>
                  {receipt.rejectedReason && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                      <strong>Lý do từ chối / hủy:</strong> {receipt.rejectedReason}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Tổng tiền hàng (chưa VAT):</span>
                    <span className="font-semibold text-gray-900">
                      {Number(receipt.subtotal).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Thuế GTGT (VAT {receipt.vatRate}%):</span>
                    <span className="font-semibold text-gray-900">
                      {Number(receipt.vatAmount).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-gray-900">
                    <span className="text-[#E53935]">TỔNG CỘNG GIÁ TRỊ NHẬP KHO:</span>
                    <span className="text-base text-[#E53935]">
                      {Number(receipt.totalAmount).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LỊCH SỬ NHẬP KHO */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                <span>Nhật ký thời gian, người thực hiện & thay đổi trạng thái</span>
              </div>

              {receipt.history && receipt.history.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  {receipt.history.map((h) => (
                    <div key={h.id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-white border-2 border-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                      </div>

                      <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-gray-500">
                          <span className="font-bold text-gray-900 text-sm">{h.title}</span>
                          <span className="font-mono text-[11px]">
                            {new Date(h.performedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {h.description && <p className="text-gray-700">{h.description}</p>}
                        <div className="text-[11px] text-gray-500 pt-1">
                          Thực hiện bởi:{' '}
                          <strong className="text-gray-800">
                            {h.performedBy?.fullName || 'Hệ thống'}
                          </strong>{' '}
                          ({h.performedBy?.code || 'SYS'})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Chưa có lịch sử cập nhật nào cho phiếu này
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHỨNG TỪ & HÓA ĐƠN ĐÍNH KÈM */}
          {activeTab === 'document' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Chứng từ gốc đối chiếu</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Số hóa đơn / Biên bản giao nhận:</span>
                    <div className="font-bold text-gray-900 text-sm font-mono mt-0.5">
                      {receipt.documentNumber || 'Không có số chứng từ'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày ghi trên chứng từ:</span>
                    <div className="font-medium text-gray-900 mt-0.5">
                      {receipt.documentDate
                        ? new Date(receipt.documentDate).toLocaleDateString('vi-VN')
                        : 'Không rõ'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tệp tin đính kèm */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Tệp tin chứng từ đính kèm
                </div>

                {receipt.fileUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {receipt.fileName || 'chung_tu_nhap_kho.pdf'}
                          </div>
                          <span className="text-[11px] text-gray-500 font-mono">{receipt.fileUrl}</span>
                        </div>
                      </div>
                      <a
                        href={receipt.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white hover:bg-gray-50 text-red-600 border border-red-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Mở tài liệu</span>
                      </a>
                    </div>

                    {/* Preview ảnh nếu là file ảnh */}
                    {/\.(jpg|jpeg|png|webp)$/i.test(receipt.fileUrl) && (
                      <div className="p-2 border border-gray-200 rounded-xl bg-gray-50 flex justify-center">
                        <img
                          src={receipt.fileUrl}
                          alt="Hóa đơn chứng từ"
                          className="max-h-96 object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    Phiếu nhập này chưa có tệp tin chứng từ đính kèm
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
