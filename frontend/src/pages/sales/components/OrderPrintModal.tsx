import React from 'react';
import { Printer, X, FileSpreadsheet } from 'lucide-react';
import { Order } from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';
import { NAMKHANH_BANK_INFO, generateVietQRUrl } from '../../../utils/vietqr';
import { printA4 } from '../../../utils/printA4';
import { formatVND, formatNumber } from '../../../utils/formatCurrency';
import { exportOrderToExcel } from '../../../utils/crmExcelExport';
import '../../../styles/print-a4.css';

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

  const handlePrint = () => {
    printA4('printable-invoice', `Phieu_xuat_kho_${order.code}`);
  };

  const orderDate = new Date(order.orderDate || order.createdAt);
  const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : orderDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-1 sm:p-1.5 overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden my-auto h-[calc(100%-12px)] max-h-[calc(100%-12px)] flex flex-col a4-modal print-modal-container">
        {/* Header điều khiển (Không in) */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 no-print flex-shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#E53935]" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              Bản In Phiếu Xuất Kho Kiêm Giao Hàng A4 - {order.code}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportOrderToExcel(order)}
              className="btn-secondary !py-1.5 !px-3.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              title="Xuất đơn hàng ra file Excel chuẩn biểu mẫu (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
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
        <div className="a4-preview">
          <div className="a4-sheet" id="printable-invoice">
            {/* Header thông tin công ty Nam Khánh */}
            <div className="a4-header">
              <div className="a4-brand">
                <img src="/logo.png" alt="Nam Khánh Logo" className="a4-logo" />
                <div>
                  <h1 className="a4-company-name">CÔNG TY TNHH THƯƠNG MẠI &amp; DỊCH VỤ NAM KHÁNH</h1>
                  <p className="a4-company-slogan">
                    Chuyên cung cấp Văn phòng phẩm &amp; Thiết bị văn phòng uy tín, chuyên nghiệp
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
                  <p className="a4-company-line strong">
                    <span className="a4-nowrap">TK 1: 19035678901234 - Techcombank (CN Hà Tây)</span>
                    <span className="a4-sep">|</span>
                    <span className="a4-nowrap">TK 2: 0451000345678 - Vietcombank (CN Thành Công)</span>
                  </p>
                </div>
              </div>

              <div className="a4-docmeta">
                <div className="a4-doccode">MÃ ĐƠN HÀNG: {order.code}</div>
                <div>Ngày đặt: {orderDate.toLocaleDateString('vi-VN')}</div>
                <div>Ngày giao: {deliveryDate.toLocaleDateString('vi-VN')}</div>
              </div>
            </div>

            {/* Tiêu đề Phiếu xuất kho */}
            <div className="a4-title">
              <h2>PHIẾU XUẤT KHO KIÊM BIÊN BẢN GIAO HÀNG</h2>
              <p>
                Ngày {deliveryDate.getDate()} tháng {deliveryDate.getMonth() + 1} năm {deliveryDate.getFullYear()}
              </p>
            </div>

            {/* Thông tin Đối tác / Người nhận hàng */}
            <div className="a4-info">
              <div className="a4-field a4-full">
                <b>Kính gửi (Đơn vị nhận hàng):</b>
                <span>{order.customer?.name || 'Quý khách hàng'}</span>
              </div>
              <div className="a4-field">
                <b>Mã số thuế:</b>
                <span>{order.customer?.taxCode || 'Theo hồ sơ khách hàng'}</span>
              </div>
              <div className="a4-field">
                <b>Số điện thoại:</b>
                <span>{order.phone || order.customer?.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="a4-field">
                <b>Người nhận hàng:</b>
                <span>{order.contactPerson || order.customer?.contactPerson || 'Bộ phận tiếp nhận'}</span>
              </div>
              <div className="a4-field">
                <b>Nhân viên phụ trách đơn:</b>
                <span>{order.manager?.fullName || 'Đội ngũ Kinh doanh Nam Khánh'}</span>
              </div>
              <div className="a4-field a4-full">
                <b>Địa chỉ giao hàng:</b>
                <span>
                  {order.deliveryAddress || order.customer?.deliveryAddress || order.customer?.address || 'Tại địa chỉ khách hàng'}
                </span>
              </div>
              {order.notes && <div className="a4-info-note">Ghi chú giao hàng: {order.notes}</div>}
            </div>

            {/* Bảng chi tiết 8 cột chuẩn theo Quy chuẩn Section XI.6 */}
            <table className="a4-table">
              <thead>
                <tr>
                  <th className="a4-fit">STT</th>
                  <th className="a4-fit">Mã hàng</th>
                  <th className="a4-l">Tên sản phẩm, quy cách</th>
                  <th className="a4-fit">ĐVT</th>
                  <th className="a4-fit">Số lượng</th>
                  <th className="a4-fit">Đơn giá</th>
                  <th className="a4-fit">Thành tiền</th>
                  <th className="a4-fit">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => {
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.unitPrice) || 0;
                    const amount = Number(item.amount) || qty * price;
                    return (
                      <tr key={item.id || index}>
                        <td className="a4-fit a4-c">{index + 1}</td>
                        <td className="a4-fit a4-c a4-code">{item.productCode}</td>
                        <td className="a4-name">{item.productName}</td>
                        <td className="a4-fit a4-c">{item.unit}</td>
                        <td className="a4-num" style={{ fontWeight: 700 }}>{formatNumber(qty)}</td>
                        <td className="a4-num">{formatVND(price)}</td>
                        <td className="a4-num" style={{ fontWeight: 700 }}>{formatVND(amount)}</td>
                        <td className="a4-fit a4-muted">Chuẩn mới 100%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="a4-empty">
                      Chưa có chi tiết sản phẩm
                    </td>
                  </tr>
                )}
              </tbody>
              <tbody className="a4-keep">
                <tr className="a4-sum">
                  <td colSpan={6} className="a4-r">Cộng tiền hàng (chưa bao gồm VAT):</td>
                  <td className="a4-num">{formatVND(Number(order.subtotal))}</td>
                  <td></td>
                </tr>
                <tr className="a4-sum">
                  <td colSpan={6} className="a4-r">Tiền thuế Giá trị gia tăng (VAT {order.vatRate || 8}%):</td>
                  <td className="a4-num">{formatVND(Number(order.vatAmount))}</td>
                  <td></td>
                </tr>
                <tr className="a4-total">
                  <td colSpan={6} className="a4-r">Tổng cộng tiền thanh toán:</td>
                  <td className="a4-num">{formatVND(Number(order.totalAmount))}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {/* Diễn giải số tiền viết bằng chữ (Chuẩn tiếng Việt) */}
            <div className="a4-words">
              <b>Số tiền viết bằng chữ: </b>
              <i className="a4-red">{numberToWords(order.totalAmount)}</i>
            </div>

            {/* Thông tin thanh toán & VietQR Chuyển khoản nhanh NAPAS 247 */}
            <div className="a4-pay">
              <div className="a4-pay-info">
                <div className="a4-pay-title">
                  <span>Thông tin chuyển khoản:</span>
                  <span className="a4-badge">NAPAS 247 VietQR</span>
                </div>
                <p>
                  Ngân hàng: <b>{NAMKHANH_BANK_INFO.bankName} ({NAMKHANH_BANK_INFO.bankId})</b>
                </p>
                <p>
                  Số tài khoản: <b className="a4-mono" style={{ letterSpacing: '0.05em' }}>{NAMKHANH_BANK_INFO.accountNo}</b>
                </p>
                <p>
                  Chủ tài khoản: <b style={{ textTransform: 'uppercase' }}>{NAMKHANH_BANK_INFO.accountName}</b>
                </p>
                <p>
                  Nội dung chuyển khoản: <b className="a4-mono a4-red">{order.code}</b>
                </p>
              </div>
              <div className="a4-qr">
                <img
                  src={generateVietQRUrl(Number(order.totalAmount) || 0, order.code)}
                  alt="VietQR Payment"
                  crossOrigin="anonymous"
                />
                <span>Quét mã để thanh toán</span>
              </div>
            </div>

            {/* Chữ ký 4 bên chuẩn theo Section XI.6 */}
            <div className="a4-signs">
              <div>
                <p className="a4-sign-title">Người lập phiếu</p>
                <p className="a4-sign-hint">(Ký, ghi rõ họ tên)</p>
                <div className="a4-sign-space"></div>
              </div>

              <div>
                <p className="a4-sign-title">Người nhận hàng</p>
                <p className="a4-sign-hint">(Ký, ghi rõ họ tên)</p>
                <div className="a4-sign-space"></div>
              </div>

              <div>
                <p className="a4-sign-title">Thủ kho</p>
                <p className="a4-sign-hint">(Ký, ghi rõ họ tên)</p>
                <div className="a4-sign-space"></div>
                <p className="a4-sign-name a4-muted">(Đã kiểm đủ SL)</p>
              </div>

              <div>
                <p className="a4-sign-title">Giám đốc / Đại diện</p>
                <p className="a4-sign-hint">(Ký, đóng dấu)</p>
                <div className="a4-sign-space"></div>
                <p className="a4-sign-name a4-muted">(Đã duyệt)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
