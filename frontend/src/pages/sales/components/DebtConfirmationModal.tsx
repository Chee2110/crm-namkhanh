import React, { useState, useEffect } from 'react';
import { Printer, X, FileSpreadsheet, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Customer, CustomerDebtStatement } from '../../../types';
import { api } from '../../../services/api';
import { numberToWords } from '../../../utils/numberToWords';

interface DebtConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const DebtConfirmationModal: React.FC<DebtConfirmationModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const [statement, setStatement] = useState<CustomerDebtStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customer?.id) {
      fetchDebtStatement(customer.id);
    }
  }, [isOpen, customer?.id]);

  const fetchDebtStatement = async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<CustomerDebtStatement>(`/customers/${customerId}/debt-statement`);
      setStatement(res.data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải biên bản đối chiếu công nợ');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const today = new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 max-h-[95vh] flex flex-col">
        {/* Header điều khiển (Không in) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 no-print flex-shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#E53935]" />
            <h3 className="font-bold text-gray-900 text-base">
              Biên Bản Đối Chiếu & Xác Nhận Công Nợ A4 - {customer.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !statement}
              className="btn-primary !py-1.5 !px-4 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>In Biên bản (Ctrl + P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Khung nội dung tài liệu A4 */}
        <div className="p-8 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#E53935] mb-2" />
              <p className="text-sm">Đang tổng hợp dữ liệu đơn hàng và thanh toán công nợ...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : statement ? (
            <div className="space-y-6 text-[13px] leading-relaxed text-gray-800 font-sans">
              {/* Header công ty */}
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4">
                <div>
                  <h1 className="text-base font-black text-gray-900 uppercase tracking-tight">
                    CÔNG TY TNHH THƯƠNG MẠI & DỊCH VỤ NAM KHÁNH
                  </h1>
                  <p className="text-xs text-gray-600 mt-1">
                    MST: <strong>0109881122</strong> | Hotline: <strong>0988.111.222</strong>
                  </p>
                  <p className="text-xs text-gray-600">
                    Địa chỉ: Số 36, Ngõ 195, Phố Yên Duyên, P. Yên Sở, Q. Hoàng Mai, TP. Hà Nội
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500 font-mono">
                  <p className="font-bold text-gray-800">MẪU SỐ: 06-NK/CN</p>
                  <p>Ngày in: {today.toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              {/* Tiêu đề chính */}
              <div className="text-center space-y-1 py-2">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">
                  BIÊN BẢN ĐỐI CHIẾU VÀ XÁC NHẬN CÔNG NỢ
                </h2>
                <p className="italic text-xs text-gray-600">
                  (Tính đến ngày {today.toLocaleDateString('vi-VN')})
                </p>
              </div>

              {/* Thông tin 2 bên */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] text-[#E53935]">
                    BÊN A (BÊN BÁN): CÔNG TY TNHH THƯƠNG MẠI & DỊCH VỤ NAM KHÁNH
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-gray-700">
                    <p>Đại diện: <strong>Nguyễn Nam Khánh</strong> - Chức vụ: Giám đốc</p>
                    <p>Nhân viên phụ trách: <strong>{customer.manager?.fullName || 'Nguyễn Nam Khánh'}</strong></p>
                    <p>Điện thoại: <strong>0988.111.222</strong></p>
                    <p>Email: <strong>contact@namkhanh.vn</strong></p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-2.5">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] text-[#E53935]">
                    BÊN B (BÊN MUA): {customer.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-gray-700">
                    <p>Mã khách hàng: <strong>{customer.code}</strong></p>
                    <p>Mã số thuế: <strong>{customer.taxCode || '....................................'}</strong></p>
                    <p>Người liên hệ: <strong>{customer.contactPerson || 'Đại diện mua hàng'}</strong></p>
                    <p>Số điện thoại: <strong>{customer.phone}</strong></p>
                    <p className="col-span-2">Địa chỉ: <strong>{customer.address || customer.deliveryAddress || 'Chưa cập nhật'}</strong></p>
                  </div>
                </div>
              </div>

              <p className="text-xs italic text-gray-600">
                Hôm nay, hai bên cùng tiến hành đối chiếu tình hình giao nhận văn phòng phẩm và thanh toán công nợ chi tiết như sau:
              </p>

              {/* Bảng 1: Đơn hàng đã giao */}
              <div>
                <h3 className="font-bold text-xs uppercase text-gray-900 mb-2 flex items-center gap-1.5">
                  <span>I. Bảng kê đơn hàng phát sinh</span>
                </h3>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                        <th className="p-2 border-r border-gray-300 w-10 text-center">STT</th>
                        <th className="p-2 border-r border-gray-300 text-center w-24">Ngày đặt</th>
                        <th className="p-2 border-r border-gray-300 text-center w-28">Số đơn hàng</th>
                        <th className="p-2 border-r border-gray-300 text-right">Tổng tiền (VNĐ)</th>
                        <th className="p-2 border-r border-gray-300 text-right">Đã thanh toán</th>
                        <th className="p-2 text-right w-32">Còn nợ (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statement.orders.length > 0 ? (
                        statement.orders.map((o, idx) => (
                          <tr key={o.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                            <td className="p-2 text-center border-r border-gray-200">{idx + 1}</td>
                            <td className="p-2 text-center border-r border-gray-200">
                              {new Date(o.orderDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-gray-900 border-r border-gray-200">
                              {o.code}
                            </td>
                            <td className="p-2 text-right border-r border-gray-200">
                              {formatVND(Number(o.totalAmount))}
                            </td>
                            <td className="p-2 text-right text-emerald-700 font-medium border-r border-gray-200">
                              {formatVND(Number(o.paidAmount))}
                            </td>
                            <td className="p-2 text-right font-bold text-red-600">
                              {formatVND(Number(o.remainingAmount))}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400">
                            Chưa có đơn hàng nào phát sinh
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan={3} className="p-2 text-right border-r border-gray-300 uppercase">
                          Tổng cộng phát sinh:
                        </td>
                        <td className="p-2 text-right border-r border-gray-300 text-gray-900">
                          {formatVND(statement.summary.totalOrdersAmount)}
                        </td>
                        <td className="p-2 text-right border-r border-gray-300 text-emerald-700">
                          {formatVND(statement.summary.totalPaidAmount)}
                        </td>
                        <td className="p-2 text-right text-red-600 font-black">
                          {formatVND(statement.summary.remainingDebt)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Bảng 2: Chứng từ thu tiền nếu có */}
              {statement.receipts && statement.receipts.length > 0 && (
                <div>
                  <h3 className="font-bold text-xs uppercase text-gray-900 mb-2">
                    II. Bảng kê chứng từ thanh toán đã ghi nhận
                  </h3>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                          <th className="p-2 border-r border-gray-300 w-10 text-center">STT</th>
                          <th className="p-2 border-r border-gray-300 text-center w-24">Ngày thu</th>
                          <th className="p-2 border-r border-gray-300 text-center w-28">Số phiếu thu</th>
                          <th className="p-2 border-r border-gray-300 text-center w-28">Hình thức</th>
                          <th className="p-2 border-r border-gray-300">Nội dung</th>
                          <th className="p-2 text-right w-32">Số tiền thu (VNĐ)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statement.receipts.map((r, idx) => (
                          <tr key={r.id} className="border-b border-gray-200">
                            <td className="p-2 text-center border-r border-gray-200">{idx + 1}</td>
                            <td className="p-2 text-center border-r border-gray-200">
                              {new Date(r.voucherDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="p-2 text-center font-mono font-medium text-gray-900 border-r border-gray-200">
                              {r.code}
                            </td>
                            <td className="p-2 text-center border-r border-gray-200">
                              {r.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                            </td>
                            <td className="p-2 border-r border-gray-200 text-gray-600">{r.reason}</td>
                            <td className="p-2 text-right font-bold text-emerald-700">
                              {formatVND(Number(r.amount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Kết luận số dư công nợ */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-300 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold uppercase text-gray-900">
                    SỐ TIỀN BÊN B CÒN PHẢI THANH TOÁN CHO BÊN A:
                  </span>
                  <span className="font-black text-lg text-[#E53935]">
                    {formatVND(statement.summary.remainingDebt)}
                  </span>
                </div>
                <p className="italic text-gray-700">
                  (Viết bằng chữ: <strong className="text-gray-900">{numberToWords(statement.summary.remainingDebt)}</strong>)
                </p>
                <div className="pt-2 border-t border-gray-200 text-gray-600 flex justify-between">
                  <span>Hạn mức tín dụng được cấp: <strong>{formatVND(statement.summary.creditLimit)}</strong></span>
                  <span>Thời hạn nợ cho phép: <strong>{statement.summary.maxDebtDays} ngày</strong></span>
                </div>
              </div>

              {/* Điều khoản cam kết */}
              <div className="text-xs text-gray-600 italic">
                * Hai bên thống nhất số liệu công nợ nêu trên là hoàn toàn chính xác. Bên B cam kết thanh toán dứt điểm số tiền còn nợ cho Bên A theo đúng điều khoản hợp đồng đã ký kết. Biên bản được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.
              </div>

              {/* Chữ ký 4 bên */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-6">
                <div className="space-y-1">
                  <p className="font-bold uppercase text-gray-900">ĐẠI DIỆN BÊN MUA (BÊN B)</p>
                  <p className="text-[11px] text-gray-500 italic">(Ký, ghi rõ họ tên và đóng dấu)</p>
                  <div className="h-28 flex items-end justify-center font-bold text-gray-800">
                    {customer.contactPerson || '....................................'}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-bold uppercase text-[#E53935]">ĐẠI DIỆN BÊN BÁN (CÔNG TY TNHH NK NAM KHÁNH)</p>
                  <p className="text-[11px] text-gray-500 italic">(Ký, ghi rõ họ tên và đóng dấu)</p>
                  <div className="h-28 flex items-end justify-center font-bold text-gray-900">
                    Nguyễn Nam Khánh
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
