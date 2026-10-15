import React from 'react';
import { Printer, X, FileSpreadsheet, Edit2, Trash2 } from 'lucide-react';
import { Quotation } from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';
import { NAMKHANH_BANK_INFO, generateVietQRUrl } from '../../../utils/vietqr';
import { printA4 } from '../../../utils/printA4';
import { formatVND, formatNumber } from '../../../utils/formatCurrency';
import { exportQuotationToExcel } from '../../../utils/crmExcelExport';
import '../../../styles/print-a4.css';

interface QuotationPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onEdit?: (quotation: Quotation) => void;
  onDelete?: (id: string, code: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const QuotationPrintModal: React.FC<QuotationPrintModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true
}) => {
  if (!isOpen || !quotation) return null;

  const handlePrint = () => {
    printA4('printable-quotation', `Bao_gia_${quotation.code}`);
  };

  const quotationDate = new Date(quotation.date);
  const validUntilDate = quotation.validUntil
    ? new Date(quotation.validUntil)
    : new Date(quotationDate.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 ngày sau

  const handleExportExcel = async () => {
    try {
      await exportQuotationToExcel(quotation);
    } catch (err) {
      console.error('Lỗi khi xuất file Excel báo giá:', err);
      alert('Có lỗi xảy ra khi tạo file Excel');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-1 sm:p-1.5 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden my-auto h-[calc(100%-12px)] max-h-[calc(100%-12px)] flex flex-col a4-modal print-modal-container">
        {/* Header điều khiển (Không in) */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 no-print flex-shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#E53935]" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              Bản In Báo Giá A4 - {quotation.code}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && onEdit && quotation.status !== 'ORDERED' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(quotation);
                }}
                className="btn-secondary !py-1.5 !px-3.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm border-blue-300 text-blue-700 hover:bg-blue-50"
                title="Chỉnh sửa thông tin báo giá này"
              >
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Chỉnh sửa</span>
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(quotation.id, quotation.code);
                }}
                className="btn-secondary !py-1.5 !px-3.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm border-red-300 text-red-700 hover:bg-red-50"
                title="Xóa vĩnh viễn báo giá này"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Xóa</span>
              </button>
            )}
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
        <div className="a4-preview">
          <div className="a4-sheet" id="printable-quotation">
            {/* Header công ty */}
            <div className="a4-header">
              <div className="a4-brand">
                <img src="/logo.png" alt="Nam Khánh Logo" className="a4-logo" />
                <div>
                  <h1 className="a4-company-name">CÔNG TY TNHH THƯƠNG MẠI &amp; DỊCH VỤ NAM KHÁNH</h1>
                  <p className="a4-company-slogan">
                    Nhà cung ứng Văn phòng phẩm &amp; Thiết bị văn phòng chuyên nghiệp
                  </p>
                  <p className="a4-company-line">
                    Địa chỉ: Số 32, Ngõ 111 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, TP. Hà Nội
                  </p>
                  <p className="a4-company-line">
                    <span className="a4-nowrap">Hotline: (024) 3768 9999</span>
                    <span className="a4-sep">|</span>
                    <span className="a4-nowrap">Email: kinhdoanh@namkhanh.vn</span>
                    <span className="a4-sep">|</span>
                    <span className="a4-nowrap">MST: 0109876543</span>
                  </p>
                </div>
              </div>

              <div className="a4-docmeta">
                <div className="a4-doccode">MÃ BÁO GIÁ: {quotation.code}</div>
                <div>Ngày lập: {quotationDate.toLocaleDateString('vi-VN')}</div>
                <div>Hiệu lực đến: {validUntilDate.toLocaleDateString('vi-VN')}</div>
              </div>
            </div>

            {/* Tiêu đề Báo giá */}
            <div className="a4-title">
              <h2>BẢNG BÁO GIÁ VĂN PHÒNG PHẨM &amp; THIẾT BỊ VĂN PHÒNG</h2>
              <p>(Áp dụng cho hợp đồng cung ứng định kỳ &amp; đơn hàng bán buôn)</p>
            </div>

            {/* Thông tin Đối tác / Khách hàng */}
            <div className="a4-info">
              <div className="a4-field a4-full">
                <b>Kính gửi (Đơn vị):</b>
                <span>{quotation.customer?.name || 'Quý khách hàng'}</span>
              </div>
              <div className="a4-field">
                <b>Mã số thuế:</b>
                <span>{quotation.customer?.taxCode || 'Theo thông báo đơn hàng'}</span>
              </div>
              <div className="a4-field">
                <b>Số điện thoại:</b>
                <span>{quotation.customer?.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="a4-field a4-full">
                <b>Người liên hệ:</b>
                <span>{quotation.customer?.contactPerson || 'Bộ phận Mua sắm'}</span>
              </div>
              <div className="a4-field a4-full">
                <b>Địa chỉ giao hàng dự kiến:</b>
                <span>{quotation.customer?.deliveryAddress || quotation.customer?.address || 'Tại trụ sở Quý đơn vị'}</span>
              </div>
              <div className="a4-field a4-full">
                <b>Chuyên viên phụ trách:</b>
                <span>
                  {quotation.manager?.fullName || 'Phòng Kinh Doanh Nam Khánh'} ({quotation.manager?.phone || '024.3768.9999'})
                </span>
              </div>
            </div>

            {/* Bảng Chi tiết Báo giá 8 Cột */}
            <table className="a4-table">
              <thead>
                <tr>
                  <th className="a4-fit">STT</th>
                  <th className="a4-fit">Mã SKU</th>
                  <th className="a4-l">Tên Hàng Hóa &amp; Quy Cách</th>
                  <th className="a4-fit">ĐVT</th>
                  <th className="a4-fit">Số Lượng</th>
                  <th className="a4-fit">Đơn Giá (VNĐ)</th>
                  <th className="a4-fit">Thuế (%)</th>
                  <th className="a4-fit">Thành Tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="a4-fit a4-c">{idx + 1}</td>
                    <td className="a4-fit a4-code">{item.productCode}</td>
                    <td className="a4-name">{item.productName}</td>
                    <td className="a4-fit a4-c">{item.unit}</td>
                    <td className="a4-fit a4-c" style={{ fontWeight: 700 }}>{item.quantity}</td>
                    <td className="a4-num">{formatVND(item.unitPrice)}</td>
                    <td className="a4-fit a4-c">{item.vatRate}%</td>
                    <td className="a4-num" style={{ fontWeight: 600 }}>{formatVND(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tbody className="a4-keep">
                {/* Dòng tổng cộng tiền hàng */}
                <tr className="a4-sum">
                  <td colSpan={7} className="a4-r" style={{ textTransform: 'uppercase' }}>
                    Cộng tiền hàng (Chưa thuế):
                  </td>
                  <td className="a4-num">{formatVND(quotation.subtotal)}</td>
                </tr>

                {/* Dòng thuế VAT */}
                <tr className="a4-sum">
                  <td colSpan={7} className="a4-r" style={{ textTransform: 'uppercase' }}>
                    Tiền thuế GTGT ({quotation.vatRate}%):
                  </td>
                  <td className="a4-num">{formatVND(quotation.vatAmount)}</td>
                </tr>

                {/* Dòng Tổng cộng thanh toán */}
                <tr className="a4-total">
                  <td colSpan={7} className="a4-r">TỔNG CỘNG THANH TOÁN (ĐÃ BAO GỒM VAT):</td>
                  <td className="a4-num">{formatVND(quotation.totalAmount)}</td>
                </tr>
              </tbody>
            </table>

            {/* Số tiền viết bằng chữ */}
            <div className="a4-words">
              <b>Số tiền viết bằng chữ:</b> <i>{numberToWords(quotation.totalAmount)}</i>
            </div>

            {/* Điều khoản thương mại & Thông tin thanh toán VietQR */}
            <div className="a4-pay">
              <div className="a4-terms">
                <p><b>1. Thời hạn hiệu lực:</b> Báo giá có giá trị trong vòng 15 ngày kể từ ngày lập.</p>
                <p><b>2. Giao hàng:</b> Miễn phí vận chuyển tận nơi trong phạm vi nội thành Hà Nội.</p>
                <p><b>3. Thanh toán:</b> Chuyển khoản hoặc tiền mặt theo thỏa thuận hợp đồng.</p>
                <p>
                  <b>4. Tài khoản thụ hưởng:</b> {NAMKHANH_BANK_INFO.accountName}
                  <br />• {NAMKHANH_BANK_INFO.bankName} ({NAMKHANH_BANK_INFO.bankId}) - STK:{' '}
                  <b className="a4-mono">{NAMKHANH_BANK_INFO.accountNo}</b>
                  <br />• Nội dung CK: <b className="a4-mono a4-red">{quotation.code}</b>
                </p>
              </div>
              <div className="a4-qr">
                <img
                  src={generateVietQRUrl(Number(quotation.totalAmount) || 0, quotation.code)}
                  alt="VietQR Payment"
                  crossOrigin="anonymous"
                />
                <span style={{ fontWeight: 600, color: '#374151' }}>Quét mã tạm ứng / thanh toán</span>
                <span className="a4-mono">VietQR NAPAS 247</span>
              </div>
            </div>

            {/* Chữ ký 2 bên */}
            <div className="a4-signs a4-signs-2">
              <div>
                <div className="a4-sign-title">ĐẠI DIỆN KHÁCH HÀNG</div>
                <div className="a4-sign-hint">(Ký, ghi rõ họ tên và đóng dấu)</div>
                <div className="a4-sign-space" style={{ height: 86 }}></div>
                <div className="a4-sign-name" style={{ fontWeight: 700 }}>
                  {quotation.customer?.contactPerson || '................................'}
                </div>
              </div>
              <div>
                <div className="a4-sign-title a4-red">ĐẠI DIỆN CÔNG TY TNHH NK NAM KHÁNH</div>
                <div className="a4-sign-hint">(Ký, ghi rõ họ tên và đóng dấu)</div>
                <div className="a4-sign-space" style={{ height: 86 }}></div>
                <div className="a4-sign-name" style={{ fontWeight: 700, color: '#111827' }}>
                  {quotation.manager?.fullName || 'Nguyễn Nam Khánh'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPrintModal;
