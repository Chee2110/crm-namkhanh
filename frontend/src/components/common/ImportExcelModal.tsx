import React, { useState, useRef } from 'react';
import { X, UploadCloud, Download, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';

export interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sampleFileName: string;
  sampleHeaders: string[];
  sampleRows: (string | number)[][];
  requiredFields: string[];
  fieldMappingHelp?: string;
  onImport: (parsedRows: Record<string, any>[]) => Promise<{ success: boolean; count: number; message?: string }>;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  title,
  sampleFileName,
  sampleHeaders,
  sampleRows,
  requiredFields,
  fieldMappingHelp,
  onImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Tải file mẫu chuẩn UTF-8 BOM
  const handleDownloadSample = () => {
    const csvContent =
      '\uFEFF' +
      [
        sampleHeaders.join(','),
        ...sampleRows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = sampleFileName.endsWith('.csv') ? sampleFileName : `${sampleFileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Phân tích file CSV
  const parseCSV = (text: string) => {
    // Loại bỏ BOM nếu có
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setErrors(['File không chứa dòng dữ liệu nào (cần có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu).']);
      setParsedData([]);
      return;
    }

    // Tách cột tôn trọng dấu nháy kép
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headerRow = parseLine(lines[0]);
    setHeaders(headerRow);

    const validationErrors: string[] = [];
    // Kiểm tra các trường bắt buộc
    requiredFields.forEach((rf) => {
      if (!headerRow.some((h) => h.toLowerCase() === rf.toLowerCase())) {
        validationErrors.push(`Thiếu cột bắt buộc: "${rf}" trong dòng tiêu đề.`);
      }
    });

    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

      const rowObj: Record<string, any> = {};
      headerRow.forEach((h, idx) => {
        rowObj[h] = values[idx] !== undefined ? values[idx] : '';
      });

      // Kiểm tra giá trị bắt buộc
      for (const rf of requiredFields) {
        const matchingKey = Object.keys(rowObj).find((k) => k.toLowerCase() === rf.toLowerCase());
        if (!matchingKey || !rowObj[matchingKey]) {
          validationErrors.push(`Dòng ${i + 1}: Cột bắt buộc "${rf}" không có dữ liệu.`);
          break;
        }
      }

      rows.push(rowObj);
    }

    setErrors(validationErrors.slice(0, 10)); // Giới hạn 10 lỗi đầu tiên
    setParsedData(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResultMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCSV(content);
    };
    reader.readAsText(selected, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    setFile(dropped);
    setResultMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCSV(content);
    };
    reader.readAsText(dropped, 'UTF-8');
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;
    setIsLoading(true);
    setResultMessage(null);
    try {
      const res = await onImport(parsedData);
      if (res.success) {
        setResultMessage({
          type: 'success',
          text: `Đã nhập thành công ${res.count} bản ghi vào hệ thống!`
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setResultMessage({
          type: 'error',
          text: res.message || 'Có lỗi xảy ra trong quá trình nhập dữ liệu.'
        });
      }
    } catch (err: any) {
      setResultMessage({
        type: 'error',
        text: err.message || 'Lỗi kết nối khi gửi dữ liệu lên máy chủ.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 font-semibold text-gray-800 text-lg">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Bước 1: Tải file mẫu */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div>
              <div className="font-semibold text-emerald-900 text-sm">Bước 1: Tải tệp tin Excel/CSV mẫu chuẩn</div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Điền dữ liệu theo đúng định dạng mẫu trước khi tải lên để đảm bảo tính hợp lệ.
              </p>
            </div>
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file mẫu (.CSV)</span>
            </button>
          </div>

          {fieldMappingHelp && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
              💡 <strong>Gợi ý các cột:</strong> {fieldMappingHelp}
            </div>
          )}

          {/* Bước 2: Kéo thả file upload */}
          <div>
            <div className="font-semibold text-gray-800 text-sm mb-2">Bước 2: Tải file dữ liệu lên hệ thống</div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-red-500 bg-red-50/50'
                  : file
                  ? 'border-emerald-500 bg-emerald-50/30'
                  : 'border-gray-300 hover:border-red-400 bg-gray-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className={`w-10 h-10 mx-auto mb-2 ${file ? 'text-emerald-600' : 'text-gray-400'}`} />
              {file ? (
                <div>
                  <div className="text-sm font-semibold text-gray-800">{file.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB — Bấm để chọn file khác
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-medium text-gray-700">Kéo thả file CSV vào đây hoặc bấm để chọn tệp</div>
                  <div className="text-xs text-gray-400 mt-1">Hỗ trợ định dạng CSV chuẩn UTF-8</div>
                </div>
              )}
            </div>
          </div>

          {/* Kết quả thông báo */}
          {resultMessage && (
            <div
              className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                resultMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {resultMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{resultMessage.text}</span>
            </div>
          )}

          {/* Cảnh báo lỗi xác thực */}
          {errors.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Cảnh báo định dạng dữ liệu ({errors.length} cảnh báo):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Bảng xem trước dữ liệu */}
          {parsedData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-800 text-sm">
                  Xem trước dữ liệu ({parsedData.length} dòng hợp lệ)
                </div>
                <div className="text-xs text-gray-500">Hiển thị tối đa 5 dòng đầu</div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-48 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2 border-b border-gray-200 text-center w-10">#</th>
                      {headers.map((h, i) => (
                        <th key={i} className="p-2 border-b border-gray-200 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                        {headers.map((h, i) => (
                          <td key={i} className="p-2 whitespace-nowrap text-gray-700">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedData.length === 0 || isLoading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Xác nhận nhập ({parsedData.length} dòng)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
