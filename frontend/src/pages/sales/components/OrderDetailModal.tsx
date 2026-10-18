import React, { useState } from 'react';
import {
  Printer,
  X,
  FileSpreadsheet,
  Truck,
  Edit2,
  Trash2,
  PackageMinus
} from 'lucide-react';
import { Order } from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';
import { printA4 } from '../../../utils/printA4';
import { formatVND } from '../../../utils/formatCurrency';
import { exportOrderToExcel, exportDeliveryNoteToExcel } from '../../../utils/crmExcelExport';
import { NK_LOGO_BASE64 } from '../../../utils/logoBase64';
import '../../../styles/print-a4.css';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onEdit?: (order: Order) => void;
  onDelete?: (id: string, code: string, deliveryStatus: string) => void;
  onReturn?: (order: Order) => void;
  onPrintReturn?: (returnData: any, order: Order) => void;
  hasPermission?: (resource: string, action: any) => boolean;
  onExportExcel?: (order: Order) => void;
  onExportDeliveryNote?: (order: Order) => void;
}

function formatVietnameseDate(dateInput: string | Date | undefined | null): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  const d = isNaN(date.getTime()) ? new Date() : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `Ngày ${day} tháng ${month} năm ${year}`;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onEdit,
  onDelete,
  onReturn,
  hasPermission = () => true,
  onExportExcel,
  onExportDeliveryNote
}) => {
  const [activeSheet, setActiveSheet] = useState<'ORDER' | 'DELIVERY'>('ORDER');

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    if (activeSheet === 'ORDER') {
      printA4('printable-order', `Don_Hang_${order.code}`);
    } else {
      printA4('printable-delivery', `BBGH_${order.code}`);
    }
  };

  const handleExportOrder = () => {
    if (onExportExcel) {
      onExportExcel(order);
    } else {
      exportOrderToExcel(order);
    }
  };

  const handleExportDelivery = () => {
    if (onExportDeliveryNote) {
      onExportDeliveryNote(order);
    } else {
      exportDeliveryNoteToExcel(order);
    }
  };

  const customerName = order.customer?.name || (order.customer as any)?.companyName || 'Quý Khách hàng';
  const contactPerson = order.contactPerson || order.customer?.contactPerson || '';
  const phone = order.phone || order.customer?.phone || '';
  const address = order.deliveryAddress || order.customer?.deliveryAddress || order.customer?.address || '';
  const managerName = order.manager?.fullName || 'Nguyễn Nam Khánh';

  const dInput = order.deliveryDate || order.orderDate;
  const dObj = dInput ? new Date(dInput) : new Date();
  const dValid = !isNaN(dObj.getTime());
  const dayStr = dValid ? dObj.getDate().toString().padStart(2, '0') : '........';
  const monthStr = dValid ? (dObj.getMonth() + 1).toString().padStart(2, '0') : '.......';
  const yearStr = dValid ? dObj.getFullYear() : new Date().getFullYear();

  const remaining = Math.max(0, Number(order.totalAmount || 0) - Number(order.paidAmount || 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-1 sm:p-1.5 overflow-hidden">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[calc(100%-12px)] max-h-[calc(100%-12px)] flex flex-col shadow-2xl overflow-hidden a4-modal print-modal-container">
        {/* Header điều khiển thu nhỏ, gọn gàng trên 1 dòng (Không in) */}
        <div className="px-3 py-1.5 border-b border-gray-200 flex items-center justify-between bg-gray-50 no-print flex-shrink-0 flex-nowrap gap-2">
          {/* Bên trái: Thông tin rút gọn */}
          <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
            <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-bold text-gray-900 text-xs sm:text-sm">
                Đơn Hàng: {order.code}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Excel
              </span>
            </div>
          </div>

          {/* Bên phải: Nút công cụ bé lại và xếp gọn trên 1 dòng */}
          <div className="flex items-center gap-1.5 flex-nowrap flex-shrink-0">
            {order.deliveryStatus === 'DELIVERED' && hasPermission('B_ORDERS', 'update') && onReturn && (
              <button
                onClick={() => {
                  onClose();
                  onReturn(order);
                }}
                className="py-1 px-2 text-[11px] font-medium flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors cursor-pointer whitespace-nowrap"
                title="Lập phiếu đổi trả hàng hoàn kho"
              >
                <PackageMinus className="w-3 h-3" />
                <span>Đổi/Trả</span>
              </button>
            )}
            {hasPermission('B_ORDERS', 'update') && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(order);
                }}
                className="py-1 px-2 text-[11px] font-medium flex items-center gap-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded transition-colors cursor-pointer whitespace-nowrap"
                title="Chỉnh sửa toàn bộ thông tin đơn hàng này"
              >
                <Edit2 className="w-3 h-3 text-blue-600" />
                <span>Sửa</span>
              </button>
            )}
            {hasPermission('B_ORDERS', 'delete') && onDelete && (
              <button
                onClick={() => onDelete(order.id, order.code, order.deliveryStatus)}
                className="py-1 px-2 text-[11px] font-medium flex items-center gap-1 bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded transition-colors cursor-pointer whitespace-nowrap"
                title="Xóa đơn hàng này khỏi hệ thống"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
                <span>Xóa</span>
              </button>
            )}
            <button
              onClick={handleExportOrder}
              className="py-1 px-2 text-[11px] font-medium flex items-center gap-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded transition-colors cursor-pointer whitespace-nowrap"
              title="Xuất đơn hàng ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
              <span>Xuất Đơn</span>
            </button>
            <button
              onClick={handleExportDelivery}
              className="py-1 px-2 text-[11px] font-medium flex items-center gap-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 rounded transition-colors cursor-pointer whitespace-nowrap"
              title="Xuất Biên bản giao hàng ra file Excel (.xlsx)"
            >
              <Truck className="w-3 h-3 text-indigo-600" />
              <span>Xuất BBGH</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-1 px-3 text-[11px] font-semibold flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              title="In ngay biểu mẫu chuẩn Excel ra máy in / PDF"
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

        {/* Thanh Tabs Sheet phong cách Excel: Sheet 1 (Đơn hàng) & Sheet 2 (Lệnh xuất - BBGH) */}
        <div className="bg-slate-100 border-b border-gray-300 px-3 py-1 flex items-center gap-2 no-print flex-shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveSheet('ORDER')}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-t font-semibold transition-all cursor-pointer text-[11.5px] ${
              activeSheet === 'ORDER'
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${activeSheet === 'ORDER' ? 'text-emerald-600' : 'text-gray-500'}`} />
            <span>Sheet 1: Đơn hàng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSheet('DELIVERY')}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-t font-semibold transition-all cursor-pointer text-[11.5px] ${
              activeSheet === 'DELIVERY'
                ? 'bg-white border-t-2 border-blue-600 text-blue-800 shadow-xs'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Truck className={`w-3.5 h-3.5 ${activeSheet === 'DELIVERY' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span>Sheet 2: Lệnh xuất - BBGH</span>
          </button>

          <span className="text-gray-500 text-[11px] italic ml-auto hidden sm:inline">
            (Form và font chữ Times New Roman y hệt file Excel)
          </span>
        </div>

        {/* ================= KHUNG HIỂN THỊ DẠNG FORM EXCEL CHUẨN ================= */}
        <div className="a4-preview bg-slate-200">
          {activeSheet === 'ORDER' ? (
            /* ================= SHEET 1: ĐƠN HÀNG ================= */
            <div
              className="excel-sheet"
              id="printable-order"
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

              {/* Tiêu đề ĐƠN HÀNG */}
              <div className="text-center mt-2.5 mb-1">
                <h2 className="text-[19px] font-bold text-black uppercase tracking-wide">
                  ĐƠN HÀNG
                </h2>
              </div>

              {/* Dòng Ngày tháng năm */}
              <div className="text-center text-[13px] text-black border-b-[1.5px] border-black pb-1 mb-2.5">
                {formatVietnameseDate(order.orderDate)}
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
                  <span>Công ty TNHH NK Nam Khánh xin gửi tới quý Công ty bảng đơn hàng sau</span>
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
                  {order.items?.filter((item) => Number(item.quantity) > 0).map((item, idx) => (
                    <tr key={idx}>
                      <td className="excel-c">{idx + 1}</td>
                      <td className="excel-c">{item.productCode}</td>
                      <td className="excel-l">{item.productName}</td>
                      <td className="excel-c">{item.unit || 'Cái'}</td>
                      <td className="excel-c">{item.quantity}</td>
                      <td className="excel-num">{formatVND(Number(item.unitPrice))}</td>
                      <td className="excel-num">
                        {formatVND(Number(item.total || Number(item.quantity) * Number(item.unitPrice)))}
                      </td>
                    </tr>
                  ))}

                  {/* Dòng Tổng cộng tiền hàng */}
                  <tr className="excel-keep font-bold">
                    <td colSpan={6} className="excel-l font-bold" style={{ paddingLeft: '8px' }}>
                      Tổng cộng tiền hàng
                    </td>
                    <td className="excel-num font-bold">
                      {formatVND(Number(order.subtotal))}
                    </td>
                  </tr>

                  {/* Dòng Thuế VAT */}
                  <tr className="excel-keep font-bold">
                    <td colSpan={2} className="excel-l font-bold" style={{ paddingLeft: '8px' }}>
                      Thuế VAT
                    </td>
                    <td colSpan={4} className="excel-l font-bold">
                      {order.vatRate}%
                    </td>
                    <td className="excel-num font-bold">
                      {formatVND(Number(order.vatAmount))}
                    </td>
                  </tr>

                  {/* Dòng Tổng tiền thanh toán */}
                  <tr className="excel-keep font-bold">
                    <td colSpan={6} className="excel-l font-bold" style={{ paddingLeft: '8px' }}>
                      Tổng tiền thanh toán
                    </td>
                    <td className="excel-num font-bold">
                      {formatVND(Number(order.totalAmount))}
                    </td>
                  </tr>

                  {/* Dòng Bằng chữ */}
                  <tr className="excel-keep font-bold">
                    <td colSpan={2} className="excel-l font-bold" style={{ paddingLeft: '8px' }}>
                      Bằng chữ :
                    </td>
                    <td colSpan={5} className="excel-l font-bold italic">
                      {numberToWords(order.totalAmount)}
                    </td>
                  </tr>

                  {/* Dòng Đã thanh toán & Công nợ (Hiển thị rõ ràng chuẩn quản trị) */}
                  <tr className="excel-keep">
                    <td colSpan={2} className="excel-l font-bold" style={{ paddingLeft: '8px' }}>
                      Đã thanh toán (Thực thu):
                    </td>
                    <td colSpan={4} className="excel-l font-bold text-emerald-800">
                      {formatVND(Number(order.paidAmount || 0))}
                    </td>
                    <td className="excel-num font-bold text-red-600">
                      Còn nợ: {formatVND(remaining)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Ghi chú chuẩn biểu mẫu Excel */}
              <div className="excel-keep text-[12px] text-black mt-2.5 space-y-0.5">
                <div className="font-bold">Ghi chú:</div>
                <div>* Hàng hoá bảo hành theo tiêu chuẩn chính hãng</div>
                <div>* Đơn giá chưa bao gồm VAT</div>
                {order.notes && order.notes.trim() && (
                  <div>* {order.notes.trim()}</div>
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
          ) : (
            /* ================= SHEET 2: LỆNH XUẤT - BBGH ================= */
            <div
              className="excel-sheet"
              id="printable-delivery"
              style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
            >
              {/* Quốc hiệu tiêu ngữ */}
              <div className="text-center pb-2">
                <div className="font-bold text-[13px] uppercase">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="font-bold text-[13px] underline">
                  Độc lập - Tự do - Hạnh Phúc
                </div>
              </div>

              {/* Tiêu đề BIÊN BẢN GIAO HÀNG */}
              <div className="text-center mt-2.5 mb-2">
                <h2 className="text-[19px] font-bold text-black uppercase tracking-wide">
                  BIÊN BẢN GIAO HÀNG
                </h2>
              </div>

              {/* Dòng thời gian */}
              <div className="text-[12.5px] italic text-black mb-2">
                Hôm nay ngày {dayStr} Tháng {monthStr} Năm {yearStr} tại ….................................................chúng tôi gồm có
              </div>

              {/* Khối Bên A & Bên B */}
              <div className="text-[13px] text-black space-y-1 mb-2.5">
                <div>
                  <span className="font-bold">Bên A ( Bên giao hàng) : </span>
                  <span className="font-bold">Công ty TNHH NK Nam Khánh</span>
                </div>
                <div>Địa chỉ ( Address): Khu X1, Thôn Nguyên Khê - Xã Phúc Thịnh - TP.Hà Nội</div>
                <div>MST (Tax code) : 0108910572</div>
                <div>Số điện thoại ( Tel): 0766.088.886</div>
                <div>
                  Đại diện : Ông /Bà: &nbsp;&nbsp;&nbsp;&nbsp;<b>{managerName}</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Chức vụ : <b>Thủ Kho</b>
                </div>

                <div className="pt-1">
                  <span className="font-bold">Bên B ( Bên nhận hàng) : </span>
                  <span className="font-bold">{customerName}</span>
                </div>
                <div>Địa chỉ : {address || '........................................................................................................................'}</div>
                <div>Người đại diện: {contactPerson || '..............................................................................................................................'}</div>

                <div className="pt-1 italic">
                  Hai bên cùng tiến hành giao nhận hàng hóa theo bảng sau:
                </div>
              </div>

              {/* BẢNG SẢN PHẨM GIAO HÀNG */}
              <table className="excel-table">
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center' }}>Stt</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Mã hàng</th>
                    <th style={{ textAlign: 'center' }}>Tên hàng hóa, dịch vụ</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Đơn vị</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Số lượng</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.filter((item) => Number(item.quantity) > 0).map((item, idx) => (
                    <tr key={idx}>
                      <td className="excel-c">{idx + 1}</td>
                      <td className="excel-c">{item.productCode}</td>
                      <td className="excel-l">{item.productName}</td>
                      <td className="excel-c">{item.unit || 'Cái'}</td>
                      <td className="excel-c font-bold">{item.quantity}</td>
                      <td className="excel-l text-[11px] text-gray-700">Hàng mới 100%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Chữ ký 3 bên - BỎ in sẵn họ tên theo yêu cầu */}
              <div className="excel-keep mt-7 grid grid-cols-3 text-center text-[13px] text-black">
                <div>
                  <div className="font-bold uppercase">Đại diện bên nhận hàng</div>
                  <div className="text-[11px] italic text-gray-700">(Ký, ghi rõ họ tên)</div>
                  <div className="h-20"></div>
                </div>
                <div>
                  <div className="font-bold uppercase">Người giao hàng</div>
                  <div className="text-[11px] italic text-gray-700">(Ký, ghi rõ họ tên)</div>
                  <div className="h-20"></div>
                </div>
                <div>
                  <div className="font-bold uppercase">Thủ kho</div>
                  <div className="text-[11px] italic text-gray-700">(Ký, ghi rõ họ tên)</div>
                  <div className="h-20"></div>
                </div>
              </div>
            </div>
          )}

          {/* Lịch sử Đổi / Trả hàng hoàn kho (Vùng phụ lục quản trị, không in) */}
          {order.returns && order.returns.length > 0 && (
            <div className="max-w-[210mm] mx-auto mt-4 border border-orange-200 bg-orange-50/50 rounded-xl p-4 space-y-3 no-print shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-950 uppercase tracking-wide">
                <PackageMinus className="w-4 h-4 text-orange-600" />
                <span>Lịch sử đổi / trả hàng hoàn kho ({order.returns.length} đợt trả)</span>
              </div>
              <div className="space-y-2">
                {order.returns.map((ret, rIdx) => (
                  <div
                    key={rIdx}
                    className="bg-white p-3 rounded-lg border border-orange-200 text-xs space-y-1.5 shadow-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">
                        {ret.code} - Ngày {new Date(ret.returnDate).toLocaleDateString('vi-VN')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-700">
                          Tổng hoàn trả: {formatVND(Number(ret.totalRefundAmount))}
                        </span>
                        
                      </div>
                    </div>
                    <p className="text-gray-600 italic">Lý do: {ret.reason}</p>
                    <div className="text-[11px] text-gray-500">
                      Phương án:{' '}
                      {ret.refundMethod === 'DEDUCT_DEBT'
                        ? 'Trừ trực tiếp công nợ'
                        : ret.refundMethod === 'CREDIT_BALANCE'
                        ? 'Cộng vào số dư trả trước của khách'
                        : 'Tạo phiếu chi hoàn tiền'}
                    </div>
                    {ret.items && ret.items.length > 0 && (
                      <div className="mt-1 border-t border-gray-100 pt-1 text-[11px] text-gray-600 space-y-0.5">
                        {ret.items.map((it, itIdx) => (
                          <div key={itIdx} className="flex justify-between">
                            <span>• {it.productName} ({it.productCode})</span>
                            <span>
                              SL: {it.quantity} {it.unit} x {formatVND(Number(it.unitPrice))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
