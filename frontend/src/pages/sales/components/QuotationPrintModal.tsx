import React from 'react';
import { Printer, X, FileSpreadsheet } from 'lucide-react';
import { Quotation } from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';

interface QuotationPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
}

export const QuotationPrintModal: React.FC<QuotationPrintModalProps> = ({
  isOpen,
  onClose,
  quotation
}) => {
  if (!isOpen || !quotation) return null;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const quotationDate = new Date(quotation.date);
  const validUntilDate = quotation.validUntil
    ? new Date(quotation.validUntil)
    : new Date(quotationDate.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 ngày sau

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

    const rows = (quotation.items || []).map((it, idx) => [
      idx + 1,
      `"${it.productCode}"`,
      `"${(it.productName || '').replace(/"/g, '""')}"`,
      `"${it.unit}"`,
      it.quantity,
      it.unitPrice,
      `"${it.vatRate !== undefined ? it.vatRate : quotation.vatRate}%"`,
      it.total || it.quantity * it.unitPrice
    ]);

    const lines = [
      '\uFEFFBẢNG BÁO GIÁ VĂN PHÒNG PHẨM & THIẾT BỊ VĂN PHÒNG - CÔNG TY TNHH TM&DV NAM KHÁNH',
      `Số báo giá: ${quotation.code}`,
      `Ngày báo giá: ${quotationDate.toLocaleDateString('vi-VN')}`,
      `Hiệu lực đến: ${validUntilDate.toLocaleDateString('vi-VN')}`,
      `Khách hàng: ${(quotation.customer?.name || '').replace(/"/g, '""')}`,
      `Mã số thuế: ${quotation.customer?.taxCode || ''}`,
      `Người liên hệ: ${(quotation.customer?.contactPerson || '').replace(/"/g, '""')}`,
      `Số điện thoại: ${quotation.customer?.phone || ''}`,
      `Địa chỉ giao hàng: ${(quotation.customer?.deliveryAddress || quotation.customer?.address || '').replace(/"/g, '""')}`,
      `Người phụ trách: ${(quotation.manager?.fullName || '').replace(/"/g, '""')}`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      `Cộng tiền hàng: ${Number(quotation.subtotal).toLocaleString('vi-VN')} VNĐ`,
      `Thuế GTGT (${quotation.vatRate}%): ${Number(quotation.vatAmount).toLocaleString('vi-VN')} VNĐ`,
      `Tổng cộng thanh toán: ${Number(quotation.totalAmount).toLocaleString('vi-VN')} VNĐ`,
      `Số tiền viết bằng chữ: ${numberToWords(Number(quotation.totalAmount))}`,
      `Ghi chú: ${(quotation.notes || '').replace(/"/g, '""')}`
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Gia_${quotation.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 max-h-[95vh] flex flex-col">
        {/* Header điều khiển (Không in) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 no-print flex-shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#E53935]" />
            <h3 className="font-bold text-gray-900 text-base">
              Bản In Báo Giá A4 - {quotation.code}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="btn-secondary !py-1.5 !px-3.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm border-green-300 text-green-700 hover:bg-green-50"
              title="Xuất bảng báo giá ra file Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary !py-1.5 !px-4 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>In Bản Chào Giá (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= KHUNG IN A4 CHUẨN KẾ TOÁN ================= */}
        <div className="p-8 md:p-12 overflow-y-auto flex-1 font-serif text-gray-900 bg-white" id="printable-quotation">
          {/* Header công ty */}
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
                  Nhà cung ứng Văn phòng phẩm & Thiết bị văn phòng chuyên nghiệp
                </p>
                <p className="text-[11px] text-gray-500 font-sans">
                  Địa chỉ: Số 32, Ngõ 111 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, TP. Hà Nội
                </p>
                <p className="text-[11px] text-gray-500 font-sans">
                  Hotline: (024) 3768 9999 | Email: kinhdoanh@namkhanh.vn | MST: 0109876543
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right font-sans flex-shrink-0">
              <div className="text-xs font-bold text-[#E53935]">MÃ BÁO GIÁ: {quotation.code}</div>
              <div className="text-xs text-gray-600 mt-1">
                Ngày lập: {quotationDate.toLocaleDateString('vi-VN')}
              </div>
              <div className="text-xs text-gray-500">
                Hiệu lực đến: {validUntilDate.toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Tiêu đề Báo giá */}
          <div className="text-center my-6">
            <h2 className="text-xl font-bold uppercase tracking-wider text-gray-900 font-sans">
              BẢNG BÁO GIÁ VĂN PHÒNG PHẨM & THIẾT BỊ VĂN PHÒNG
            </h2>
            <p className="text-xs italic text-gray-500 mt-1">
              (Áp dụng cho hợp đồng cung ứng định kỳ & đơn hàng bán buôn)
            </p>
          </div>

          {/* Thông tin Đối tác / Khách hàng */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 text-xs font-sans space-y-1.5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <strong>Kính gửi (Đơn vị):</strong> {quotation.customer?.name || 'Quý khách hàng'}
              </div>
              <div>
                <strong>Mã số thuế:</strong> {quotation.customer?.taxCode || 'Theo thông báo đơn hàng'}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <strong>Người liên hệ:</strong> {quotation.customer?.contactPerson || 'Bộ phận Mua sắm'}
              </div>
              <div>
                <strong>Số điện thoại:</strong> {quotation.customer?.phone || 'Chưa cập nhật'}
              </div>
            </div>
            <div>
              <strong>Địa chỉ giao hàng dự kiến:</strong>{' '}
              {quotation.customer?.deliveryAddress || quotation.customer?.address || 'Tại trụ sở Quý đơn vị'}
            </div>
            <div>
              <strong>Chuyên viên phụ trách:</strong>{' '}
              {quotation.manager?.fullName || 'Phòng Kinh Doanh Nam Khánh'} ({quotation.manager?.phone || '024.3768.9999'})
            </div>
          </div>

          {/* Bảng Chi tiết Báo giá 8 Cột */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-gray-300 text-xs font-sans">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold uppercase text-center">
                  <th className="border border-gray-300 py-2.5 px-2 w-10">STT</th>
                  <th className="border border-gray-300 py-2.5 px-2 w-24">Mã SKU</th>
                  <th className="border border-gray-300 py-2.5 px-3 text-left">Tên Hàng Hóa & Quy Cách</th>
                  <th className="border border-gray-300 py-2.5 px-2 w-16">ĐVT</th>
                  <th className="border border-gray-300 py-2.5 px-2 w-16">Số Lượng</th>
                  <th className="border border-gray-300 py-2.5 px-3 text-right w-28">Đơn Giá (VNĐ)</th>
                  <th className="border border-gray-300 py-2.5 px-2 w-16">Thuế (%)</th>
                  <th className="border border-gray-300 py-2.5 px-3 text-right w-32">Thành Tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="border border-gray-300 py-2 px-2 text-center">{idx + 1}</td>
                    <td className="border border-gray-300 py-2 px-2 font-mono font-semibold text-gray-700">
                      {item.productCode}
                    </td>
                    <td className="border border-gray-300 py-2 px-3 font-medium text-gray-900">
                      {item.productName}
                    </td>
                    <td className="border border-gray-300 py-2 px-2 text-center">{item.unit}</td>
                    <td className="border border-gray-300 py-2 px-2 text-center font-bold">{item.quantity}</td>
                    <td className="border border-gray-300 py-2 px-3 text-right">{formatVND(item.unitPrice)}</td>
                    <td className="border border-gray-300 py-2 px-2 text-center">{item.vatRate}%</td>
                    <td className="border border-gray-300 py-2 px-3 text-right font-semibold">
                      {formatVND(item.amount)}
                    </td>
                  </tr>
                ))}

                {/* Dòng tổng cộng tiền hàng */}
                <tr className="bg-gray-50/60 font-semibold">
                  <td colSpan={7} className="border border-gray-300 py-2 px-3 text-right uppercase">
                    Cộng tiền hàng (Chưa thuế):
                  </td>
                  <td className="border border-gray-300 py-2 px-3 text-right">
                    {formatVND(quotation.subtotal)}
                  </td>
                </tr>

                {/* Dòng thuế VAT */}
                <tr className="bg-gray-50/60 font-semibold">
                  <td colSpan={7} className="border border-gray-300 py-2 px-3 text-right uppercase">
                    Tiền thuế GTGT ({quotation.vatRate}%):
                  </td>
                  <td className="border border-gray-300 py-2 px-3 text-right">
                    {formatVND(quotation.vatAmount)}
                  </td>
                </tr>

                {/* Dòng Tổng cộng thanh toán */}
                <tr className="bg-red-50/80 font-bold text-[#E53935] text-sm">
                  <td colSpan={7} className="border border-gray-300 py-2.5 px-3 text-right uppercase tracking-wider">
                    TỔNG CỘNG THANH TOÁN (ĐÃ BAO GỒM VAT):
                  </td>
                  <td className="border border-gray-300 py-2.5 px-3 text-right font-black">
                    {formatVND(quotation.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Số tiền viết bằng chữ */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs font-sans mb-6">
            <strong>Số tiền viết bằng chữ:</strong>{' '}
            <span className="italic font-bold text-gray-800">
              {numberToWords(quotation.totalAmount)}
            </span>
          </div>

          {/* Điều khoản thương mại */}
          <div className="text-xs font-sans text-gray-700 space-y-1 mb-8 border-l-2 border-[#E53935] pl-3 py-1">
            <p><strong>1. Thời hạn hiệu lực:</strong> Báo giá có giá trị trong vòng 15 ngày kể từ ngày lập.</p>
            <p><strong>2. Giao hàng:</strong> Miễn phí vận chuyển tận nơi trong phạm vi nội thành Hà Nội.</p>
            <p><strong>3. Thanh toán:</strong> Chuyển khoản hoặc tiền mặt theo thỏa thuận hợp đồng.</p>
            <p>
              <strong>4. Tài khoản thụ hưởng:</strong> Công ty TNHH Thương mại & Dịch vụ Nam Khánh
              <br />• Techcombank Chi nhánh Thăng Long - STK: <strong>19036888999018</strong>
              <br />• Vietcombank Chi nhánh Cầu Giấy - STK: <strong>0011004455667</strong>
            </p>
          </div>

          {/* Chữ ký 2 bên */}
          <div className="grid grid-cols-2 text-center font-sans text-xs pt-4">
            <div>
              <div className="font-bold uppercase text-gray-700">ĐẠI DIỆN KHÁCH HÀNG</div>
              <div className="text-gray-400 italic text-[11px] mt-0.5">(Ký, ghi rõ họ tên và đóng dấu)</div>
              <div className="h-24"></div>
              <div className="font-bold text-gray-800">{quotation.customer?.contactPerson || '................................'}</div>
            </div>
            <div>
              <div className="font-bold uppercase text-[#E53935]">ĐẠI DIỆN CÔNG TY TNHH NK NAM KHÁNH</div>
              <div className="text-gray-400 italic text-[11px] mt-0.5">(Ký, ghi rõ họ tên và đóng dấu)</div>
              <div className="h-24"></div>
              <div className="font-bold text-gray-900">
                {quotation.manager?.fullName || 'Nguyễn Nam Khánh'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPrintModal;
