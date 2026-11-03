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
  initialSheet?: 'ORDER' | 'DELIVERY';
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
  onExportDeliveryNote,
  initialSheet = 'ORDER'
}) => {
  const [activeSheet, setActiveSheet] = useState<'ORDER' | 'DELIVERY'>(initialSheet);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    if (activeSheet === 'ORDER') {
      printA4('printable-order', `${order.code}`);
    } else {
      printA4('printable-delivery', `${order.code}`);
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
  const repName = order.manager?.fullName || (order as any)?.createdBy?.fullName || 'Nguyễn Thị Hằng';
  const bbghContact = order.contactPerson || order.customer?.contactPerson || order.phone || order.customer?.phone || '';

  const formatExcelNumber = (val: number | string | undefined | null) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN').format(Math.round(num));
  };

  const formatExcelQty = (val: number | string | undefined | null) => {
    const num = Number(val) || 0;
    return Number.isInteger(num)
      ? new Intl.NumberFormat('vi-VN').format(num)
      : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(num);
  };

  const dInput = order.deliveryDate || order.orderDate;
  const dObj = dInput ? new Date(dInput) : new Date();
  const dValid = !isNaN(dObj.getTime());
  const dayStr = dValid ? dObj.getDate().toString().padStart(2, '0') : '........';
  const monthStr = dValid ? (dObj.getMonth() + 1).toString().padStart(2, '0') : '.......';
  const yearStr = dValid ? dObj.getFullYear() : new Date().getFullYear();

  const validItems = (order.items || []).filter((item) => Number(item.quantity) > 0);

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

        {/* ================= KHUNG HIỂN THỊ DẠNG FORM EXCEL CHUẨN (GỌN TRÊN 1 TỜ A4) ================= */}
        <div className="a4-preview bg-slate-200">
          {activeSheet === 'ORDER' ? (
            /* ================= SHEET 1: ĐƠN HÀNG (GIỐNG HỆT EXCEL - GỌN 1 TRANG A4) ================= */
            <div
              className="excel-sheet"
              id="printable-order"
              style={{
                fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif",
                color: '#000',
                padding: '6mm 10mm 6mm'
              }}
            >
              {/* Dòng 1 - 4: Logo (Cột B-C) & Thông tin công ty (Cột B-H / D-H) */}
              <div style={{ position: 'relative', minHeight: '72px', marginBottom: '2px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '1px',
                    width: '68px',
                    height: '68px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={`data:image/png;base64,${NK_LOGO_BASE64}`}
                    alt="Nam Khánh Logo"
                    style={{ width: '68px', height: '68px', objectFit: 'contain' }}
                  />
                </div>

                {/* Dòng 1: Merge B1:H1 căn giữa toàn bảng */}
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '12.5pt',
                    lineHeight: '19pt',
                    color: '#000'
                  }}
                >
                  CÔNG TY TNHH NK NAM KHÁNH
                </div>

                {/* Dòng 2 - 4: Cột D trở đi (cách lề trái 19% tương ứng cột B + C) */}
                <div style={{ paddingLeft: '19%', fontSize: '10.5pt', lineHeight: '14.5pt', color: '#000' }}>
                  <div>Địa chỉ ( Address): &nbsp;Khu X1, Thôn Nguyên Khê &nbsp;- Xã Phúc Thịnh - TP.Hà Nội</div>
                  <div>Mã số thuế : 0108910572</div>
                  <div>Số điện thoại : 0766.088.886 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Gmail : phankhanhfj@gmail.com</div>
                </div>
              </div>

              {/* Dòng 5: Tiêu đề ĐƠN HÀNG (Merge D5:G5 căn giữa) */}
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '13pt',
                  lineHeight: '17pt',
                  marginTop: '1px',
                  color: '#000'
                }}
              >
                ĐƠN HÀNG
              </div>

              {/* Dòng 6: Ngày tháng năm (Merge B6:H6, viền gạch dưới medium chuẩn mẫu Excel) */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '10.5pt',
                  lineHeight: '16pt',
                  borderBottom: '1.5px solid #000',
                  marginBottom: '3px',
                  color: '#000'
                }}
              >
                {formatVietnameseDate(order.orderDate)}
              </div>

              {/* Dòng 7 - 12: Thông tin khách hàng & lời mở đầu */}
              <div style={{ fontSize: '10.5pt', lineHeight: '15pt', color: '#000' }}>
                {/* Dòng 7: B7:C7 = Kính gửi (19%) | D7:H7 = Tên KH in đậm */}
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ width: '19%', flexShrink: 0 }}>Kính gửi</span>
                  <span style={{ fontSize: '10.5pt', fontWeight: 'bold' }}>{customerName}</span>
                </div>
                {/* Dòng 8: Người đại diện */}
                <div>Người đại diện : {contactPerson}</div>
                {/* Dòng 9: Số điện thoại */}
                <div>Số điện thoại : {phone}</div>
                {/* Dòng 10: Địa chỉ */}
                <div>Địa chỉ : {address}</div>
                {/* Dòng 11: Lời mở đầu */}
                <div>Công ty TNHH NK Nam Khánh xin gửi tới quý Công ty bảng đơn hàng sau</div>
                {/* Dòng 12: Loại tiền: Vnđ ở G12:H12 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1px' }}>
                  <span style={{ fontSize: '10.5pt', textAlign: 'right', paddingRight: '2px' }}>
                    Loại tiền: &nbsp;Vnđ
                  </span>
                </div>
              </div>

              {/* Dòng 13+: BẢNG HÀNG HÓA CHUẨN EXCEL */}
              <table
                className="excel-table"
                style={{
                  width: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  fontFamily: "'Times New Roman', Times, serif",
                  color: '#000'
                }}
              >
                <colgroup>
                  <col style={{ width: '4.5%' }} />
                  <col style={{ width: '14.5%' }} />
                  <col style={{ width: '40.5%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '7.5%' }} />
                  <col style={{ width: '11.5%' }} />
                  <col style={{ width: '13.5%' }} />
                </colgroup>
                <thead>
                  <tr style={{ height: '28px' }}>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 3px' }}>
                      Stt
                    </th>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 4px' }}>
                      Mã hàng
                    </th>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 4px' }}>
                      Tên hàng hóa, dịch vụ
                    </th>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 3px' }}>
                      Đơn vị tính
                    </th>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 3px' }}>
                      Số lượng
                    </th>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 4px' }}>
                      Đơn giá
                    </th>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 4px' }}>
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {validItems.length === 0 ? (
                    <tr style={{ height: '18px' }}>
                      <td style={{ border: '1.15px solid #000' }}></td>
                      <td style={{ border: '1.15px solid #000' }}></td>
                      <td style={{ border: '1.15px solid #000' }}></td>
                      <td style={{ border: '1.15px solid #000' }}></td>
                      <td style={{ border: '1.15px solid #000' }}></td>
                      <td style={{ border: '1.15px solid #000' }}></td>
                      <td style={{ border: '1.15px solid #000' }}></td>
                    </tr>
                  ) : (
                    validItems.map((item, idx) => {
                      const lineAmount = Number(item.quantity) * Number(item.unitPrice);
                      return (
                        <tr key={idx}>
                          <td style={{ border: '1.15px solid #000', textAlign: 'center', fontSize: '11pt', padding: '2px 3px' }}>
                            {idx + 1}
                          </td>
                          <td style={{ border: '1.15px solid #000', textAlign: 'center', fontSize: '11pt', padding: '2px 4px', wordBreak: 'break-word' }}>
                            {item.productCode}
                          </td>
                          <td style={{ border: '1.15px solid #000', textAlign: 'left', fontSize: '11pt', padding: '2px 5px', wordBreak: 'break-word' }}>
                            {item.productName}
                          </td>
                          <td style={{ border: '1.15px solid #000', textAlign: 'center', fontSize: '11pt', padding: '2px 3px' }}>
                            {item.unit || 'Cái'}
                          </td>
                          <td style={{ border: '1.15px solid #000', textAlign: 'center', fontSize: '11pt', padding: '2px 3px' }}>
                            {formatExcelQty(item.quantity)}
                          </td>
                          <td style={{ border: '1.15px solid #000', textAlign: 'right', fontSize: '11pt', padding: '2px 5px', whiteSpace: 'nowrap' }}>
                            {formatExcelNumber(item.unitPrice)}
                          </td>
                          <td style={{ border: '1.15px solid #000', textAlign: 'right', fontSize: '11pt', padding: '2px 5px', whiteSpace: 'nowrap' }}>
                            {formatExcelNumber(lineAmount)}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Dòng Tổng cộng tiền hàng */}
                  <tr className="excel-keep">
                    <td
                      colSpan={6}
                      style={{
                        border: '1.15px solid #000',
                        fontSize: '10.5pt',
                        fontWeight: 'bold',
                        textAlign: 'left',
                        padding: '2px 5px'
                      }}
                    >
                      Tổng cộng tiền hàng
                    </td>
                    <td
                      style={{
                        border: '1.15px solid #000',
                        fontSize: '10.5pt',
                        fontWeight: 'bold',
                        textAlign: 'right',
                        padding: '2px 5px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatExcelNumber(order.subtotal)}
                    </td>
                  </tr>

                  {/* Dòng Thuế VAT */}
                  <tr className="excel-keep">
                    <td
                      colSpan={2}
                      style={{
                        borderTop: '1.15px solid #000',
                        borderBottom: '1.15px solid #000',
                        borderLeft: '1.15px solid #000',
                        borderRight: 'none',
                        fontSize: '10.5pt',
                        fontWeight: 'bold',
                        textAlign: 'left',
                        padding: '2px 5px'
                      }}
                    >
                      Thuế VAT
                    </td>
                    <td
                      colSpan={4}
                      style={{
                        borderTop: '1.15px solid #000',
                        borderBottom: '1.15px solid #000',
                        borderLeft: 'none',
                        borderRight: '1.15px solid #000',
                        fontSize: '10.5pt',
                        fontWeight: 'bold',
                        textAlign: 'left',
                        padding: '2px 5px'
                      }}
                    >
                      {Number(order.vatRate) || 8}%
                    </td>
                    <td
                      style={{
                        border: '1.15px solid #000',
                        fontSize: '10.5pt',
                        fontWeight: 'bold',
                        textAlign: 'right',
                        padding: '2px 5px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatExcelNumber(order.vatAmount)}
                    </td>
                  </tr>

                  {/* Dòng Tổng tiền thanh toán */}
                  <tr className="excel-keep">
                    <td
                      colSpan={6}
                      style={{
                        border: '1.15px solid #000',
                        fontSize: '10.5pt',
                        fontWeight: 'bold',
                        textAlign: 'left',
                        padding: '2px 5px'
                      }}
                    >
                      Tổng tiền thanh toán
                    </td>
                    <td
                      style={{
                        border: '1.15px solid #000',
                        fontSize: '10.5pt',
                        fontWeight: 'bold',
                        textAlign: 'right',
                        padding: '2px 5px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatExcelNumber(order.totalAmount)}
                    </td>
                  </tr>

                  {/* Dòng Bằng chữ */}
                  <tr className="excel-keep">
                    <td
                      colSpan={2}
                      style={{
                        borderTop: '1.15px solid #000',
                        borderBottom: '1.15px solid #000',
                        borderLeft: '1.15px solid #000',
                        borderRight: 'none',
                        fontSize: '10.5pt',
                        fontWeight: 'bold',
                        textAlign: 'left',
                        padding: '2px 5px'
                      }}
                    >
                      Bằng chữ :
                    </td>
                    <td
                      colSpan={5}
                      style={{
                        borderTop: '1.15px solid #000',
                        borderBottom: '1.15px solid #000',
                        borderLeft: 'none',
                        borderRight: '1.15px solid #000',
                        fontSize: '10.5pt',
                        fontWeight: 'bold',
                        textAlign: 'left',
                        padding: '2px 5px'
                      }}
                    >
                      {numberToWords(order.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Phần Chữ ký 2 bên chuẩn biểu mẫu Excel (gọn trong 1 trang A4) */}
              <div className="excel-keep" style={{ marginTop: '10px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    textAlign: 'center',
                    fontSize: '11pt',
                    fontWeight: 'bold',
                    color: '#000'
                  }}
                >
                  <div>Xác nhận bên bán hàng</div>
                  <div>Xác nhận bên mua hàng</div>
                </div>
                <div style={{ height: '65px' }}></div>
              </div>
            </div>
          ) : (
            /* ================= SHEET 2: LỆNH XUẤT - BBGH (GIỐNG HỆT EXCEL - GỌN 1 TRANG A4) ================= */
            <div
              className="excel-sheet"
              id="printable-delivery"
              style={{
                fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif",
                color: '#000',
                padding: '6mm 10mm 6mm'
              }}
            >
              {/* 1. Quốc hiệu tiêu ngữ (Dòng 1-2: Merge B1:F1 & B2:F2) */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11pt', fontWeight: 'bold', lineHeight: '16.5pt' }}>
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div style={{ fontSize: '11pt', fontWeight: 'bold', textDecoration: 'underline', lineHeight: '14pt' }}>
                  Độc lập - Tự do - Hạnh Phúc
                </div>
              </div>

              {/* 2. Tiêu đề PHIẾU XUẤT KHO KIÊM BIÊN BẢN GIAO HÀNG (Dòng 3: Merge B3:F3) */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '13.5pt',
                  fontWeight: 'bold',
                  lineHeight: '22pt',
                  marginTop: '3px',
                  marginBottom: '2px'
                }}
              >
                PHIẾU XUẤT KHO KIÊM BIÊN BẢN GIAO HÀNG
              </div>

              {/* 3. Thời gian lập biên bản (Dòng 4: Merge B4:F4) */}
              <div style={{ fontSize: '10.5pt', fontStyle: 'italic', lineHeight: '16.5pt' }}>
                Hôm nay ngày {dayStr} Tháng {monthStr} Năm {yearStr} chúng tôi gồm có
              </div>

              {/* 4. Bên A & Bên B (Dòng 5 - 14 chuẩn Excel BIEU_MAU_CRM.xlsx) */}
              <div style={{ color: '#000', marginBottom: '3px' }}>
                {/* Dòng 5: Bên A (size 12 bold trong Excel) */}
                <div style={{ fontSize: '10.5pt', fontWeight: 'bold', lineHeight: '15.5pt' }}>
                  Bên A ( Bên giao hàng) : Công ty TNHH NK Nam Khánh
                </div>
                {/* Dòng 6 - 9: Thông tin Bên A (size 14 trong Excel) */}
                <div style={{ fontSize: '11.5pt', lineHeight: '15.5pt' }}>
                  Địa chỉ ( Address): &nbsp;Khu X1, Thôn Nguyên Khê &nbsp;- Xã Phúc Thịnh - TP.Hà Nội
                </div>
                <div style={{ fontSize: '11.5pt', lineHeight: '15.5pt' }}>
                  MST (Tax code) : 0108910572
                </div>
                <div style={{ fontSize: '11.5pt', lineHeight: '15.5pt' }}>
                  Số điện thoại ( Tel): 0766.088.886
                </div>
                <div style={{ fontSize: '11.5pt', lineHeight: '15.5pt' }}>
                  Đại diện : Ông /Bà: &nbsp;&nbsp;&nbsp;&nbsp;{repName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Chức vụ &nbsp;: Thủ Kho
                </div>

                {/* Dòng 10: Bên B (B10 = Bên B, D10:F10 = Tên KH căn thẳng hàng cột D = 25%) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    fontSize: '10.5pt',
                    fontWeight: 'bold',
                    lineHeight: '16pt',
                    marginTop: '1px'
                  }}
                >
                  <span style={{ width: '25%', flexShrink: 0 }}>Bên B ( Bên nhận hàng)</span>
                  <span>{customerName}</span>
                </div>
                {/* Dòng 11 - 13: Thông tin Bên B (size 12 trong Excel) */}
                <div style={{ fontSize: '10.5pt', lineHeight: '15pt' }}>
                  Địa chỉ : {address}
                </div>
                <div
                  style={{
                    fontSize: '10.5pt',
                    lineHeight: '15pt',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'clip'
                  }}
                >
                  {bbghContact
                    ? `Người đại diện: ${bbghContact}`
                    : 'Người đại diện…..........................................................................................................................................................................................................................'}
                </div>
                <div
                  style={{
                    fontSize: '10.5pt',
                    lineHeight: '15pt',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'clip'
                  }}
                >
                  Chức vụ: …....................................................................................................................................................................................................................................
                </div>
                {/* Dòng 14: Lời dẫn bàn giao (size 14 trong Excel) */}
                <div style={{ fontSize: '11.5pt', lineHeight: '16.5pt', marginTop: '1px' }}>
                  Chúng tôi &nbsp;thống nhất giao và nhận hàng hóa, với quy cách, chủng loại và số lượng như sau:
                </div>
              </div>

              {/* 5. BẢNG SẢN PHẨM GIAO HÀNG (5 cột chuẩn Excel: B=5.55, C=21.33, D=54.55, E=13.33, F=14.89) */}
              <table
                className="excel-table"
                style={{
                  width: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  fontFamily: "'Times New Roman', Times, serif",
                  color: '#000'
                }}
              >
                <colgroup>
                  <col style={{ width: '5.5%' }} />
                  <col style={{ width: '19.5%' }} />
                  <col style={{ width: '49.5%' }} />
                  <col style={{ width: '12.0%' }} />
                  <col style={{ width: '13.5%' }} />
                </colgroup>
                <thead>
                  <tr style={{ height: '32px' }}>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 2px' }}>
                      Stt (Sn)
                    </th>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 4px' }}>
                      Mã hàng (Item Code)
                    </th>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 4px' }}>
                      <div>Tên hàng hóa, dịch vụ</div>
                      <div>( Name of goods/service)</div>
                    </th>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 3px' }}>
                      Đơn vị (Unit)
                    </th>
                    <th style={{ fontSize: '10.5pt', fontWeight: 'bold', textAlign: 'center', border: '1.15px solid #000', padding: '2px 3px' }}>
                      Số lượng (Amount)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {validItems.length === 0 ? (
                    <tr style={{ height: '18px' }}>
                      <td style={{ border: '1.15px solid #000' }}></td>
                      <td style={{ border: '1.15px solid #000' }}></td>
                      <td style={{ border: '1.15px solid #000' }}></td>
                      <td style={{ border: '1.15px solid #000' }}></td>
                      <td style={{ border: '1.15px solid #000' }}></td>
                    </tr>
                  ) : (
                    validItems.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1.15px solid #000', textAlign: 'center', fontSize: '11.5pt', padding: '2px 3px' }}>
                          {idx + 1}
                        </td>
                        <td style={{ border: '1.15px solid #000', textAlign: 'center', fontSize: '11.5pt', padding: '2px 4px', wordBreak: 'break-word' }}>
                          {item.productCode}
                        </td>
                        <td style={{ border: '1.15px solid #000', textAlign: 'left', fontSize: '11.5pt', padding: '2px 5px', wordBreak: 'break-word' }}>
                          {item.productName}
                        </td>
                        <td style={{ border: '1.15px solid #000', textAlign: 'center', fontSize: '11.5pt', padding: '2px 3px' }}>
                          {item.unit || 'Cái'}
                        </td>
                        <td style={{ border: '1.15px solid #000', textAlign: 'center', fontSize: '11.5pt', padding: '2px 3px' }}>
                          {formatExcelQty(item.quantity)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* 6. Lời cam kết bàn giao chuẩn Excel (size 14 trong Excel) */}
              <div
                className="excel-keep"
                style={{
                  fontSize: '11.5pt',
                  lineHeight: '16pt',
                  marginTop: '4px',
                  color: '#000'
                }}
              >
                Bên B xác nhận bên A đã giao cho bên B đúng chủng loại và đủ số lượng hàng hóa như trên. Hai bên đồng ý thống nhất ký tên biên bản được lập thành 02 bản có giá trị pháp lý như nhau.
              </div>

              {/* 7. Chữ ký 4 bên chuẩn BIEU_MAU_CRM.xlsx */}
              <div className="excel-keep" style={{ marginTop: '10px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    textAlign: 'center',
                    fontSize: '11.5pt',
                    fontWeight: 'bold',
                    color: '#000'
                  }}
                >
                  <div>Người &nbsp;lập</div>
                  <div>Trưởng phòng KD</div>
                  <div>Bên giao hàng</div>
                  <div>Bên nhận hàng</div>
                </div>
                <div style={{ height: '65px' }}></div>
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
