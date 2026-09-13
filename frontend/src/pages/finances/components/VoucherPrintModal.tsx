import React from 'react';
import { X, Printer, FileSpreadsheet } from 'lucide-react';
import { PaymentVoucher, ReceiptVoucher } from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';

interface VoucherPrintModalProps {
  voucher: PaymentVoucher | ReceiptVoucher | null;
  type: 'PAYMENT' | 'RECEIPT';
  onClose: () => void;
}

export const VoucherPrintModal: React.FC<VoucherPrintModalProps> = ({
  voucher,
  type,
  onClose
}) => {
  if (!voucher) return null;

  const isReceipt = type === 'RECEIPT';
  const title = isReceipt ? 'PHIẾU THU' : 'PHIẾU CHI';
  const personLabel = isReceipt ? 'Họ và tên người nộp tiền:' : 'Họ và tên người nhận tiền:';
  const personName = isReceipt ? (voucher as ReceiptVoucher).payer : (voucher as PaymentVoucher).recipient;
  const reasonLabel = isReceipt ? 'Lý do nộp:' : 'Lý do chi:';
  const formattedDate = new Date(voucher.voucherDate).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const [day, month, year] = formattedDate.split('/');

  const handleExportExcel = () => {
    const lines = [
      '\uFEFF' + (isReceipt ? 'PHIẾU THU TIỀN' : 'PHIẾU CHI TIỀN') + ' - CÔNG TY TNHH NK NAM KHÁNH',
      `Số chứng từ: ${voucher.code}`,
      `Ngày lập: ${formattedDate}`,
      `Họ và tên ${isReceipt ? 'người nộp tiền' : 'người nhận tiền'}: ${personName}`,
      `Số điện thoại: ${voucher.phone || 'N/A'}`,
      `Địa chỉ: ${voucher.address || 'N/A'}`,
      `Lý do: ${voucher.reason}`,
      `Số tiền: ${Number(voucher.amount).toLocaleString('vi-VN')} VNĐ`,
      `Số tiền viết bằng chữ: ${numberToWords(Number(voucher.amount))}`,
      `Phương thức thanh toán: ${voucher.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}`,
      `Số hóa đơn/chứng từ gốc kèm theo: ${voucher.invoiceNumber || 'Không có'}`,
      `Trạng thái chứng từ: ${voucher.status === 'PAID' ? (isReceipt ? 'Đã thu' : 'Đã chi') : voucher.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}`
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${voucher.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Thanh công cụ điều khiển (Không in) */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#E53935]" />
            <span className="font-bold text-gray-800 text-sm">
              Xem trước bản in: {voucher.code} - {title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 border-green-300 text-green-700 hover:bg-green-50 shadow-sm"
              title="Xuất phiếu sang file Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="btn-primary text-xs px-4 py-2"
            >
              <Printer className="w-4 h-4" />
              In phiếu (A4 / A5)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Khung nội dung in ấn chuẩn A4/A5 */}
        <div className="p-10 overflow-y-auto print:p-0 print:m-0" id="printable-voucher">
          {/* Header Thông tin Doanh nghiệp */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-red-600">
            <div className="space-y-1">
              <div className="text-sm font-black text-[#E53935] uppercase tracking-wide">
                CÔNG TY TNHH NK NAM KHÁNH
              </div>
              <div className="text-xs text-gray-600">
                Nhà phân phối sỉ & lẻ Văn phòng phẩm và Thiết bị văn phòng chuyên nghiệp
              </div>
              <div className="text-xs text-gray-500">
                Địa chỉ: Số 32, Ngõ 111 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội
              </div>
              <div className="text-xs text-gray-500">
                Điện thoại: (024) 3768 9999 | MST: 0109876543 | Email: kinhdoanh@namkhanh.vn
              </div>
            </div>
            <div className="text-right text-xs text-gray-500 space-y-0.5">
              <div className="font-bold text-gray-700">Mẫu số 01-TT / 02-TT</div>
              <div>(Ban hành theo TT số 200/2014/TT-BTC)</div>
              <div className="font-mono text-gray-900 font-bold mt-1 text-sm text-[#E53935]">
                Số: {voucher.code}
              </div>
              <div>Quyển số: 01</div>
            </div>
          </div>

          {/* Tiêu đề Phiếu */}
          <div className="text-center my-6">
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wider">
              {title}
            </h1>
            <div className="text-xs text-gray-500 italic mt-1">
              Ngày {day} tháng {month} năm {year}
            </div>
          </div>

          {/* Nội dung chi tiết */}
          <div className="space-y-3.5 text-sm text-gray-800">
            <div className="flex">
              <span className="w-52 text-gray-600 shrink-0">{personLabel}</span>
              <span className="font-bold text-gray-900 uppercase">{personName}</span>
            </div>

            <div className="flex">
              <span className="w-52 text-gray-600 shrink-0">Địa chỉ:</span>
              <span className="text-gray-800">{voucher.address || 'Hà Nội'}</span>
            </div>

            <div className="flex">
              <span className="w-52 text-gray-600 shrink-0">{reasonLabel}</span>
              <span className="font-medium text-gray-800">{voucher.reason}</span>
            </div>

            <div className="flex items-baseline">
              <span className="w-52 text-gray-600 shrink-0">Số tiền:</span>
              <span className="text-lg font-black text-[#E53935]">
                {Number(voucher.amount).toLocaleString('vi-VN')} VNĐ
              </span>
            </div>

            <div className="flex">
              <span className="w-52 text-gray-600 shrink-0">Viết bằng chữ:</span>
              <span className="font-bold italic text-gray-900">
                {numberToWords(voucher.amount)}
              </span>
            </div>

            <div className="flex">
              <span className="w-52 text-gray-600 shrink-0">Kèm theo:</span>
              <span className="text-gray-700">
                {voucher.invoiceNumber
                  ? `Chứng từ / Hóa đơn số ${voucher.invoiceNumber}`
                  : 'Chứng từ gốc hợp lệ'}
              </span>
            </div>

            {voucher.notes && (
              <div className="flex">
                <span className="w-52 text-gray-600 shrink-0">Ghi chú:</span>
                <span className="text-gray-500 text-xs italic">{voucher.notes}</span>
              </div>
            )}

            {isReceipt && (voucher as ReceiptVoucher).allocations && (voucher as ReceiptVoucher).allocations!.length > 0 && (
              <div className="mt-4 pt-3 border-t border-dashed border-gray-300 space-y-2">
                <div className="text-xs font-bold text-gray-700 uppercase">
                  Bảng chi tiết phân bổ gạch nợ đơn hàng:
                </div>
                <div className="border border-gray-300 rounded overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 border-b border-gray-300 text-gray-700">
                      <tr>
                        <th className="p-1.5 font-bold">STT</th>
                        <th className="p-1.5 font-bold">Mã đơn hàng</th>
                        <th className="p-1.5 text-right font-bold">Tổng tiền đơn</th>
                        <th className="p-1.5 text-right font-bold">Số tiền gạch nợ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(voucher as ReceiptVoucher).allocations!.map((alloc, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 text-gray-500">{idx + 1}</td>
                          <td className="p-1.5 font-mono font-bold text-gray-800">
                            {alloc.order?.code || alloc.orderId}
                          </td>
                          <td className="p-1.5 text-right text-gray-600">
                            {alloc.order?.totalAmount
                              ? Number(alloc.order.totalAmount).toLocaleString('vi-VN') + ' VNĐ'
                              : '--'}
                          </td>
                          <td className="p-1.5 text-right font-black text-[#E53935]">
                            {Number(alloc.amount).toLocaleString('vi-VN')} VNĐ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Ngày tháng ký & Khung 4 chữ ký */}
          <div className="mt-10">
            <div className="text-right text-xs italic text-gray-600 mb-4">
              Hà Nội, ngày {day} tháng {month} năm {year}
            </div>
            <div className="grid grid-cols-4 gap-4 text-center text-xs">
              <div className="space-y-1">
                <div className="font-bold text-gray-900 uppercase">Giám đốc</div>
                <div className="text-gray-400 text-[11px]">(Ký, họ tên, đóng dấu)</div>
                <div className="h-20" />
                <div className="font-bold text-gray-700">Nguyễn Nam Khánh</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-gray-900 uppercase">Kế toán trưởng</div>
                <div className="text-gray-400 text-[11px]">(Ký, họ tên)</div>
                <div className="h-20" />
                <div className="font-bold text-gray-700">Phạm Thu Trang</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-gray-900 uppercase">Người lập phiếu</div>
                <div className="text-gray-400 text-[11px]">(Ký, họ tên)</div>
                <div className="h-20" />
                <div className="font-bold text-gray-700">
                  {voucher.createdBy?.fullName || 'Người lập'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-gray-900 uppercase">
                  {isReceipt ? 'Người nộp tiền' : 'Người nhận tiền'}
                </div>
                <div className="text-gray-400 text-[11px]">(Ký, họ tên)</div>
                <div className="h-20" />
                <div className="font-bold text-gray-700">{personName}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400">
            CRM Nam Khánh - Hệ thống Quản trị Khách hàng & Phân phối Văn phòng phẩm toàn diện
          </div>
        </div>
      </div>
    </div>
  );
};
