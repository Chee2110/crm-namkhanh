import React, { useState, useRef } from 'react';
import { X, UploadCloud, Download, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Lightbulb, Image as ImageIcon } from 'lucide-react';
import ExcelJS from 'exceljs';

export interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sampleFileName: string;
  sampleHeaders: string[];
  sampleRows: (string | number)[][];
  sampleImages?: (string | null)[];
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
  sampleImages,
  requiredFields,
  fieldMappingHelp,
  onImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Tải file mẫu chuẩn Excel (.XLSX) có định dạng màu sắc, đường viền và HÌNH ẢNH MẪU THẬT
  const handleDownloadSampleExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Công ty TNHH TM&DV Nam Khánh';
      const worksheet = workbook.addWorksheet('DANH SÁCH MẪU', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }]
      });

      // Cấu hình tiêu đề cột
      worksheet.columns = sampleHeaders.map((h) => {
        const lower = h.toLowerCase();
        let width = 16;
        if (lower.includes('stt')) width = 7;
        else if (lower.includes('tên sản phẩm') || lower.includes('tên sp')) width = 36;
        else if (lower.includes('tên')) width = 24;
        else if (lower.includes('ảnh') || lower.includes('image')) width = 18;
        else if (lower.includes('giá') || lower.includes('tồn')) width = 15;
        return { header: h, key: h, width };
      });

      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;

      // Tô màu pastel chuẩn theo từng nhóm cột
      headerRow.eachCell((cell, colNumber) => {
        const hText = (sampleHeaders[colNumber - 1] || '').toLowerCase();
        let bgArgb = 'FFD9E1F2'; // Pastel xanh xám mặc định
        if (hText.includes('danh mục') || hText.includes('mã sp') || hText.includes('tên sp') || hText.includes('sản phẩm')) {
          bgArgb = 'FFBDD7EE';
        } else if (hText.includes('nhóm loại')) {
          bgArgb = 'FFFCE4D6';
        } else if (hText.includes('loại')) {
          bgArgb = 'FFE2EFDA';
        } else if (hText.includes('hình ảnh') || hText.includes('ảnh')) {
          bgArgb = 'FFA9D08E';
        } else if (hText.includes('thương hiệu')) {
          bgArgb = 'FFF8CBAD';
        } else if (hText.includes('màu sắc')) {
          bgArgb = 'FFD9D9D9';
        }

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgArgb }
        };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFB0B5BD' } },
          left: { style: 'thin', color: { argb: 'FFB0B5BD' } },
          bottom: { style: 'medium', color: { argb: 'FF6B7280' } },
          right: { style: 'thin', color: { argb: 'FFB0B5BD' } }
        };
      });

      // Xác định vị trí cột Hình ảnh sản phẩm (0-based)
      const imageColIdx = sampleHeaders.findIndex(
        (h) => h.toLowerCase().includes('hình ảnh') || h.toLowerCase().includes('ảnh') || h.toLowerCase() === 'image'
      );

      // Thêm các dòng mẫu
      sampleRows.forEach((r, rIdx) => {
        const rowData = [...r];
        // Nếu dòng này có ảnh mẫu nhúng hoặc cột ảnh, không ghi text URL để tránh chữ đè dưới ảnh
        if (imageColIdx !== -1) {
          rowData[imageColIdx] = '';
        }
        const row = worksheet.addRow(rowData);
        row.height = 38; // Chiều cao hàng vừa vặn ảnh thumbnail
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 9.5 };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber - 1 === imageColIdx ? 'center' : (typeof cell.value === 'number' ? 'right' : 'left')
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        });
      });

      // Nhúng hình ảnh mẫu thật vào cột "Hình ảnh sản phẩm"
      if (imageColIdx !== -1 && sampleImages && sampleImages.length > 0) {
        for (let idx = 0; idx < sampleImages.length; idx++) {
          const imgSource = sampleImages[idx];
          if (!imgSource) continue;
          try {
            let base64 = '';
            let extension: 'png' | 'jpeg' = 'png';
            if (imgSource.startsWith('data:image/')) {
              const match = imgSource.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
              if (match) {
                extension = match[1].toLowerCase() === 'jpg' ? 'jpeg' : (match[1].toLowerCase() as 'png' | 'jpeg');
                base64 = match[2];
              }
            } else if (imgSource.startsWith('http') || imgSource.startsWith('/uploads/')) {
              try {
                const res = await fetch(imgSource);
                if (res.ok) {
                  const blob = await res.blob();
                  const mime = blob.type.toLowerCase();
                  extension = mime.includes('jpeg') || mime.includes('jpg') ? 'jpeg' : 'png';
                  const buffer = await blob.arrayBuffer();
                  const u8 = new Uint8Array(buffer);
                  let bin = '';
                  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
                  base64 = btoa(bin);
                }
              } catch (e) {
                console.warn('Cannot fetch sample image:', imgSource, e);
              }
            } else {
              base64 = imgSource;
            }

            if (base64) {
              const imgId = workbook.addImage({ base64, extension });
              // Row 1 là header (0-based: 0). Dòng dữ liệu đầu tiên là row 2 (0-based: 1).
              worksheet.addImage(imgId, {
                tl: { col: imageColIdx + 0.35, row: idx + 1 + 0.12 },
                ext: { width: 34, height: 34 },
                editAs: 'oneCell'
              });
            }
          } catch (e) {
            console.warn('Lỗi chèn ảnh mẫu vào Excel:', e);
          }
        }
      }

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: sampleHeaders.length }
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const baseName = sampleFileName.replace(/\.(csv|xlsx)$/i, '');
      link.download = `${baseName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi xuất file mẫu XLSX:', err);
      handleDownloadSampleCSV();
    }
  };

  // 2. Tải file mẫu CSV
  const handleDownloadSampleCSV = () => {
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
    const baseName = sampleFileName.replace(/\.(csv|xlsx)$/i, '');
    link.download = `${baseName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper lấy giá trị ô từ ExcelJS
  const getCellValue = (cell: any): any => {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    const v = cell.value;
    if (typeof v === 'object') {
      if ('text' in v) return v.text;
      if ('result' in v) return v.result;
      if ('richText' in v && Array.isArray(v.richText)) {
        return v.richText.map((t: any) => t.text || '').join('');
      }
    }
    return v;
  };

  // 3. Phân tích file Excel (.XLSX / .XLS) và tự động trích xuất ảnh nhúng
  const parseExcel = async (f: File) => {
    setIsParsing(true);
    setErrors([]);
    setParsedData([]);
    try {
      const arrayBuffer = await f.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        setErrors(['File Excel không chứa bất kỳ trang tính (worksheet) nào.']);
        return;
      }

      // Trích xuất hình ảnh nhúng theo từng dòng
      const imagesByRow: Record<number, { dataUrl: string; blob: Blob }> = {};
      try {
        const sheetImages = worksheet.getImages();
        sheetImages.forEach((imgMeta) => {
          const imgObj = workbook.getImage(Number(imgMeta.imageId));
          if (imgObj && imgObj.buffer) {
            const ext = imgObj.extension || 'png';
            const u8 = new Uint8Array(imgObj.buffer);
            const blob = new Blob([u8], { type: `image/${ext}` });
            let binary = '';
            for (let i = 0; i < u8.length; i++) {
              binary += String.fromCharCode(u8[i]);
            }
            const dataUrl = `data:image/${ext};base64,${btoa(binary)}`;

            const tl = imgMeta.range?.tl as any;
            let targetRow: number | null = null;
            if (tl) {
              if (typeof tl.nativeRow === 'number') {
                targetRow = tl.nativeRow + 1; // nativeRow là 0-based
              } else if (typeof tl.row === 'number') {
                targetRow = Math.floor(tl.row) + 1;
              }
            }
            if (targetRow !== null) {
              imagesByRow[targetRow] = { dataUrl, blob };
            }
          }
        });
      } catch (imgErr) {
        console.warn('Lỗi trích xuất hình ảnh nhúng từ Excel:', imgErr);
      }

      // Tìm dòng tiêu đề (header)
      let headerRowValues: string[] = [];
      let headerRowNumber = 1;

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (headerRowValues.length === 0) {
          const tempHeaders: string[] = [];
          row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const txt = String(getCellValue(cell) || '').trim();
            if (txt) {
              tempHeaders[colNumber] = txt;
            }
          });
          if (tempHeaders.filter(Boolean).length >= 2) {
            headerRowValues = tempHeaders;
            headerRowNumber = rowNumber;
          }
        }
      });

      if (headerRowValues.length === 0) {
        setErrors(['Không tìm thấy dòng tiêu đề hợp lệ trong file Excel.']);
        return;
      }

      const cleanHeaders = headerRowValues.filter(Boolean);
      setHeaders(cleanHeaders);

      // Kiểm tra cột bắt buộc
      const validationErrors: string[] = [];
      requiredFields.forEach((rf) => {
        if (!cleanHeaders.some((h) => h.toLowerCase() === rf.toLowerCase())) {
          validationErrors.push(`Thiếu cột bắt buộc: "${rf}" trong file Excel.`);
        }
      });

      // Đọc từng dòng dữ liệu
      const rows: Record<string, any>[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= headerRowNumber) return; // Bỏ qua dòng header

        const rowObj: Record<string, any> = {};
        let hasAnyData = false;

        headerRowValues.forEach((h, colNumber) => {
          if (!h) return;
          const cell = row.getCell(colNumber);
          const val = getCellValue(cell);
          rowObj[h] = val !== undefined && val !== null ? val : '';
          if (val !== '' && val !== null && val !== undefined) {
            hasAnyData = true;
          }
        });

        // Nếu dòng có ảnh nhúng từ Excel
        if (imagesByRow[rowNumber]) {
          const imgKey = cleanHeaders.find((k) =>
            k.toLowerCase().includes('hình ảnh') ||
            k.toLowerCase().includes('hinh anh') ||
            k.toLowerCase() === 'image' ||
            k.toLowerCase() === 'ảnh'
          ) || 'Hình ảnh sản phẩm';

          rowObj[imgKey] = imagesByRow[rowNumber].dataUrl;
          rowObj['_imageBlob'] = imagesByRow[rowNumber].blob;
          hasAnyData = true;
        }

        if (!hasAnyData) return;

        // Kiểm tra dữ liệu bắt buộc
        for (const rf of requiredFields) {
          const matchingKey = Object.keys(rowObj).find((k) => k.toLowerCase() === rf.toLowerCase());
          if (!matchingKey || rowObj[matchingKey] === '' || rowObj[matchingKey] === undefined) {
            validationErrors.push(`Dòng ${rowNumber}: Cột bắt buộc "${rf}" không có dữ liệu.`);
            break;
          }
        }

        rows.push(rowObj);
      });

      if (rows.length === 0) {
        validationErrors.push('File Excel không có dòng dữ liệu nào bên dưới tiêu đề.');
      }

      setErrors(validationErrors.slice(0, 10));
      setParsedData(rows);
    } catch (err: any) {
      console.error('Lỗi khi đọc file Excel:', err);
      setErrors([`Lỗi khi đọc file Excel: ${err.message || 'Định dạng file không hợp lệ'}`]);
    } finally {
      setIsParsing(false);
    }
  };

  // 4. Phân tích file CSV
  const parseCSV = (text: string) => {
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

      for (const rf of requiredFields) {
        const matchingKey = Object.keys(rowObj).find((k) => k.toLowerCase() === rf.toLowerCase());
        if (!matchingKey || !rowObj[matchingKey]) {
          validationErrors.push(`Dòng ${i + 1}: Cột bắt buộc "${rf}" không có dữ liệu.`);
          break;
        }
      }

      rows.push(rowObj);
    }

    setErrors(validationErrors.slice(0, 10));
    setParsedData(rows);
  };

  const processFile = async (selected: File) => {
    setFile(selected);
    setResultMessage(null);

    const isExcel = selected.name.endsWith('.xlsx') || selected.name.endsWith('.xls');
    if (isExcel) {
      await parseExcel(selected);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        parseCSV(content);
      };
      reader.readAsText(selected, 'UTF-8');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    processFile(dropped);
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 font-semibold text-gray-800 text-lg">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Bước 1: Tải file mẫu */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div>
              <div className="font-semibold text-emerald-900 text-sm">Bước 1: Tải tệp tin Excel/CSV mẫu chuẩn form</div>
              <p className="text-xs text-emerald-700 mt-0.5">
                File mẫu chuẩn có đầy đủ cột màu sắc, hỗ trợ dán URL ảnh hoặc chèn trực tiếp hình ảnh vào ô.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadSampleExcel}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                title="Tải file mẫu Excel chuẩn định dạng .xlsx"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file mẫu (.XLSX chuẩn form)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                title="Tải file mẫu định dạng .CSV"
              >
                <span>.CSV</span>
              </button>
            </div>
          </div>

          {/* Danh sách các cột tiêu chuẩn */}
          {sampleHeaders && sampleHeaders.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Cấu trúc danh sách cột ({sampleHeaders.length} cột):</span>
                <span className="text-[11px] text-slate-400 font-normal">Thứ tự chuẩn theo file mẫu</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {sampleHeaders.map((col, cIdx) => (
                  <span
                    key={cIdx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200 text-slate-700"
                  >
                    <span className="text-gray-400 text-[10px]">{cIdx + 1}.</span>
                    <span>{col}</span>
                    {requiredFields.some((rf) => rf.toLowerCase() === col.toLowerCase()) && (
                      <span className="text-red-500 font-bold">*</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {fieldMappingHelp && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-start gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span><strong>Gợi ý các cột:</strong> {fieldMappingHelp}</span>
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
                accept=".xlsx,.xls,.csv"
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
                  <div className="text-sm font-medium text-gray-700">Kéo thả file Excel (.xlsx, .xls) hoặc CSV vào đây hoặc bấm để chọn tệp</div>
                  <div className="text-xs text-gray-400 mt-1">Hỗ trợ nhận diện hình ảnh nhúng trực tiếp trong file Excel và link ảnh URL</div>
                </div>
              )}
            </div>
          </div>

          {/* Trạng thái đang phân tích file */}
          {isParsing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Đang đọc cấu trúc bảng và trích xuất hình ảnh từ file Excel...</span>
            </div>
          )}

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

          {/* Bảng xem trước dữ liệu kèm ảnh */}
          {parsedData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <span>Xem trước dữ liệu ({parsedData.length} dòng hợp lệ)</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                    Hỗ trợ hiển thị ảnh
                  </span>
                </div>
                <div className="text-xs text-gray-500">Hiển thị tối đa 5 dòng đầu</div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-56 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2 border-b border-gray-200 text-center w-10">#</th>
                      {headers.map((h, i) => (
                        <th key={i} className="p-2 border-b border-gray-200 whitespace-nowrap text-center">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                        {headers.map((h, i) => {
                          const val = row[h];
                          const isImgCol =
                            h.toLowerCase().includes('hình ảnh') ||
                            h.toLowerCase().includes('hinh anh') ||
                            h.toLowerCase() === 'image' ||
                            h.toLowerCase() === 'ảnh';
                          const hasImgVal =
                            typeof val === 'string' &&
                            (val.startsWith('data:image/') || val.startsWith('http') || val.startsWith('/uploads/'));

                          return (
                            <td key={i} className="p-2 whitespace-nowrap text-gray-700 text-center align-middle">
                              {isImgCol && hasImgVal ? (
                                <img
                                  src={val}
                                  alt="Ảnh SP"
                                  className="w-10 h-10 object-contain rounded border border-gray-200 bg-white mx-auto shadow-xs"
                                />
                              ) : isImgCol && !hasImgVal ? (
                                <span className="text-gray-300 italic text-[11px]">Chưa có ảnh</span>
                              ) : (
                                <span className={typeof val === 'number' ? 'font-mono text-right block' : ''}>
                                  {val !== undefined && val !== null ? String(val) : '—'}
                                </span>
                              )}
                            </td>
                          );
                        })}
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
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedData.length === 0 || isLoading || isParsing}
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
