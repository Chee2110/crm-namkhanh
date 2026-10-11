import React from 'react';
import { Printer, X, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { OrderReturn, Order } from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';
import { formatVND, formatNumber } from '../../../utils/formatCurrency';

interface OrderReturnPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderReturn: OrderReturn | null;
  order?: Order | null;
}

export const OrderReturnPrintModal: React.FC<OrderReturnPrintModalProps> = ({
  isOpen,
  onClose,
  orderReturn,
  order
}) => {
  if (!isOpen || !orderReturn) return null;

  const handlePrint = () => {
    window.print();
  };

  const returnDate = new Date(orderReturn.returnDate || orderReturn.createdAt);
  const customerName = order?.customer?.name || orderReturn.order?.customer?.name || 'Khách hàng';
  const customerPhone = order?.phone || order?.customer?.phone || orderReturn.order?.customer?.phone || '';
  const customerAddress = order?.deliveryAddress || order?.customer?.address || '';
  const orderCode = order?.code || orderReturn.order?.code || '';

  const getRefundMethodText = (method: string) => {
    switch (method) {
      case 'DEDUCT_DEBT': return 'Cấn trừ trực tiếp vào công nợ đơn hàng';
      case 'CREDIT_BALANCE': return 'Cộng vào số dư ký quỹ / ví trả trước của khách hàng';
      case 'CASH_REFUND': return 'Lập phiếu chi hoàn trả tiền mặt / chuyển khoản';
      default: return method;
    }
  };

  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Mã hàng',
      'Tên sản phẩm',
      'Đơn vị tính',
      'Số lượng trả',
      'Đơn giá hoàn (VNĐ)',
      'Thành tiền (VNĐ)',
      'Tình trạng hàng'
    ];

    const rows = (orderReturn.items || []).map((it, idx) => [
      idx + 1,
      `"${it.productCode}"`,
      `"${(it.productName || '').replace(/"/g, '""')}"`,
      `"${it.unit}"`,
      it.quantity,
      it.unitPrice,
      it.amount || it.quantity * it.unitPrice,
      it.condition === 'DEFECTIVE' ? 'Hàng lỗi/hỏng (cách ly)' : 'Hàng tốt (nhập kho bán)'
    ]);

    const lines = [
      '\uFEFFPHIẾU NHẬP KHO TRẢ HÀNG KIÊM BIÊN BẢN THU HỒI HÀNG HÓA - CÔNG TY TNHH TM&DV NAM KHÁNH',
      `Số phiếu trả: ${orderReturn.code}`,
      `Theo đơn hàng: ${orderCode}`,
      `Ngày lập phiếu: ${returnDate.toLocaleDateString('vi-VN')}`,
      `Khách hàng: ${(customerName).replace(/"/g, '""')}`,
      `Số điện thoại: ${customerPhone}`,
      `Địa chỉ: ${(customerAddress).replace(/"/g, '""')}`,
      `Lý do trả hàng: ${(orderReturn.reason || '').replace(/"/g, '""')}`,
      `Phương thức xử lý tiền: ${getRefundMethodText(orderReturn.refundMethod)}`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      `Tổng giá trị hoàn trả: ${formatNumber(Number(orderReturn.totalRefundAmount))} VNĐ`,
      `Số tiền viết bằng chữ: ${numberToWords(Number(orderReturn.totalRefundAmount))}`,
      `Người lập phiếu: ${(orderReturn.createdBy?.fullName || '').replace(/"/g, '""')}`
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Phieu_Tra_Hang_${orderReturn.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-1 sm:p-1.5 overflow-hidden">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-order-return-modal,
          #printable-order-return-modal * {
            visibility: visible !important;
          }
          #printable-order-return-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[calc(100%-12px)] max-h-[calc(100%-12px)] flex flex-col overflow-hidden a4-modal print-modal-container">
        {/* Modal Header */}
        <div className="px-3 sm:px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-orange-50 no-print flex-shrink-0">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-600" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                Bản In Phiếu Nhập Kho Trả Hàng A4
              </h2>
              <span className="text-[11px] text-gray-600">
                Mã phiếu: <strong>{orderReturn.code}</strong> (Đơn: {orderCode})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Xuất file Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu A4</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Preview Container */}
        <div className="flex-1 overflow-y-auto a4-preview bg-gray-100 p-2 sm:p-3 flex justify-center">
          <div
            id="printable-order-return-modal"
            className="a4-sheet bg-white text-gray-900 font-sans text-xs shadow-md p-5 sm:p-7 max-w-[210mm] w-full"
            style={{ minHeight: 'auto' }}
          >
            {/* Header Doanh nghiệp */}
            <div className="flex justify-between items-start border-b border-gray-300 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="Nam Khánh Logo"
                  className="w-12 h-12 object-contain rounded border border-gray-200"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div>
                  <h1 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-tight">
                    CÔNG TY TNHH KINH DOANH THƯƠNG MẠI VÀ DỊCH VỤ NAM KHÁNH
                  </h1>
                  <p className="text-[10.5px] text-gray-600">Đ/C: Số 5, Ngách 11, Ngõ 1295 Giải Phóng, P. Thịnh Liệt, Q. Hoàng Mai, Hà Nội</p>
                  <p className="text-[10.5px] text-gray-600">Hotline: 0968.125.666 | 0988.752.666 • MST: 0108342790</p>
                </div>
              </div>
              <div className="text-right text-[10.5px]">
                <div className="font-bold text-orange-700 text-xs">Mẫu: 02-VT / NK</div>
                <div className="text-gray-500 font-mono mt-0.5">Mã: {orderReturn.code}</div>
                <div className="text-gray-500">Đơn gốc: {orderCode}</div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-3">
              <h2 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-wide">
                PHIẾU NHẬP KHO TRẢ HÀNG
              </h2>
              <div className="text-[11px] text-gray-600 italic mt-0.5">
                (Kiêm Biên Bản Thu Hồi Hàng Hóa - Ngày lập: {returnDate.toLocaleDateString('vi-VN')})
              </div>
            </div>

            {/* Thông tin phiếu trả hàng */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-3 rounded-lg border border-gray-200 bg-gray-50/70 text-[11px] mb-3">
              <div>
                <span className="text-gray-600">Khách hàng: </span>
                <strong className="text-gray-900">{customerName}</strong>
              </div>
              <div>
                <span className="text-gray-600">Số điện thoại: </span>
                <strong className="text-gray-900">{customerPhone || '---'}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Địa chỉ: </span>
                <span className="text-gray-800">{customerAddress || '---'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Lý do trả hàng: </span>
                <strong className="text-orange-800">{orderReturn.reason}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Phương án xử lý tài chính: </span>
                <strong className="text-blue-900">{getRefundMethodText(orderReturn.refundMethod)}</strong>
              </div>
            </div>

            {/* Bảng sản phẩm hoàn trả */}
            <table className="w-full border-collapse border border-gray-300 text-[11px] mb-3">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold">
                  <th className="border border-gray-300 p-1.5 text-center w-8">STT</th>
                  <th className="border border-gray-300 p-1.5 text-center w-20">Mã SKU</th>
                  <th className="border border-gray-300 p-1.5 text-left">Tên sản phẩm / quy cách</th>
                  <th className="border border-gray-300 p-1.5 text-center w-12">ĐVT</th>
                  <th className="border border-gray-300 p-1.5 text-center w-14">SL Trả</th>
                  <th className="border border-gray-300 p-1.5 text-right w-20">Đơn giá</th>
                  <th className="border border-gray-300 p-1.5 text-right w-24">Thành tiền</th>
                  <th className="border border-gray-300 p-1.5 text-center w-24">Tình trạng</th>
                </tr>
              </thead>
              <tbody>
                {orderReturn.items.map((it, idx) => {
                  const lineTotal = it.amount || it.quantity * it.unitPrice;
                  const isDefective = it.condition === 'DEFECTIVE';
                  return (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                      <td className="border border-gray-300 p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-gray-300 p-1.5 text-center font-mono text-[10px] text-gray-600">{it.productCode}</td>
                      <td className="border border-gray-300 p-1.5 font-medium text-gray-900">{it.productName}</td>
                      <td className="border border-gray-300 p-1.5 text-center text-gray-600">{it.unit}</td>
                      <td className="border border-gray-300 p-1.5 text-center font-bold text-orange-700">{it.quantity}</td>
                      <td className="border border-gray-300 p-1.5 text-right font-mono">{formatNumber(it.unitPrice)}</td>
                      <td className="border border-gray-300 p-1.5 text-right font-bold text-gray-900 font-mono">{formatNumber(lineTotal)}</td>
                      <td className="border border-gray-300 p-1.5 text-center">
                        {isDefective ? (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9.5px] font-bold">Lỗi (Cách ly)</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9.5px] font-bold">Hàng tốt</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Tổng cộng & Bằng chữ */}
            <div className="flex justify-end mb-3">
              <div className="w-full sm:w-1/2 border border-gray-200 rounded-lg p-2.5 bg-gray-50/60 space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-gray-200">
                  <span className="text-gray-900">Tổng giá trị hoàn trả:</span>
                  <span className="text-orange-700 font-mono">{formatVND(Number(orderReturn.totalRefundAmount))}</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] italic text-gray-700 mb-6">
              Số tiền hoàn trả viết bằng chữ: <strong>{numberToWords(Number(orderReturn.totalRefundAmount))}</strong>.
            </div>

            {/* 4 Chữ ký */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10.5px] pt-2">
              <div>
                <div className="font-bold uppercase text-gray-900">Người trả hàng</div>
                <div className="text-[9.5px] text-gray-500 italic">(Ký, ghi rõ họ tên)</div>
                <div className="h-10"></div>
                <div className="font-medium text-gray-700">{customerName}</div>
              </div>
              <div>
                <div className="font-bold uppercase text-gray-900">Người vận chuyển</div>
                <div className="text-[9.5px] text-gray-500 italic">(Ký, ghi rõ họ tên)</div>
                <div className="h-10"></div>
              </div>
              <div>
                <div className="font-bold uppercase text-gray-900">Thủ kho nhận</div>
                <div className="text-[9.5px] text-gray-500 italic">(Ký, nhận vào kho)</div>
                <div className="h-10"></div>
              </div>
              <div>
                <div className="font-bold uppercase text-gray-900">Người lập phiếu</div>
                <div className="text-[9.5px] text-gray-500 italic">(Ký, xác nhận)</div>
                <div className="h-10"></div>
                <div className="font-medium text-gray-700">{orderReturn.createdBy?.fullName || 'Bộ phận Kế toán'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
