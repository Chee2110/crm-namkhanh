import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { Product } from '../../types';

export interface ParsedItemRow {
  productCode: string;
  productName: string;
  productId?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRate?: number;
  total?: number;
  status: 'VALID' | 'INVALID';
  errorMessage?: string;
}

interface ImportItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onImport: (items: any[]) => void;
  defaultVatRate?: number;
}

export const ImportItemsModal: React.FC<ImportItemsModalProps> = ({
  isOpen,
  onClose,
  products,
  onImport,
  defaultVatRate = 8
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedItemRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      '\uFEFFMã sản phẩm,Số lượng,Đơn giá (Để trống nếu lấy giá niêm yết)\n' +
      (products.length > 0
        ? products
            .slice(0, 3)
            .map((p) => `${p.code},10,${p.sellingPrice}`)
            .join('\n')
        : 'SP0001,10,65000\nSP0002,5,85000\nSP0003,20,15000');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mau_Nhap_Chi_Tiet_VPP_NamKhanh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) {
          setError('File tải lên không có dữ liệu');
          return;
        }

        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length <= 1) {
          setError('File chỉ chứa tiêu đề hoặc rỗng');
          return;
        }

        // Bỏ qua dòng tiêu đề
        const dataLines = lines.slice(1);
        const rows: ParsedItemRow[] = [];

        dataLines.forEach((line) => {
          // Xử lý dấu phẩy hoặc tab hoặc chấm phẩy
          const parts = line.includes('\t')
            ? line.split('\t')
            : line.includes(';')
            ? line.split(';')
            : line.split(',');

          const rawCode = parts[0]?.replace(/["']/g, '').trim().toUpperCase();
          if (!rawCode) return;

          const rawQty = parseFloat(parts[1]?.replace(/["']/g, '').trim() || '1');
          const qty = isNaN(rawQty) || rawQty <= 0 ? 1 : rawQty;

          const rawPrice = parseFloat(parts[2]?.replace(/["']/g, '').trim() || '0');

          // Tìm sản phẩm trong danh mục
          const matchedProd = products.find(
            (p) => p.code.toUpperCase() === rawCode || p.name.toLowerCase().includes(rawCode.toLowerCase())
          );

          if (matchedProd) {
            const unitPrice = !isNaN(rawPrice) && rawPrice > 0 ? rawPrice : matchedProd.sellingPrice;
            const amount = qty * unitPrice;
            const vatAmt = amount * (defaultVatRate / 100);

            rows.push({
              productCode: matchedProd.code,
              productName: matchedProd.name,
              productId: matchedProd.id,
              unit: matchedProd.unit || 'Cái',
              quantity: qty,
              unitPrice,
              amount,
              vatRate: defaultVatRate,
              total: amount + vatAmt,
              status: 'VALID'
            });
          } else {
            rows.push({
              productCode: rawCode,
              productName: 'Không xác định',
              unit: '-',
              quantity: qty,
              unitPrice: isNaN(rawPrice) ? 0 : rawPrice,
              amount: 0,
              status: 'INVALID',
              errorMessage: `Mã sản phẩm "${rawCode}" không tồn tại trong kho`
            });
          }
        });

        if (rows.length === 0) {
          setError('Không trích xuất được dòng sản phẩm hợp lệ nào');
        } else {
          setParsedRows(rows);
        }
      } catch (err: any) {
        setError('Lỗi khi đọc file: ' + err.message);
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const validRows = parsedRows.filter((r) => r.status === 'VALID');
  const totalAmount = validRows.reduce((sum, r) => sum + r.amount, 0);

  const handleConfirm = () => {
    if (validRows.length === 0) return;
    onImport(validRows);
    onClose();
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-100 text-[#E53935]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Nhập danh sách sản phẩm từ Excel / CSV
              </h3>
              <p className="text-xs text-gray-500">
                Tự động đối soát mã SKU, điền đơn giá và quy cách hàng hóa nhanh chóng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Hướng dẫn và tải file mẫu */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-gray-800">Chưa có file mẫu chuẩn?</span>
              <p className="text-gray-600">
                Tải file mẫu CSV gồm các cột: <strong>Mã SP, Số lượng, Đơn giá</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#E53935]" />
              <span>Tải file mẫu (.CSV)</span>
            </button>
          </div>

          {/* Vùng chọn file */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-[#E53935] hover:bg-red-50/20 rounded-xl p-6 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">
                {fileName ? fileName : 'Bấm để tải file CSV hoặc kéo thả vào đây'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Hỗ trợ định dạng .CSV mã hóa UTF-8
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bảng xem trước dữ liệu */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Kết quả đọc file ({validRows.length}/{parsedRows.length} dòng hợp lệ)
                </span>
                <span className="text-xs text-gray-600">
                  Tổng tạm tính: <strong className="text-[#E53935]">{formatVND(totalAmount)}</strong>
                </span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="p-2 w-10 text-center">STT</th>
                      <th className="p-2 w-24">Mã hàng</th>
                      <th className="p-2">Tên sản phẩm</th>
                      <th className="p-2 w-14 text-center">ĐVT</th>
                      <th className="p-2 w-16 text-right">SL</th>
                      <th className="p-2 w-24 text-right">Đơn giá</th>
                      <th className="p-2 w-28 text-right">Thành tiền</th>
                      <th className="p-2 w-24 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={r.status === 'VALID' ? 'hover:bg-gray-50' : 'bg-red-50/50'}
                      >
                        <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                        <td className="p-2 font-mono font-bold text-gray-900">{r.productCode}</td>
                        <td className="p-2 font-medium">
                          {r.status === 'VALID' ? (
                            r.productName
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              {r.errorMessage}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">{r.unit}</td>
                        <td className="p-2 text-right font-semibold">{r.quantity}</td>
                        <td className="p-2 text-right">{formatVND(r.unitPrice)}</td>
                        <td className="p-2 text-right font-bold text-gray-900">
                          {formatVND(r.amount)}
                        </td>
                        <td className="p-2 text-center">
                          {r.status === 'VALID' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Hợp lệ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              Không tìm thấy
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/80">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary text-xs"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={validRows.length === 0}
            onClick={handleConfirm}
            className="btn-primary !py-2 !px-5 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>Nhập {validRows.length} sản phẩm vào đơn hàng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
