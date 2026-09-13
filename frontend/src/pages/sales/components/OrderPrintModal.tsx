import React from 'react';
import { Printer, X } from 'lucide-react';
import { Order } from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';

interface OrderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const OrderPrintModal: React.FC<OrderPrintModalProps> = ({
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

  const orderDate = new Date(order.orderDate || order.createdAt);
  const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : orderDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 max-h-[95vh] flex flex-col">
        {/* Header điều khiển (Không in) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 no-print flex-shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#E53935]" />
            <h3 className="font-bold text-gray-900 text-base">
              Bản In Phiếu Xuất Kho Kiêm Giao Hàng A4 - {order.code}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary !py-1.5 !px-4 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu Xuất Kho (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= KHUNG IN A4 CHUẨN KẾ TOÁN (SECTION XI.6) ================= */}
        <div className="p-8 md:p-12 overflow-y-auto flex-1 font-serif text-gray-900 bg-white" id="printable-invoice">
          {/* Header thông tin công ty Nam Khánh */}
          <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-[#E53935] pb-4 gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 p-1 flex-shrink-0 flex items-center justify-center shadow-sm">
                <img src="/logo.png" alt="Nam Khánh Logo" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-lg font-black tracking-tight text-[#E53935] uppercase font-sans">
                  CÔNG TY TNHH THƯƠNG MẠI & DỊCH VỤ NAM KHÁNH
                </h1>
                <p className="text-xs text-gray-700 font-sans font-medium">
                  Chuyên cung cấp Văn phòng phẩm & Thiết bị văn phòng uy tín, chuyên nghiệp
                </p>
                <p className="text-[11px] text-gray-500 font-sans">
                  Địa chỉ: Số 32, Ngõ 111 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, TP. Hà Nội
                </p>
                <p className="text-[11px] text-gray-500 font-sans">
                  Hotline: (024) 3768 9999 | Email: kinhdoanh@namkhanh.vn | MST: 0109876543
                </p>
                <p className="text-[11px] text-gray-600 font-sans font-semibold">
                  TK 1: 19035678901234 - Techcombank (CN Hà Tây) | TK 2: 0451000345678 - Vietcombank (CN Thành Công)
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right font-sans flex-shrink-0">
              <div className="text-xs font-bold text-[#E53935]">MÃ ĐƠN HÀNG: {order.code}</div>
              <div className="text-xs text-gray-600 mt-1">
                Ngày đặt: {orderDate.toLocaleDateString('vi-VN')}
              </div>
              <div className="text-xs text-gray-600">
                Ngày giao: {deliveryDate.toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Tiêu đề Phiếu xuất kho */}
          <div className="text-center my-6">
            <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900 font-sans">
              PHIẾU XUẤT KHO KIÊM BIÊN BẢN GIAO HÀNG
            </h2>
            <p className="text-xs italic text-gray-500 mt-1">
              Ngày {deliveryDate.getDate()} tháng {deliveryDate.getMonth() + 1} năm {deliveryDate.getFullYear()}
            </p>
          </div>

          {/* Thông tin Đối tác / Người nhận hàng */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 text-xs font-sans space-y-1.5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <strong>Kính gửi (Đơn vị nhận hàng):</strong> {order.customer?.name || 'Quý khách hàng'}
              </div>
              <div>
                <strong>Mã số thuế:</strong> {order.customer?.taxCode || 'Theo hồ sơ khách hàng'}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <strong>Người nhận hàng:</strong> {order.contactPerson || order.customer?.contactPerson || 'Bộ phận tiếp nhận'}
              </div>
              <div>
                <strong>Số điện thoại:</strong> {order.phone || order.customer?.phone || 'Chưa cập nhật'}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <strong>Địa chỉ giao hàng:</strong> {order.deliveryAddress || order.customer?.deliveryAddress || order.customer?.address || 'Tại địa chỉ khách hàng'}
              </div>
              <div>
                <strong>Nhân viên phụ trách đơn:</strong> {order.manager?.fullName || 'Đội ngũ Kinh doanh Nam Khánh'}
              </div>
            </div>
            {order.notes && (
              <div className="text-gray-500 italic pt-1 border-t border-gray-200">
                Ghi chú giao hàng: {order.notes}
              </div>
            )}
          </div>

          {/* Bảng chi tiết 8 cột chuẩn theo Quy chuẩn Section XI.6 */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-xs border border-collapse border-gray-300 font-sans">
              <thead>
                <tr className="bg-gray-100 text-gray-800 text-center font-bold">
                  <th className="border border-gray-300 p-2 w-10">STT</th>
                  <th className="border border-gray-300 p-2 w-24">Mã hàng</th>
                  <th className="border border-gray-300 p-2 text-left">Tên sản phẩm, quy cách</th>
                  <th className="border border-gray-300 p-2 w-16">ĐVT</th>
                  <th className="border border-gray-300 p-2 w-16 text-right">Số lượng</th>
                  <th className="border border-gray-300 p-2 w-28 text-right">Đơn giá</th>
                  <th className="border border-gray-300 p-2 w-32 text-right">Thành tiền</th>
                  <th className="border border-gray-300 p-2 w-28 text-left">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => {
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.unitPrice) || 0;
                    const amount = Number(item.amount) || qty * price;
                    return (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 p-2 font-mono font-medium text-center">
                          {item.productCode}
                        </td>
                        <td className="border border-gray-300 p-2 font-medium">{item.productName}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.unit}</td>
                        <td className="border border-gray-300 p-2 text-right font-bold">{qty.toLocaleString('vi-VN')}</td>
                        <td className="border border-gray-300 p-2 text-right">{formatVND(price)}</td>
                        <td className="border border-gray-300 p-2 text-right font-bold text-gray-900">
                          {formatVND(amount)}
                        </td>
                        <td className="border border-gray-300 p-2 text-gray-500 text-[11px]">
                          Chuẩn mới 100%
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 p-4 text-center text-gray-400">
                      Chưa có chi tiết sản phẩm
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50/50 font-sans">
                <tr>
                  <td colSpan={6} className="border border-gray-300 p-2 text-right font-semibold">
                    Cộng tiền hàng (chưa bao gồm VAT):
                  </td>
                  <td className="border border-gray-300 p-2 text-right font-bold text-gray-800">
                    {formatVND(Number(order.subtotal))}
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
                <tr>
                  <td colSpan={6} className="border border-gray-300 p-2 text-right font-semibold">
                    Tiền thuế Giá trị gia tăng (VAT {order.vatRate || 8}%):
                  </td>
                  <td className="border border-gray-300 p-2 text-right font-bold text-gray-800">
                    {formatVND(Number(order.vatAmount))}
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
                <tr className="bg-red-50/40 text-[#E53935] font-black text-sm">
                  <td colSpan={6} className="border border-gray-300 p-2.5 text-right uppercase">
                    Tổng cộng tiền thanh toán:
                  </td>
                  <td className="border border-gray-300 p-2.5 text-right font-black">
                    {formatVND(Number(order.totalAmount))}
                  </td>
                  <td className="border border-gray-300 p-2.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Diễn giải số tiền viết bằng chữ (Chuẩn tiếng Việt) */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs font-sans mb-8">
            <span className="font-semibold text-gray-700">Số tiền viết bằng chữ: </span>
            <span className="font-bold italic text-[#E53935]">
              {numberToWords(order.totalAmount)}
            </span>
          </div>

          {/* Chữ ký 4 bên chuẩn theo Section XI.6 */}
          <div className="grid grid-cols-4 gap-4 text-center font-sans text-xs pt-4 border-t border-gray-200">
            <div className="space-y-1">
              <p className="font-bold uppercase text-gray-800">Người lập phiếu</p>
              <p className="text-[10px] text-gray-400 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-20 flex items-end justify-center pb-2 font-medium text-gray-700">
                {order.manager?.fullName || ''}
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold uppercase text-gray-800">Người nhận hàng</p>
              <p className="text-[10px] text-gray-400 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-20 flex items-end justify-center pb-2 font-medium text-gray-700">
                {order.contactPerson || ''}
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold uppercase text-gray-800">Thủ kho</p>
              <p className="text-[10px] text-gray-400 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-20 flex items-end justify-center pb-2 text-gray-400 italic">
                (Đã kiểm đủ SL)
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold uppercase text-gray-800">Giám đốc / Đại diện</p>
              <p className="text-[10px] text-gray-400 italic">(Ký, đóng dấu)</p>
              <div className="h-20 flex items-end justify-center pb-2 text-gray-400 italic">
                (Đã duyệt)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
