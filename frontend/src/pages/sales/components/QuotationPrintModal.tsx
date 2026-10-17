import React from 'react';
import { Printer, X, FileSpreadsheet, Edit2, Trash2 } from 'lucide-react';
import { Quotation } from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';
import { printA4 } from '../../../utils/printA4';
import { formatVND } from '../../../utils/formatCurrency';
import { exportQuotationToExcel } from '../../../utils/crmExcelExport';
import { NK_LOGO_BASE64 } from '../../../utils/logoBase64';
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

function formatVietnameseDate(dateInput: string | Date | undefined | null): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  const d = isNaN(date.getTime()) ? new Date() : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `Ngày ${day} tháng ${month} năm ${year}`;
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
    printA4('printable-quotation', `Bao_Gia_${quotation.code}`);
  };

  const handleExportExcel = async () => {
    try {
      await exportQuotationToExcel(quotation);
    } catch (err) {
      console.error('Lỗi khi xuất file Excel báo giá:', err);
      alert('Có lỗi xảy ra khi tạo file Excel');
    }
  };

  const customerName = quotation.customer?.name || (quotation.customer as any)?.companyName || 'Quý Khách hàng';
  const contactPerson = (quotation as any).contactPerson || quotation.customer?.contactPerson || '';
  const phone = (quotation as any).phone || quotation.customer?.phone || '';
  const address = (quotation as any).deliveryAddress || quotation.customer?.deliveryAddress || quotation.customer?.address || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-1 sm:p-1.5 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden my-auto h-[calc(100%-12px)] max-h-[calc(100%-12px)] flex flex-col a4-modal print-modal-container">
        {/* Header điều khiển thu nhỏ, gọn gàng 1 dòng (Không in) */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50 no-print flex-shrink-0 flex-nowrap gap-2">
          {/* Bên trái: Thông tin rút gọn */}
          <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
            <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm">
                Báo Giá: {quotation.code}
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Excel
              </span>
            </div>
          </div>

          {/* Bên phải: Nút công cụ bé lại và xếp gọn trên 1 dòng */}
          <div className="flex items-center gap-1.5 flex-nowrap flex-shrink-0">
            {canEdit && onEdit && quotation.status !== 'ORDERED' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(quotation);
                }}
                className="py-1 px-2.5 text-[11px] font-medium flex items-center gap-1 cursor-pointer rounded border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 transition-colors whitespace-nowrap"
                title="Chỉnh sửa thông tin báo giá này"
              >
                <Edit2 className="w-3 h-3 text-blue-600" />
                <span>Sửa</span>
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(quotation.id, quotation.code);
                }}
                className="py-1 px-2.5 text-[11px] font-medium flex items-center gap-1 cursor-pointer rounded border border-red-300 text-red-700 bg-white hover:bg-red-50 transition-colors whitespace-nowrap"
                title="Xóa vĩnh viễn báo giá này"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
                <span>Xóa</span>
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="py-1 px-2.5 text-[11px] font-medium flex items-center gap-1 cursor-pointer rounded border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors whitespace-nowrap"
              title="Xuất bảng báo giá ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-1 px-3 text-[11px] font-semibold flex items-center gap-1 cursor-pointer rounded bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors whitespace-nowrap"
              title="In ngay mẫu báo giá chuẩn Excel ra máy in / PDF"
            >
              <Printer className="w-3 h-3" />
              <span>In Ngay</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all cursor-pointer ml-1"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thanh Sheet Tab mô phỏng Excel (Không in) */}
        <div className="bg-slate-100 border-b border-gray-300 px-3 py-1 flex items-center gap-2 no-print flex-shrink-0 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white border-t-2 border-emerald-600 font-semibold text-emerald-800 rounded-t shadow-xs text-[11.5px]">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sheet 1: Báo giá </span>
          </div>
          <span className="text-gray-500 text-[11px] italic ml-2">
            (Form và font chữ Times New Roman y hệt file Excel)
          </span>
        </div>

        {/* ================= KHUNG HIỂN THỊ DẠNG FORM EXCEL CHUẨN ================= */}
        <div className="a4-preview bg-slate-200">
          <div
            className="excel-sheet"
            id="printable-quotation"
            style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
          >
            {/* Header thông tin công ty Nam Khánh chuẩn y hệt file Excel */}
            <div className="flex items-center gap-3 pb-1">
              <div className="w-[110px] flex-shrink-0 flex items-center justify-center">
                <img
                  src={`data:image/png;base64,${NK_LOGO_BASE64}`}
                  alt="Nam Khánh Logo"
                  className="w-[105px] h-[78px] object-contain"
                />
              </div>
              <div className="flex-1 pr-2">
                <h1 className="text-[17px] font-bold text-black uppercase leading-tight tracking-normal text-center mb-1">
                  CÔNG TY TNHH NK NAM KHÁNH
                </h1>
                <p className="text-[13px] text-black leading-snug">
                  Địa chỉ ( Address): Khu X1, Thôn Nguyên Khê - Xã Phúc Thịnh - TP.Hà Nội
                </p>
                <p className="text-[13px] text-black leading-snug">
                  Mã số thuế : 0108910572
                </p>
                <p className="text-[13px] text-black leading-snug">
                  Số điện thoại : 0766.088.886 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Gmail : phankhanhfj@gmail.com
                </p>
              </div>
            </div>

            {/* Tiêu đề BẢNG BÁO GIÁ */}
            <div className="text-center mt-2.5 mb-1">
              <h2 className="text-[19px] font-bold text-black uppercase tracking-wide">
                BẢNG BÁO GIÁ
              </h2>
            </div>

            {/* Dòng Ngày tháng năm */}
            <div className="text-center text-[13px] text-black border-b-[1.5px] border-black pb-1 mb-2.5">
              {formatVietnameseDate(quotation.date)}
            </div>

            {/* Khối Thông tin khách hàng & Lời mở đầu chuẩn các dòng Excel */}
            <div className="text-[13px] text-black space-y-1 mb-2.5">
              <div className="flex items-baseline">
                <span className="w-[115px] flex-shrink-0">Kính gửi</span>
                <span className="font-bold">: {customerName}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-[115px] flex-shrink-0">Người đại diện</span>
                <span>: {contactPerson || '................................'}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-[115px] flex-shrink-0">Số điện thoại</span>
                <span>: {phone || '................................'}</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-[115px] flex-shrink-0">Địa chỉ</span>
                <span>: {address || '................................'}</span>
              </div>
              <div className="flex items-baseline justify-between pt-0.5">
                <span>Công ty TNHH NK Nam Khánh xin gửi tới quý Công ty bảng báo giá mặt hàng sau</span>
                <span className="font-normal italic">Loại tiền: Vnđ</span>
              </div>
            </div>

            {/* BẢNG SẢN PHẨM DẠNG EXCEL GRID TABLE */}
            <table className="excel-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>Stt</th>
                  <th style={{ width: '135px', textAlign: 'center' }}>Mã hàng</th>
                  <th style={{ textAlign: 'center' }}>Tên hàng hóa, dịch vụ</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Đơn vị tính</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Số lượng</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Đơn giá</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="excel-c">{idx + 1}</td>
                    <td className="excel-c">{item.productCode}</td>
                    <td className="excel-l">{item.productName}</td>
                    <td className="excel-c">{item.unit || 'Cái'}</td>
                    <td className="excel-c">{item.quantity}</td>
                    <td className="excel-num">{formatVND(item.unitPrice)}</td>
                    <td className="excel-num">
                      {formatVND(item.amount || Number(item.quantity) * Number(item.unitPrice))}
                    </td>
                  </tr>
                ))}

                {/* Dòng Tổng cộng tiền hàng */}
                <tr className="excel-keep font-bold">
                  <td colSpan={6} className="excel-l font-bold" style={{ paddingLeft: '8px' }}>
                    Tổng cộng tiền hàng
                  </td>
                  <td className="excel-num font-bold">
                    {formatVND(quotation.subtotal)}
                  </td>
                </tr>

                {/* Dòng Thuế VAT */}
                <tr className="excel-keep font-bold">
                  <td colSpan={2} className="excel-l font-bold" style={{ paddingLeft: '8px' }}>
                    Thuế VAT
                  </td>
                  <td colSpan={4} className="excel-l font-bold">
                    {quotation.vatRate}%
                  </td>
                  <td className="excel-num font-bold">
                    {formatVND(quotation.vatAmount)}
                  </td>
                </tr>

                {/* Dòng Tổng tiền thanh toán */}
                <tr className="excel-keep font-bold">
                  <td colSpan={6} className="excel-l font-bold" style={{ paddingLeft: '8px' }}>
                    Tổng tiền thanh toán
                  </td>
                  <td className="excel-num font-bold">
                    {formatVND(quotation.totalAmount)}
                  </td>
                </tr>

                {/* Dòng Bằng chữ */}
                <tr className="excel-keep font-bold">
                  <td colSpan={2} className="excel-l font-bold" style={{ paddingLeft: '8px' }}>
                    Bằng chữ :
                  </td>
                  <td colSpan={5} className="excel-l font-bold italic">
                    {numberToWords(quotation.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Ghi chú chuẩn biểu mẫu Excel */}
            <div className="excel-keep text-[12px] text-black mt-2.5 space-y-0.5">
              <div className="font-bold">Ghi chú:</div>
              <div>* Hàng hoá bảo hành theo tiêu chuẩn chính hãng</div>
              <div>* Đơn giá chưa bao gồm VAT</div>
              <div>* Báo giá có hiệu lực trong vòng 15 ngày kể từ ngày lập</div>
              {quotation.notes && quotation.notes.trim() && (
                <div>* {quotation.notes.trim()}</div>
              )}
            </div>

            {/* Chữ ký 2 bên chuẩn biểu mẫu Excel - BỎ in sẵn họ tên theo yêu cầu */}
            <div className="excel-keep mt-6 grid grid-cols-2 text-center text-[13px] text-black">
              <div>
                <div className="font-bold uppercase">Xác nhận bên bán hàng</div>
                <div className="text-[11px] italic text-gray-700">(Ký, ghi rõ họ tên)</div>
                <div className="h-20"></div>
              </div>
              <div>
                <div className="font-bold uppercase">Xác nhận bên mua hàng</div>
                <div className="text-[11px] italic text-gray-700">(Ký, ghi rõ họ tên)</div>
                <div className="h-20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPrintModal;
