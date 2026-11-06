import React from 'react';
import { X, Printer, FileSpreadsheet } from 'lucide-react';
import { InboundReceipt } from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';

interface InboundPrintModalProps {
  receipt: InboundReceipt | null;
  onClose: () => void;
}

export const InboundPrintModal: React.FC<InboundPrintModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const typeLabels: Record<string, string> = {
    PURCHASE: 'Nhập mua hàng từ NCC',
    FINISHED_GOODS: 'Nhập thành phẩm sản xuất/gia công',
    RETURN: 'Nhập hàng khách hoàn trả',
    ADJUSTMENT: 'Nhập điều chỉnh kiểm kê'
  };

  const receiptDateObj = new Date(receipt.receiptDate);
  const day = receiptDateObj.getDate().toString().padStart(2, '0');
  const month = (receiptDateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = receiptDateObj.getFullYear();

  const handleExportCSV = () => {
    const lines = [
      '\uFEFFPHIẾU NHẬP KHO - CÔNG TY TNHH NK NAM KHÁNH',
      `Số phiếu: ${receipt.code}`,
      `Ngày lập: ${day}/${month}/${year}`,
      `Loại nhập kho: ${typeLabels[receipt.type] || receipt.type}`,
      `Kho nhập: ${receipt.warehouse?.name || 'Tổng kho'}`,
      `Nhà cung cấp / Nguồn hàng: ${receipt.supplier?.name || receipt.sourceName || 'N/A'}`,
      `Số chứng từ gốc/Hóa đơn: ${receipt.documentNumber || 'Không có'}`,
      '',
      'STT,Mã hàng,Tên hàng hóa quy cách,ĐVT,Lô hàng,HSD,Vị trí,SL Chứng từ,SL Thực nhận,Đơn giá (VNĐ),Thành tiền (VNĐ)'
    ];

    receipt.items.forEach((item, index) => {
      const expDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('vi-VN') : '';
      const location = [item.locationArea, item.locationRack, item.locationShelf, item.locationBin]
        .filter(Boolean)
        .join(' - ');
      lines.push(
        `${index + 1},"${item.productCode}","${item.productName}","${item.unit}","${item.batchNumber || ''}","${expDate}","${location}",${item.expectedQuantity},${item.acceptedQuantity || item.actualQuantity},${item.unitPrice},${item.amount}`
      );
    });

    lines.push('');
    lines.push(`Tiền hàng chưa VAT: ${Number(receipt.subtotal).toLocaleString('vi-VN')} VNĐ`);
    lines.push(`Thuế suất VAT: ${receipt.vatRate}% (${Number(receipt.vatAmount).toLocaleString('vi-VN')} VNĐ)`);
    lines.push(`Tổng cộng tiền nhập kho: ${Number(receipt.totalAmount).toLocaleString('vi-VN')} VNĐ`);
    lines.push(`Bằng chữ: ${numberToWords(Number(receipt.totalAmount))}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PhieuNhapKho_${receipt.code}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto">
      <div
        className="relative w-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          width: '96vw',
          maxWidth: '1400px',
          height: '94vh',
          maxHeight: '94vh',
          padding: 0
        }}
      >
        {/* Thanh công cụ (Không in) */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 no-print flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-[#E53935]" />
            <span className="font-bold text-gray-800 text-base sm:text-lg">
              Xem trước bản in: {receipt.code} - Phiếu nhập kho
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-sm font-medium border border-green-300 text-green-700 bg-white hover:bg-green-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              title="Xuất phiếu sang file CSV/Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Xuất CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#E53935] hover:bg-[#D32F2F] rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>In phiếu (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Khung nội dung in ấn */}
        <div className="flex-1 p-8 sm:p-12 overflow-y-auto text-gray-800 bg-white" id="printable-voucher">
          {/* Header Thông tin Doanh nghiệp & Mẫu biểu */}
          <div className="flex justify-between items-start pb-5 border-b border-gray-300">
            <div className="space-y-1.5">
              <div className="text-lg sm:text-xl font-black text-[#E53935] uppercase tracking-wide">
                CÔNG TY TNHH NK NAM KHÁNH
              </div>
              <div className="text-sm text-gray-600">
                Địa chỉ: Số 5, Ngõ 102/34 Đường Phùng Khoang, P. Trung Văn, Q. Nam Từ Liêm, Hà Nội
              </div>
              <div className="text-sm text-gray-600">
                Lĩnh vực: Chuyên phân phối Văn phòng phẩm & Thiết bị văn phòng
              </div>
            </div>
            <div className="text-right text-sm text-gray-500 space-y-0.5">
              <div className="font-bold text-gray-700">Mẫu số: 01 - VT</div>
              <div>(Ban hành theo TT số 200/2014/TT-BTC)</div>
              <div className="mt-1 font-semibold text-gray-900 text-base">Số: {receipt.code}</div>
            </div>
          </div>

          {/* Tiêu đề chính */}
          <div className="text-center my-7 space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-gray-900 uppercase">
              PHIẾU NHẬP KHO
            </h1>
            <p className="text-sm text-gray-600 italic">
              Ngày {day} tháng {month} năm {year}
            </p>
          </div>

          {/* Thông tin nghiệp vụ */}
          <div className="space-y-2.5 text-sm sm:text-base text-gray-700 mb-6">
            <div className="flex flex-wrap gap-x-8 gap-y-1.5">
              <span className="min-w-[200px]">
                <strong className="text-gray-900">Loại nhập kho:</strong> {typeLabels[receipt.type] || receipt.type}
              </span>
              <span>
                <strong className="text-gray-900">Kho nhận hàng:</strong> {receipt.warehouse?.name} ({receipt.warehouse?.code})
              </span>
            </div>
            <div>
              <strong className="text-gray-900">Nhà cung cấp / Nguồn hàng:</strong>{' '}
              {receipt.supplier ? `${receipt.supplier.name} (${receipt.supplier.code})` : receipt.sourceName || 'Nhập nội bộ/Khác'}
            </div>
            {receipt.documentNumber && (
              <div className="flex flex-wrap gap-6">
                <span>
                  <strong className="text-gray-900">Theo hóa đơn / Chứng từ số:</strong> {receipt.documentNumber}
                </span>
                {receipt.documentDate && (
                  <span>
                    <strong className="text-gray-900">Ngày chứng từ:</strong>{' '}
                    {new Date(receipt.documentDate).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            )}
            {receipt.notes && (
              <div>
                <strong className="text-gray-900">Diễn giải / Ghi chú:</strong> {receipt.notes}
              </div>
            )}
          </div>

          {/* Bảng chi tiết hàng hóa */}
          <table className="w-full text-left border-collapse border border-gray-300 text-sm mb-5">
            <thead>
              <tr className="bg-gray-100 text-gray-800 font-bold text-center">
                <th className="border border-gray-300 px-3 py-2.5 w-12">STT</th>
                <th className="border border-gray-300 px-4 py-2.5">Tên, nhãn hiệu, quy cách hàng hóa</th>
                <th className="border border-gray-300 px-3 py-2.5 w-28">Mã SKU</th>
                <th className="border border-gray-300 px-3 py-2.5 w-20">ĐVT</th>
                <th className="border border-gray-300 px-3 py-2.5 w-32">Lô hàng / HSD</th>
                <th className="border border-gray-300 px-3 py-2.5 w-32">Vị trí kho</th>
                <th className="border border-gray-300 px-3 py-2.5 w-24">Chứng từ</th>
                <th className="border border-gray-300 px-3 py-2.5 w-24">Thực nhập</th>
                <th className="border border-gray-300 px-3 py-2.5 w-32 text-right">Đơn giá</th>
                <th className="border border-gray-300 px-3 py-2.5 w-36 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, idx) => {
                const expDateStr = item.expiryDate
                  ? new Date(item.expiryDate).toLocaleDateString('vi-VN')
                  : '';
                const locStr = [item.locationArea, item.locationRack, item.locationBin]
                  .filter(Boolean)
                  .join('-');

                return (
                  <tr key={item.id || idx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2.5 text-center">{idx + 1}</td>
                    <td className="border border-gray-300 px-4 py-2.5 font-medium text-gray-900">
                      {item.productName}
                      {item.qualityStatus === 'FAILED' && (
                        <span className="ml-1 text-xs text-red-600 font-bold">(Lỗi)</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2.5 text-center font-mono">{item.productCode}</td>
                    <td className="border border-gray-300 px-3 py-2.5 text-center">{item.unit}</td>
                    <td className="border border-gray-300 px-3 py-2.5 text-center text-xs">
                      {item.batchNumber ? (
                        <>
                          <div className="font-semibold">{item.batchNumber}</div>
                          {expDateStr && <div className="text-gray-500">HSD: {expDateStr}</div>}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2.5 text-center text-xs">
                      {locStr || <span className="text-gray-400">Kho chính</span>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2.5 text-right">{item.expectedQuantity}</td>
                    <td className="border border-gray-300 px-3 py-2.5 text-right font-bold text-gray-900">
                      {item.acceptedQuantity || item.actualQuantity}
                    </td>
                    <td className="border border-gray-300 px-3 py-2.5 text-right">
                      {Number(item.unitPrice).toLocaleString('vi-VN')}
                    </td>
                    <td className="border border-gray-300 px-3 py-2.5 text-right font-semibold">
                      {Number(item.amount).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                );
              })}

              {/* Dòng cộng tiền */}
              <tr className="font-bold bg-gray-50">
                <td colSpan={7} className="border border-gray-300 px-4 py-2.5 text-right">
                  Cộng tiền hàng (chưa VAT):
                </td>
                <td className="border border-gray-300 px-3 py-2.5 text-right">
                  {receipt.items.reduce((s, it) => s + (it.acceptedQuantity || it.actualQuantity), 0)}
                </td>
                <td className="border border-gray-300 px-3 py-2.5"></td>
                <td className="border border-gray-300 px-3 py-2.5 text-right text-gray-900">
                  {Number(receipt.subtotal).toLocaleString('vi-VN')}
                </td>
              </tr>

              {receipt.vatRate > 0 && (
                <tr className="font-bold bg-gray-50">
                  <td colSpan={9} className="border border-gray-300 px-4 py-2.5 text-right">
                    Thuế giá trị gia tăng (VAT {receipt.vatRate}%):
                  </td>
                  <td className="border border-gray-300 px-3 py-2.5 text-right text-gray-900">
                    {Number(receipt.vatAmount).toLocaleString('vi-VN')}
                  </td>
                </tr>
              )}

              <tr className="font-bold bg-gray-100 text-base">
                <td colSpan={9} className="border border-gray-300 px-4 py-3 text-right text-[#E53935]">
                  TỔNG CỘNG TIỀN NHẬP KHO:
                </td>
                <td className="border border-gray-300 px-3 py-3 text-right text-[#E53935]">
                  {Number(receipt.totalAmount).toLocaleString('vi-VN')} đ
                </td>
              </tr>
            </tbody>
          </table>

          {/* Số tiền bằng chữ */}
          <div className="text-sm sm:text-base text-gray-800 mb-10 italic">
            <strong>Tổng số tiền (viết bằng chữ):</strong> {numberToWords(Number(receipt.totalAmount))}
          </div>

          {/* Phần ký nhận 5 vị trí */}
          <div className="grid grid-cols-5 text-center text-sm gap-4 pt-4">
            <div>
              <div className="font-bold text-gray-900">Người lập phiếu</div>
              <div className="text-gray-500 italic text-xs">(Ký, họ tên)</div>
              <div className="h-24"></div>
              <div className="font-semibold text-gray-800">{receipt.createdBy?.fullName || 'Người lập'}</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">Người giao hàng</div>
              <div className="text-gray-500 italic text-xs">(Ký, họ tên)</div>
              <div className="h-24"></div>
              <div className="font-semibold text-gray-800">Đơn vị cung cấp</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">Người kiểm hàng</div>
              <div className="text-gray-500 italic text-xs">(Ký, họ tên)</div>
              <div className="h-24"></div>
              <div className="font-semibold text-gray-800">{receipt.checkedBy?.fullName || 'KCS / Kiểm kho'}</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">Thủ kho</div>
              <div className="text-gray-500 italic text-xs">(Ký, họ tên)</div>
              <div className="h-24"></div>
              <div className="font-semibold text-gray-800">Thủ kho nhận</div>
            </div>
            <div>
              <div className="font-bold text-gray-900">Kế toán / Giám đốc</div>
              <div className="text-gray-500 italic text-xs">(Ký, đóng dấu)</div>
              <div className="h-24"></div>
              <div className="font-semibold text-gray-800">{receipt.approvedBy?.fullName || 'Người duyệt'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
