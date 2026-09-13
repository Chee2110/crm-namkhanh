import React from 'react';
import { Printer, X, FileSpreadsheet, Truck } from 'lucide-react';
import { Order } from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';

interface DeliveryNotePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const DeliveryNotePrintModal: React.FC<DeliveryNotePrintModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  if (!isOpen || !order) return null;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const orderDate = new Date(order.orderDate);
  const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : orderDate;

  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Mã hàng',
      'Tên sản phẩm / quy cách',
      'Đơn vị tính',
      'Số lượng',
      'Đơn giá (VNĐ)',
      'Thuế VAT (%)',
      'Thành tiền (VNĐ)'
    ];

    const rows = (order.items || []).map((it, idx) => [
      idx + 1,
      `"${it.productCode}"`,
      `"${(it.productName || '').replace(/"/g, '""')}"`,
      `"${it.unit}"`,
      it.quantity,
      it.unitPrice,
      `"${it.vatRate !== undefined ? it.vatRate : order.vatRate}%"`,
      it.total || it.amount || it.quantity * it.unitPrice
    ]);

    const lines = [
      '\uFEFFPHIẾU XUẤT KHO KIÊM BIÊN BẢN GIAO NHẬN HÀNG HÓA - CÔNG TY TNHH TM&DV NAM KHÁNH',
      `Số đơn hàng: ${order.code}`,
      `Ngày đặt hàng: ${orderDate.toLocaleDateString('vi-VN')}`,
      `Ngày giao hàng: ${deliveryDate.toLocaleDateString('vi-VN')}`,
      `Khách hàng: ${(order.customer?.name || '').replace(/"/g, '""')}`,
      `Mã số thuế: ${order.customer?.taxCode || ''}`,
      `Người nhận: ${(order.contactPerson || order.customer?.contactPerson || '').replace(/"/g, '""')}`,
      `Số điện thoại: ${order.phone || order.customer?.phone || ''}`,
      `Địa chỉ giao nhận: ${(order.deliveryAddress || order.customer?.deliveryAddress || order.customer?.address || '').replace(/"/g, '""')}`,
      `Người phụ trách: ${(order.manager?.fullName || '').replace(/"/g, '""')}`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      `Cộng tiền hàng: ${Number(order.subtotal).toLocaleString('vi-VN')} VNĐ`,
      `Thuế GTGT (${order.vatRate}%): ${Number(order.vatAmount).toLocaleString('vi-VN')} VNĐ`,
      `Tổng giá trị đơn hàng: ${Number(order.totalAmount).toLocaleString('vi-VN')} VNĐ`,
      `Đã thanh toán: ${Number(order.paidAmount || 0).toLocaleString('vi-VN')} VNĐ`,
      `Còn phải thu khi giao: ${Number(order.remainingAmount || 0).toLocaleString('vi-VN')} VNĐ`,
      `Số tiền viết bằng chữ: ${numberToWords(Number(order.totalAmount))}`,
      `Ghi chú giao hàng: ${(order.notes || '').replace(/"/g, '""')}`
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Phieu_Giao_Hang_${order.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #delivery-note-print-area, #delivery-note-print-area * {
            visibility: visible;
          }
          #delivery-note-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: #ffffff;
            color: #000000;
            font-size: 13px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 no-print">
          <div className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
            <Truck className="w-5 h-5 text-red-600" />
            <span>In Phiếu Xuất Kho & Biên Bản Bàn Giao Hàng Hóa VPP</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
              title="Xuất bảng kê giao hàng sang Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In phiếu (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-gray-900" id="delivery-note-print-area">
          {/* Header công ty Nam Khánh */}
          <div className="flex justify-between items-start border-b-2 border-red-600 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center p-1">
                <img src="/logo.png" alt="Logo Nam Khánh" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold uppercase text-red-600 tracking-wide">
                  CÔNG TY TNHH THƯƠNG MẠI & DỊCH VỤ NAM KHÁNH
                </h1>
                <p className="text-xs text-gray-600">
                  Chuyên cung cấp Văn phòng phẩm - Thiết bị văn phòng - Vật tư đóng gói
                </p>
                <p className="text-xs text-gray-600">
                  Địa chỉ: Số 34, Ngõ 192 Lê Trọng Tấn, Q. Thanh Xuân, Hà Nội
                </p>
                <p className="text-xs text-gray-600">
                  Hotline / Zalo: 0987.654.321 - Email: kinhdoanh@namkhanh.vn
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase">Mã đơn hàng</div>
              <div className="text-base font-bold text-gray-900 font-mono">{order.code}</div>
              <div className="text-xs text-gray-500 mt-1">
                Ngày xuất: {deliveryDate.toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Tiêu đề biểu mẫu */}
          <div className="text-center my-6">
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              PHIẾU XUẤT KHO KIÊM BIÊN BẢN BÀN GIAO HÀNG HÓA
            </h2>
            <p className="text-xs text-gray-500 italic mt-1">
              (Liên 1: Lưu nội bộ / Liên 2: Giao khách hàng)
            </p>
          </div>

          {/* Thông tin giao hàng */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-1.5">
              <div>
                <span className="font-semibold text-gray-700">Đơn vị nhận hàng: </span>
                <span className="font-bold text-gray-900">{order.customer?.name}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Mã số thuế: </span>
                <span>{order.customer?.taxCode || '---'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Người nhận hàng: </span>
                <span>{order.contactPerson || order.customer?.contactPerson || 'Bộ phận hành chính'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Số điện thoại: </span>
                <span>{order.phone || order.customer?.phone || '---'}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div>
                <span className="font-semibold text-gray-700">Địa chỉ nhận hàng: </span>
                <span>{order.deliveryAddress || order.customer?.deliveryAddress || order.customer?.address}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Nhân viên phụ trách: </span>
                <span>{order.manager?.fullName || 'Bộ phận kinh doanh'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Trạng thái thanh toán: </span>
                <span className="font-semibold text-red-600">
                  {order.paymentStatus === 'PAID'
                    ? 'Đã tất toán'
                    : order.paymentStatus === 'PARTIAL_PAID'
                    ? 'Đã thanh toán một phần'
                    : 'Chưa thanh toán (Thu tiền khi giao)'}
                </span>
              </div>
              {order.notes && (
                <div>
                  <span className="font-semibold text-gray-700">Ghi chú giao: </span>
                  <span className="italic">{order.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bảng chi tiết mặt hàng */}
          <table className="w-full text-left border-collapse text-xs mb-6 border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-800 font-semibold border-b border-gray-300">
                <th className="py-2 px-2 border-r border-gray-300 text-center w-10">STT</th>
                <th className="py-2 px-2 border-r border-gray-300 w-24">Mã hàng</th>
                <th className="py-2 px-3 border-r border-gray-300">Tên sản phẩm / Quy cách</th>
                <th className="py-2 px-2 border-r border-gray-300 text-center w-14">ĐVT</th>
                <th className="py-2 px-2 border-r border-gray-300 text-right w-16">Số lượng</th>
                <th className="py-2 px-2 border-r border-gray-300 text-right w-24">Đơn giá</th>
                <th className="py-2 px-2 text-right w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((it, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2 px-2 border-r border-gray-300 text-center">{idx + 1}</td>
                  <td className="py-2 px-2 border-r border-gray-300 font-mono">{it.productCode}</td>
                  <td className="py-2 px-3 border-r border-gray-300 font-medium">{it.productName}</td>
                  <td className="py-2 px-2 border-r border-gray-300 text-center">{it.unit}</td>
                  <td className="py-2 px-2 border-r border-gray-300 text-right font-semibold">{it.quantity}</td>
                  <td className="py-2 px-2 border-r border-gray-300 text-right">{formatVND(it.unitPrice)}</td>
                  <td className="py-2 px-2 text-right font-semibold">
                    {formatVND(it.total || it.amount || it.quantity * it.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tổng tiền & Chữ ký */}
          <div className="flex justify-end mb-4">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Cộng tiền hàng:</span>
                <span className="font-semibold text-gray-900">{formatVND(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Thuế GTGT ({order.vatRate}%):</span>
                <span className="font-semibold text-gray-900">{formatVND(order.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-300 pt-1">
                <span>Tổng giá trị đơn hàng:</span>
                <span className="text-red-600">{formatVND(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-1">
                <span>Đã thanh toán:</span>
                <span className="font-medium text-emerald-600">{formatVND(order.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-dashed border-gray-300 pt-1 text-red-600">
                <span>Còn phải thu khi giao:</span>
                <span>{formatVND(order.remainingAmount || 0)}</span>
              </div>
            </div>
          </div>

          <div className="text-xs italic text-gray-700 mb-8">
            * Số tiền viết bằng chữ: <strong className="text-gray-900">{numberToWords(Number(order.totalAmount))}</strong>.
          </div>

          {/* 4 Chữ ký trách nhiệm */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs mt-10 pt-4 border-t border-gray-200">
            <div>
              <div className="font-bold uppercase text-gray-800">Người lập phiếu</div>
              <div className="text-[11px] text-gray-500 italic">(Ký, ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-medium text-gray-700">{order.manager?.fullName || 'Người lập'}</div>
            </div>
            <div>
              <div className="font-bold uppercase text-gray-800">Thủ kho xuất hàng</div>
              <div className="text-[11px] text-gray-500 italic">(Ký, ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-medium text-gray-700">Thủ kho</div>
            </div>
            <div>
              <div className="font-bold uppercase text-gray-800">Nhân viên giao nhận</div>
              <div className="text-[11px] text-gray-500 italic">(Ký, ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-medium text-gray-700">Tài xế giao hàng</div>
            </div>
            <div>
              <div className="font-bold uppercase text-gray-800">Người nhận hàng</div>
              <div className="text-[11px] text-gray-500 italic">(Ký, đóng dấu nếu có)</div>
              <div className="h-16"></div>
              <div className="font-medium text-gray-700">Đại diện khách hàng</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
