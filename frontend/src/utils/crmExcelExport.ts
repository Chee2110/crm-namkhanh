import ExcelJS from 'exceljs';
import { Order, Quotation, ReceiptVoucher, PaymentVoucher } from '../types';
import { numberToWords } from './numberToWords';
import { NK_LOGO_BASE64 } from './logoBase64';

/**
 * Định dạng ngày theo chuẩn tiếng Việt trong biểu mẫu BIEU_MAU_CRM.xlsx:
 * "Ngày dd tháng mm năm yyyy"
 */
function formatVietnameseDate(dateInput: string | Date | undefined | null): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  const d = isNaN(date.getTime()) ? new Date() : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `Ngày ${day} tháng ${month} năm ${year}`;
}

const HAIR_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'hair' },
  left: { style: 'hair' },
  bottom: { style: 'hair' },
  right: { style: 'hair' }
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
};

const NUMBER_FORMAT_CURRENCY = '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)';
const NUMBER_FORMAT_QTY = '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)';

/**
 * Định dạng số lượng: không hiển thị .0 nếu là số nguyên (ví dụ 41 thay vì 41.0),
 * nếu có phần lẻ thập phân thì hiển thị thập phân gọn gàng.
 */
function formatQuantity(val: any): { value: number; numFmt: string } {
  const num = Number(val) || 0;
  return {
    value: num,
    numFmt: Number.isInteger(num)
      ? '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)'
      : '_(* #,##0.##_);_(* (#,##0.##);_(* "-"??_);_(@_)'
  };
}

/**
 * Lưu và kích hoạt tải xuống file Excel trên trình duyệt
 */
async function saveWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  if (typeof window === 'undefined') {
    const nodeRequire = (globalThis as any).require;
    if (nodeRequire) {
      const fs = nodeRequire('fs');
      const buf = (globalThis as any).Buffer ? (globalThis as any).Buffer.from(buffer) : buffer;
      fs.writeFileSync(fileName, buf);
    }
    return;
  }
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Xuất file Excel Đơn Hàng đúng chuẩn biểu mẫu BIEU_MAU_CRM.xlsx
 * Bao gồm:
 * - Sheet 1: "Đơn hàng" (Đầy đủ Logo, căn chỉnh cột, font Times New Roman, công thức SUM/nhân VAT, Bằng chữ)
 * - Sheet 2: "Lệnh xuất - BBGH" (Biên bản bàn giao giao nhận hàng hóa thực tế)
 */
export async function exportOrderToExcel(order: Order, fileName?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NK Nam Khánh CRM';
  workbook.lastModifiedBy = 'NK Nam Khánh CRM';
  workbook.created = new Date();
  workbook.modified = new Date();

  // =========================================================================
  // SHEET 1: ĐƠN HÀNG (Chuẩn biểu mẫu BIEU_MAU_CRM.xlsx)
  // =========================================================================
  const ws = workbook.addWorksheet('Đơn hàng', {
    views: [{ showGridLines: true, rightToLeft: false }]
  });

  // Thiết lập trang in chuẩn khổ A4 đứng, tự động vừa khít chiều ngang 1 trang A4
  const isSinglePage = ((order.items || []).filter((it) => Number(it.quantity) > 0).length || 0) <= 22;
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: isSinglePage ? 1 : 0,
    margins: { left: 0.35, right: 0.35, top: 0.5, bottom: 0.4, header: 0.2, footer: 0.2 }
  };

  // Thiết lập độ rộng cột chuẩn biểu mẫu BIEU_MAU_CRM.xlsx, tối ưu hiển thị đầy đủ và vừa khít A4
  ws.getColumn('A').width = 1.0;
  ws.getColumn('B').width = 4.8;   // STT
  ws.getColumn('C').width = 16.5;  // Mã hàng - rộng rãi hiển thị đầy đủ
  ws.getColumn('D').width = 48.0;  // Tên hàng hóa, quy cách - rộng rãi hiển thị đầy đủ
  ws.getColumn('E').width = 8.5;   // Đơn vị tính
  ws.getColumn('F').width = 8.5;   // Số lượng
  ws.getColumn('G').width = 13.0;  // Đơn giá
  ws.getColumn('H').width = 16.0;  // Thành tiền

  // 0. Chèn Logo Nam Khánh chuẩn vị trí cột B-C, dòng 1-4 như trong biểu mẫu
  try {
    const logoId = workbook.addImage({
      base64: NK_LOGO_BASE64,
      extension: 'png'
    });
    // Hiển thị logo theo đúng tỷ lệ 1:1 chuẩn xác, không bị dẹp hay méo hình
    ws.addImage(logoId, {
      tl: { col: 1.25, row: 0.20 },
      ext: { width: 86, height: 86 },
      editAs: 'oneCell'
    } as any);
  } catch (e) {
    console.error('Không thể chèn logo vào file excel:', e);
  }

  // 1. Tên công ty (Dòng 1, merge B1:H1)
  ws.mergeCells('B1:H1');
  const r1 = ws.getCell('B1');
  r1.value = 'CÔNG TY TNHH NK NAM KHÁNH ';
  r1.font = { name: 'Times New Roman', size: 14, bold: true };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 25.8;

  // 2. Địa chỉ công ty (Dòng 2 - ô D2)
  ws.getRow(2).height = 17.4;
  const r2 = ws.getCell('D2');
  r2.value = 'Địa chỉ ( Address):  Khu X1, Thôn Nguyên Khê  - Xã Phúc Thịnh - TP.Hà Nội';
  r2.font = { name: 'Times New Roman', size: 12 };

  // 3. Mã số thuế (Dòng 3 - ô D3)
  ws.getRow(3).height = 17.4;
  const r3 = ws.getCell('D3');
  r3.value = 'Mã số thuế : 0108910572';
  r3.font = { name: 'Times New Roman', size: 12 };

  // 4. Hotline & Email (Dòng 4 - ô D4)
  ws.getRow(4).height = 17.4;
  const r4 = ws.getCell('D4');
  r4.value = 'Số điện thoại : 0766.088.886      - Gmail : phankhanhfj@gmail.com';
  r4.font = { name: 'Times New Roman', size: 12 };

  // 5. Tiêu đề ĐƠN HÀNG (Dòng 5, merge D5:G5)
  ws.mergeCells('D5:G5');
  const r5 = ws.getCell('D5');
  r5.value = 'ĐƠN HÀNG ';
  r5.font = { name: 'Times New Roman', size: 14, bold: true };
  r5.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(5).height = 21.6;

  // 6. Ngày tháng năm (Dòng 6, merge B6:H6, viền gạch dưới medium chuẩn mẫu)
  ws.mergeCells('B6:H6');
  const r6 = ws.getCell('B6');
  r6.value = formatVietnameseDate(order.orderDate);
  r6.font = { name: 'Times New Roman', size: 12 };
  r6.alignment = { horizontal: 'center', vertical: 'top' };
  ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
    ws.getCell(`${col}6`).border = { bottom: { style: 'medium' } };
  });
  ws.getRow(6).height = 20.4;

  // 7. Kính gửi khách hàng
  ws.mergeCells('B7:C7');
  const r7Title = ws.getCell('B7');
  r7Title.value = 'Kính gửi';
  r7Title.font = { name: 'Times New Roman', size: 12 };
  r7Title.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells('D7:H7');
  const r7Val = ws.getCell('D7');
  r7Val.value = order.customer?.name || (order.customer as any)?.companyName || 'Quý Khách hàng';
  r7Val.font = { name: 'Times New Roman', size: 11, bold: true };
  r7Val.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(7).height = 22.2;

  // 8. Người đại diện
  ws.mergeCells('B8:H8');
  const r8 = ws.getCell('B8');
  const contact = order.contactPerson || order.customer?.contactPerson || '';
  r8.value = `Người đại diện : ${contact}`;
  r8.font = { name: 'Times New Roman', size: 12 };
  r8.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(8).height = 18;

  // 9. Số điện thoại
  ws.mergeCells('B9:H9');
  const r9 = ws.getCell('B9');
  const phone = order.phone || order.customer?.phone || '';
  r9.value = `Số điện thoại : ${phone}`;
  r9.font = { name: 'Times New Roman', size: 12 };
  r9.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(9).height = 18;

  // 10. Địa chỉ
  ws.mergeCells('B10:H10');
  const r10 = ws.getCell('B10');
  const address = order.deliveryAddress || order.customer?.deliveryAddress || order.customer?.address || '';
  r10.value = `Địa chỉ : ${address}`;
  r10.font = { name: 'Times New Roman', size: 12 };
  r10.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(10).height = 18;

  // 11. Lời mở đầu
  ws.mergeCells('B11:H11');
  const r11 = ws.getCell('B11');
  r11.value = 'Công ty TNHH NK Nam Khánh xin gửi tới quý Công ty bảng đơn hàng sau';
  r11.font = { name: 'Times New Roman', size: 12 };
  r11.alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(11).height = 22.2;

  // 12. Loại tiền
  ws.mergeCells('G12:H12');
  const r12 = ws.getCell('G12');
  r12.value = ' Loại tiền:  Vnđ';
  r12.font = { name: 'Times New Roman', size: 12 };
  r12.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  ['G', 'H'].forEach((col) => {
    ws.getCell(`${col}12`).border = { bottom: { style: 'hair' } };
  });
  ws.getRow(12).height = 15;

  // 13. Tiêu đề bảng hàng hóa (Header table)
  const headerRow = ws.getRow(13);
  headerRow.height = 40.2;
  const headers = [
    { col: 'B', text: 'Stt ' },
    { col: 'C', text: 'Mã hàng ' },
    { col: 'D', text: 'Tên hàng hóa, dịch vụ ' },
    { col: 'E', text: 'Đơn vị tính ' },
    { col: 'F', text: 'Số lượng ' },
    { col: 'G', text: 'Đơn giá ' },
    { col: 'H', text: 'Thành tiền' }
  ];

  headers.forEach((h) => {
    const c = ws.getCell(`${h.col}13`);
    c.value = h.text;
    c.font = { name: 'Times New Roman', size: 12, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = HAIR_BORDER;
  });

  // 14+. Dữ liệu sản phẩm
  const items = (order.items || []).filter((it) => Number(it.quantity) > 0);
  const startRow = 14;
  const lastItemRow = Math.max(startRow, startRow + items.length - 1);

  if (items.length === 0) {
    const r = ws.getRow(startRow);
    r.height = 18;
    ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
      const cell = ws.getCell(`${col}${startRow}`);
      cell.border = HAIR_BORDER;
      cell.font = { name: 'Times New Roman', size: 14 };
    });
  } else {
    items.forEach((it, idx) => {
      const rowIdx = startRow + idx;
      const r = ws.getRow(rowIdx);

      // Tự động tính chiều cao hàng theo độ dài tên hàng và mã hàng để hiển thị đầy đủ 100% nội dung
      const pName = it.productName || '';
      const pCode = it.productCode || '';
      const nameLines = pName.split(/\r?\n/).reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / 38)), 0);
      const codeLines = Math.ceil(pCode.length / 15);
      const rowLines = Math.max(nameLines, codeLines, 1);
      r.height = rowLines > 1 ? rowLines * 19 + 4 : 22;

      // B: STT
      const cB = ws.getCell(`B${rowIdx}`);
      cB.value = idx + 1;
      cB.alignment = { horizontal: 'center', vertical: 'middle' };
      cB.font = { name: 'Times New Roman', size: 13 };
      cB.border = HAIR_BORDER;

      // C: Mã hàng (hiển thị đầy đủ, wrapText nếu dài)
      const cC = ws.getCell(`C${rowIdx}`);
      cC.value = pCode;
      cC.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cC.font = { name: 'Times New Roman', size: 13 };
      cC.border = HAIR_BORDER;

      // D: Tên hàng hóa (hiển thị đầy đủ)
      const cD = ws.getCell(`D${rowIdx}`);
      cD.value = pName;
      cD.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      cD.font = { name: 'Times New Roman', size: 13 };
      cD.border = HAIR_BORDER;

      // E: ĐVT
      const cE = ws.getCell(`E${rowIdx}`);
      cE.value = it.unit || 'Cái';
      cE.alignment = { horizontal: 'center', vertical: 'middle' };
      cE.font = { name: 'Times New Roman', size: 13 };
      cE.border = HAIR_BORDER;

      // F: Số lượng (bỏ .0 đằng sau: 41 thay vì 41.0)
      const cF = ws.getCell(`F${rowIdx}`);
      const qInfo = formatQuantity(it.quantity);
      cF.value = qInfo.value;
      cF.alignment = { horizontal: 'center', vertical: 'middle' };
      cF.font = { name: 'Times New Roman', size: 13 };
      cF.numFmt = qInfo.numFmt;
      cF.border = HAIR_BORDER;

      // G: Đơn giá
      const cG = ws.getCell(`G${rowIdx}`);
      cG.value = Number(it.unitPrice) || 0;
      cG.alignment = { horizontal: 'right', vertical: 'middle' };
      cG.font = { name: 'Times New Roman', size: 13 };
      cG.numFmt = NUMBER_FORMAT_CURRENCY;
      cG.border = HAIR_BORDER;

      // H: Thành tiền = F * G (Công thức chuẩn biểu mẫu)
      const cH = ws.getCell(`H${rowIdx}`);
      cH.value = { formula: `+F${rowIdx}*G${rowIdx}`, result: Number(it.quantity) * Number(it.unitPrice) };
      cH.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
      cH.font = { name: 'Times New Roman', size: 13 };
      cH.numFmt = NUMBER_FORMAT_CURRENCY;
      cH.border = HAIR_BORDER;
    });
  }

  // --- Dòng Tổng cộng tiền hàng (Row: sumRowIdx) ---
  const sumRowIdx = lastItemRow + 1;
  ws.getRow(sumRowIdx).height = 18;
  const cSumLabel = ws.getCell(`B${sumRowIdx}`);
  cSumLabel.value = 'Tổng cộng tiền hàng';
  cSumLabel.font = { name: 'Times New Roman', size: 12, bold: true };
  cSumLabel.alignment = { vertical: 'middle' };
  cSumLabel.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' } };

  ['C', 'D', 'E', 'F'].forEach((col) => {
    ws.getCell(`${col}${sumRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };
  });
  ws.getCell(`G${sumRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } };

  const cSumVal = ws.getCell(`H${sumRowIdx}`);
  cSumVal.value = { formula: `SUM(H${startRow}:H${lastItemRow})`, result: Number(order.subtotal) };
  cSumVal.font = { name: 'Times New Roman', size: 12, bold: true };
  cSumVal.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  cSumVal.numFmt = NUMBER_FORMAT_CURRENCY;
  cSumVal.border = HAIR_BORDER;

  // --- Dòng Thuế VAT (Row: vatRowIdx) ---
  const vatRowIdx = sumRowIdx + 1;
  ws.getRow(vatRowIdx).height = 18;
  const cVatLabel = ws.getCell(`B${vatRowIdx}`);
  cVatLabel.value = 'Thuế VAT';
  cVatLabel.font = { name: 'Times New Roman', size: 12, bold: true };
  cVatLabel.alignment = { vertical: 'middle' };
  cVatLabel.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' } };

  ws.getCell(`C${vatRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };

  const vatRateDec = (Number(order.vatRate) || 8) / 100;
  const cVatRate = ws.getCell(`D${vatRowIdx}`);
  cVatRate.value = vatRateDec;
  cVatRate.font = { name: 'Times New Roman', size: 12, bold: true };
  cVatRate.alignment = { horizontal: 'left', vertical: 'middle' };
  cVatRate.numFmt = '0%';
  cVatRate.border = { top: { style: 'hair' }, bottom: { style: 'hair' } };

  ['E', 'F'].forEach((col) => {
    ws.getCell(`${col}${vatRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };
  });
  ws.getCell(`G${vatRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } };

  const cVatVal = ws.getCell(`H${vatRowIdx}`);
  cVatVal.value = { formula: `+H${sumRowIdx}*D${vatRowIdx}`, result: Number(order.vatAmount) };
  cVatVal.font = { name: 'Times New Roman', size: 12, bold: true };
  cVatVal.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  cVatVal.numFmt = NUMBER_FORMAT_CURRENCY;
  cVatVal.border = HAIR_BORDER;

  // --- Dòng Tổng tiền thanh toán (Row: totalRowIdx) ---
  const totalRowIdx = vatRowIdx + 1;
  ws.getRow(totalRowIdx).height = 18;
  const cTotalLabel = ws.getCell(`B${totalRowIdx}`);
  cTotalLabel.value = 'Tổng tiền thanh toán ';
  cTotalLabel.font = { name: 'Times New Roman', size: 12, bold: true };
  cTotalLabel.alignment = { vertical: 'middle' };
  cTotalLabel.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' } };

  ['C', 'D', 'E', 'F'].forEach((col) => {
    ws.getCell(`${col}${totalRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };
  });
  ws.getCell(`G${totalRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } };

  const cTotalVal = ws.getCell(`H${totalRowIdx}`);
  cTotalVal.value = { formula: `+H${vatRowIdx}+H${sumRowIdx}`, result: Number(order.totalAmount) };
  cTotalVal.font = { name: 'Times New Roman', size: 12, bold: true };
  cTotalVal.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  cTotalVal.numFmt = NUMBER_FORMAT_CURRENCY;
  cTotalVal.border = HAIR_BORDER;

  // --- Dòng Bằng chữ (Row: wordsRowIdx) ---
  const wordsRowIdx = totalRowIdx + 1;
  ws.getRow(wordsRowIdx).height = 20;
  const cWordsLabel = ws.getCell(`B${wordsRowIdx}`);
  cWordsLabel.value = 'Bằng chữ : ';
  cWordsLabel.font = { name: 'Times New Roman', size: 12, bold: true };
  cWordsLabel.alignment = { vertical: 'middle' };
  cWordsLabel.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' } };

  ws.getCell(`C${wordsRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };

  ws.mergeCells(`D${wordsRowIdx}:H${wordsRowIdx}`);
  const cWordsVal = ws.getCell(`D${wordsRowIdx}`);
  cWordsVal.value = numberToWords(order.totalAmount);
  cWordsVal.font = { name: 'Times New Roman', size: 12, bold: true };
  cWordsVal.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  ['D', 'E', 'F', 'G'].forEach((col) => {
    ws.getCell(`${col}${wordsRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };
  });
  ws.getCell(`H${wordsRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } };

  // --- Ghi chú chuẩn biểu mẫu ---
  let noteRowIdx = wordsRowIdx + 1;
  ws.mergeCells(`B${noteRowIdx}:C${noteRowIdx}`);
  const cNoteTitle = ws.getCell(`B${noteRowIdx}`);
  cNoteTitle.value = 'Ghi chú:';
  cNoteTitle.font = { name: 'Times New Roman', size: 11, bold: true };
  cNoteTitle.alignment = { horizontal: 'left' };
  ws.getCell(`B${noteRowIdx}`).border = { top: { style: 'hair' } };
  ws.getCell(`C${noteRowIdx}`).border = { top: { style: 'hair' } };

  const notesList = [
    '* Hàng hoá bảo hành theo tiêu chuẩn chính hãng',
    '* Đơn giá chưa bao gồm VAT'
  ];
  if (order.notes && order.notes.trim()) {
    notesList.push(`* ${order.notes.trim()}`);
  }

  notesList.forEach((n) => {
    noteRowIdx++;
    ws.mergeCells(`B${noteRowIdx}:H${noteRowIdx}`);
    const cell = ws.getCell(`B${noteRowIdx}`);
    cell.value = n;
    cell.font = { name: 'Times New Roman', size: 11 };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(noteRowIdx).height = 19.05;
  });

  // --- Phần Chữ ký 2 bên chuẩn Don_Hang_DH-2026-0005_2026-10-17.xlsx ---
  const signTitleRow = noteRowIdx + 1;
  ws.getRow(signTitleRow).height = 36;

  // Bên trái: Xác nhận bên bán hàng
  ws.mergeCells(`B${signTitleRow}:D${signTitleRow}`);
  const cSignSeller = ws.getCell(`B${signTitleRow}`);
  cSignSeller.value = 'Xác nhận bên bán hàng';
  cSignSeller.font = { name: 'Times New Roman', size: 13, bold: true };
  cSignSeller.alignment = { horizontal: 'center', vertical: 'middle' };

  // Bên phải: Xác nhận bên mua hàng
  ws.mergeCells(`F${signTitleRow}:H${signTitleRow}`);
  const cSignBuyer = ws.getCell(`F${signTitleRow}`);
  cSignBuyer.value = 'Xác nhận bên mua hàng';
  cSignBuyer.font = { name: 'Times New Roman', size: 13, bold: true };
  cSignBuyer.alignment = { horizontal: 'center', vertical: 'middle' };

  // Khoảng trống ký tên chuẩn biểu mẫu (3 dòng trống)
  ws.getRow(signTitleRow + 1).height = 36;
  ws.getRow(signTitleRow + 2).height = 36;
  ws.getRow(signTitleRow + 3).height = 36;

  // Vùng in giới hạn chính xác A1 đến H(cuối trang)
  ws.pageSetup.printArea = `A1:H${signTitleRow + 3}`;

  // =========================================================================
  // SHEET 2: LỆNH XUẤT - BBGH (Biên bản bàn giao giao nhận thực tế)
  // =========================================================================
  buildDeliveryNoteWorksheet(workbook, order);

  // Tải file về máy
  const finalFileName = fileName || `Don_Hang_${order.code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await saveWorkbook(workbook, finalFileName);
}

/**
 * Xây dựng worksheet "Lệnh xuất - BBGH" đúng chuẩn biểu mẫu BIEU_MAU_CRM.xlsx
 */
export function buildDeliveryNoteWorksheet(workbook: ExcelJS.Workbook, order: Order): ExcelJS.Worksheet {
  const wsBBGH = workbook.addWorksheet('Lệnh xuất - BBGH', {
    views: [{ showGridLines: true, rightToLeft: false }]
  });

  const items = (order.items || []).filter((it) => Number(it.quantity) > 0);
  const isSinglePageBBGH = items.length <= 22;
  wsBBGH.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: isSinglePageBBGH ? 1 : 0,
    margins: { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
  };

  // Độ rộng cột chuẩn 100% sheet "Lệnh xuất - BBGH" trong BIEU_MAU_CRM.xlsx
  wsBBGH.getColumn('A').width = 1.55;
  wsBBGH.getColumn('B').width = 5.55;  // Stt
  wsBBGH.getColumn('C').width = 21.33; // Mã hàng
  wsBBGH.getColumn('D').width = 54.55; // Tên hàng hóa, dịch vụ
  wsBBGH.getColumn('E').width = 13.33; // Đơn vị
  wsBBGH.getColumn('F').width = 14.89; // Số lượng

  // 1. Tiêu ngữ Quốc hiệu
  wsBBGH.mergeCells('B1:F1');
  const bb1 = wsBBGH.getCell('B1');
  bb1.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM ';
  bb1.font = { name: 'Times New Roman', size: 12, bold: true };
  bb1.alignment = { horizontal: 'center', vertical: 'middle' };
  wsBBGH.getRow(1).height = 22.8;

  wsBBGH.mergeCells('B2:F2');
  const bb2 = wsBBGH.getCell('B2');
  bb2.value = 'Độc lập - Tự do - Hạnh Phúc ';
  bb2.font = { name: 'Times New Roman', size: 12, bold: true, underline: true };
  bb2.alignment = { horizontal: 'center', vertical: 'middle' };
  wsBBGH.getRow(2).height = 13.8;

  // 2. Tiêu đề BBGH
  wsBBGH.mergeCells('B3:F3');
  const bb3 = wsBBGH.getCell('B3');
  bb3.value = 'BIÊN BẢN GIAO HÀNG';
  bb3.font = { name: 'Times New Roman', size: 15, bold: true };
  bb3.alignment = { horizontal: 'center', vertical: 'middle' };
  wsBBGH.getRow(3).height = 34.8;

  // 3. Thời gian lập biên bản
  wsBBGH.mergeCells('B4:F4');
  const bb4 = wsBBGH.getCell('B4');
  const dInput = order.deliveryDate || order.orderDate;
  const dObj = dInput ? new Date(dInput) : new Date();
  const dValid = !isNaN(dObj.getTime());
  const dayStr = dValid ? dObj.getDate().toString().padStart(2, '0') : '........';
  const monthStr = dValid ? (dObj.getMonth() + 1).toString().padStart(2, '0') : '.......';
  const yearStr = dValid ? dObj.getFullYear() : new Date().getFullYear();
  bb4.value = `Hôm nay ngày ${dayStr} Tháng ${monthStr} Năm ${yearStr} tại ….................................................chúng tôi gồm có `;
  bb4.font = { name: 'Times New Roman', size: 12, italic: true };
  bb4.alignment = { horizontal: 'left', vertical: 'middle' };
  wsBBGH.getRow(4).height = 26;

  // 4. Bên A (Bên giao hàng)
  wsBBGH.mergeCells('B5:F5');
  const bb5 = wsBBGH.getCell('B5');
  bb5.value = 'Bên A ( Bên giao hàng) : Công ty TNHH NK Nam Khánh ';
  bb5.font = { name: 'Times New Roman', size: 12, bold: true };
  bb5.alignment = { horizontal: 'left', vertical: 'middle' };
  wsBBGH.getRow(5).height = 19.8;

  wsBBGH.mergeCells('B6:F6');
  const bb6 = wsBBGH.getCell('B6');
  bb6.value = 'Địa chỉ ( Address):  Khu X1, Thôn Nguyên Khê  - Xã Phúc Thịnh - TP.Hà Nội';
  bb6.font = { name: 'Times New Roman', size: 14 };
  bb6.alignment = { horizontal: 'left', vertical: 'middle' };
  wsBBGH.getRow(6).height = 18.75;

  const bb7 = wsBBGH.getCell('B7');
  bb7.value = 'MST (Tax code) : 0108910572';
  bb7.font = { name: 'Times New Roman', size: 14 };
  wsBBGH.getRow(7).height = 18.75;

  const bb8 = wsBBGH.getCell('B8');
  bb8.value = 'Số điện thoại ( Tel): 0766.088.886 ';
  bb8.font = { name: 'Times New Roman', size: 14 };
  wsBBGH.getRow(8).height = 18.75;

  wsBBGH.mergeCells('B9:F9');
  const bb9 = wsBBGH.getCell('B9');
  const repName = order.manager?.fullName || (order as any)?.createdBy?.fullName || 'Nguyễn Thị Hằng';
  bb9.value = `Đại diện : Ông /Bà:     ${repName}                    Chức vụ  : Thủ Kho    `;
  bb9.font = { name: 'Times New Roman', size: 14 };
  bb9.alignment = { horizontal: 'left', vertical: 'middle' };
  wsBBGH.getRow(9).height = 18.75;

  // 5. Bên B (Bên nhận hàng)
  const bb10Title = wsBBGH.getCell('B10');
  bb10Title.value = 'Bên B ( Bên nhận hàng) ';
  bb10Title.font = { name: 'Times New Roman', size: 12, bold: true };

  wsBBGH.mergeCells('D10:F10');
  const bb10Val = wsBBGH.getCell('D10');
  bb10Val.value = order.customer?.name || (order.customer as any)?.companyName || 'Khách hàng';
  bb10Val.font = { name: 'Times New Roman', size: 12, bold: true };
  bb10Val.alignment = { horizontal: 'left', vertical: 'middle' };
  wsBBGH.getRow(10).height = 20.4;

  const address = order.deliveryAddress || (order.customer as any)?.shippingAddress || order.customer?.address || '';
  const bb11 = wsBBGH.getCell('B11');
  bb11.value = `Địa chỉ : ${address}`;
  bb11.font = { name: 'Times New Roman', size: 12 };
  wsBBGH.getRow(11).height = 18;

  const contact = order.contactPerson || order.customer?.contactPerson || order.phone || order.customer?.phone || '';
  const bb12 = wsBBGH.getCell('B12');
  bb12.value = contact
    ? `Người đại diện: ${contact}`
    : 'Người đại diện….........................…..............................................................................................................................';
  bb12.font = { name: 'Times New Roman', size: 12 };
  wsBBGH.getRow(12).height = 18;

  const bb13 = wsBBGH.getCell('B13');
  bb13.value = 'Chức vụ: …..............................................................................................…..................................................................';
  bb13.font = { name: 'Times New Roman', size: 12 };
  wsBBGH.getRow(13).height = 18;

  wsBBGH.mergeCells('B14:F14');
  const bb14 = wsBBGH.getCell('B14');
  bb14.value = 'Chúng tôi  thống nhất giao và nhận hàng hóa, với quy cách, chủng loại và số lượng như sau:';
  bb14.font = { name: 'Times New Roman', size: 14 };
  bb14.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  wsBBGH.getRow(14).height = 19.8;

  // 6. Tiêu đề bảng giao nhận hàng hóa
  const bbHeaderRow = wsBBGH.getRow(15);
  bbHeaderRow.height = 33;
  const bbHeaders = [
    { col: 'B', text: 'Stt (Sn)' },
    { col: 'C', text: 'Mã hàng (Item Code)' },
    { col: 'D', text: 'Tên hàng hóa, dịch vụ \n( Name of goods/service)' },
    { col: 'E', text: 'Đơn vị (Unit)' },
    { col: 'F', text: 'Số lượng (Amount) ' }
  ];
  bbHeaders.forEach((h) => {
    const c = wsBBGH.getCell(`${h.col}15`);
    c.value = h.text;
    c.font = { name: 'Times New Roman', size: 12, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = HAIR_BORDER;
  });

  const bbStartRow = 16;
  const bbLastRow = Math.max(bbStartRow, bbStartRow + items.length - 1);

  if (items.length === 0) {
    const r = wsBBGH.getRow(bbStartRow);
    r.height = 22;
    ['B', 'C', 'D', 'E', 'F'].forEach((col) => {
      const c = wsBBGH.getCell(`${col}${bbStartRow}`);
      c.border = HAIR_BORDER;
      c.font = { name: 'Times New Roman', size: 14 };
    });
  } else {
    items.forEach((it, idx) => {
      const rowIdx = bbStartRow + idx;
      const r = wsBBGH.getRow(rowIdx);

      const pName = it.productName || (it.product as any)?.name || '';
      const pCode = it.productCode || (it.product as any)?.code || '';
      const nameLines = pName.split(/\r?\n/).reduce((acc: number, line: string) => acc + Math.max(1, Math.ceil(line.length / 38)), 0);
      const codeLines = Math.ceil(pCode.length / 16);
      const rowLines = Math.max(nameLines, codeLines, 1);
      r.height = rowLines > 1 ? rowLines * 19 + 4 : 22;

      const cB = wsBBGH.getCell(`B${rowIdx}`);
      cB.value = idx + 1;
      cB.alignment = { horizontal: 'center', vertical: 'middle' };
      cB.font = { name: 'Times New Roman', size: 14 };
      cB.border = HAIR_BORDER;

      const cC = wsBBGH.getCell(`C${rowIdx}`);
      cC.value = pCode;
      cC.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cC.font = { name: 'Times New Roman', size: 14 };
      cC.border = HAIR_BORDER;

      const cD = wsBBGH.getCell(`D${rowIdx}`);
      cD.value = pName;
      cD.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      cD.font = { name: 'Times New Roman', size: 14 };
      cD.border = HAIR_BORDER;

      const cE = wsBBGH.getCell(`E${rowIdx}`);
      cE.value = it.unit || (it.product as any)?.unit || 'Cái';
      cE.alignment = { horizontal: 'center', vertical: 'middle' };
      cE.font = { name: 'Times New Roman', size: 14 };
      cE.border = HAIR_BORDER;

      const cF = wsBBGH.getCell(`F${rowIdx}`);
      const qInfo = formatQuantity(it.quantity);
      cF.value = qInfo.value;
      cF.alignment = { horizontal: 'center', vertical: 'middle' };
      cF.font = { name: 'Times New Roman', size: 14 };
      cF.numFmt = qInfo.numFmt;
      cF.border = HAIR_BORDER;
    });
  }

  // 7. Lời cam kết bàn giao
  const confirmRowIdx = bbLastRow + 1;
  wsBBGH.mergeCells(`B${confirmRowIdx}:F${confirmRowIdx}`);
  const cConfirm = wsBBGH.getCell(`B${confirmRowIdx}`);
  cConfirm.value = 'Bên B xác nhận bên A đã giao cho bên B đúng chủng loại và đủ số lượng hàng hóa như trên. Hai bên đồng ý thống nhất ký tên biên bản được lập thành 02 bản có giá trị pháp lý như nhau.';
  cConfirm.font = { name: 'Times New Roman', size: 14 };
  cConfirm.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  ['B', 'C', 'D', 'E', 'F'].forEach((col) => {
    wsBBGH.getCell(`${col}${confirmRowIdx}`).border = { top: { style: 'hair' } };
  });
  wsBBGH.getRow(confirmRowIdx).height = 33.6;

  // 8. Chữ ký trách nhiệm giao nhận chuẩn BIEU_MAU_CRM.xlsx (Dòng 42)
  const sign4Row = confirmRowIdx + 1;
  wsBBGH.getRow(sign4Row).height = 42.6;
  const cSign4 = wsBBGH.getCell(`B${sign4Row}`);
  cSign4.value = 'Người  lập             Trưởng phòng KD                 Bên giao hàng                   Bên nhận hàng       ';
  cSign4.font = { name: 'Times New Roman', size: 14, bold: true };
  cSign4.alignment = { horizontal: 'left', vertical: 'middle' };

  // Khoảng trống ký tay
  wsBBGH.getRow(sign4Row + 1).height = 36;
  wsBBGH.getRow(sign4Row + 2).height = 36;
  wsBBGH.getRow(sign4Row + 3).height = 36;

  // Vùng in giới hạn A1 đến F(cuối trang)
  wsBBGH.pageSetup.printArea = `A1:F${sign4Row + 3}`;

  return wsBBGH;
}

/**
 * Xuất file Excel Biên Bản Giao Hàng riêng biệt đúng chuẩn biểu mẫu BIEU_MAU_CRM.xlsx (Sheet "Lệnh xuất - BBGH")
 */
export async function exportDeliveryNoteToExcel(order: Order, fileName?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NK Nam Khánh CRM';
  workbook.lastModifiedBy = 'NK Nam Khánh CRM';
  workbook.created = new Date();
  workbook.modified = new Date();

  buildDeliveryNoteWorksheet(workbook, order);

  const finalFileName = fileName || `Bien_Ban_Giao_Hang_${order.code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await saveWorkbook(workbook, finalFileName);
}

/**
 * Xuất file Excel Báo Giá đúng chuẩn biểu mẫu BIEU_MAU_CRM.xlsx (Sheet "Báo giá ")
 */
export async function exportQuotationToExcel(quotation: Quotation, fileName?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NK Nam Khánh CRM';
  workbook.lastModifiedBy = 'NK Nam Khánh CRM';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Tên sheet chuẩn biểu mẫu có dấu cách ở cuối
  const ws = workbook.addWorksheet('Báo giá ', {
    views: [{ showGridLines: true, rightToLeft: false }]
  });

  // Thiết lập trang in chuẩn khổ A4 đứng, tự động vừa khít chiều ngang 1 trang A4
  const isSinglePageQuote = (quotation.items?.length || 0) <= 22;
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: isSinglePageQuote ? 1 : 0,
    margins: { left: 0.35, right: 0.35, top: 0.5, bottom: 0.4, header: 0.2, footer: 0.2 }
  };

  // Độ rộng cột chuẩn Báo giá trong BIEU_MAU_CRM.xlsx, tối ưu hiển thị đầy đủ và vừa khít A4
  ws.getColumn('A').width = 1.0;
  ws.getColumn('B').width = 4.8;   // STT
  ws.getColumn('C').width = 16.5;  // Mã hàng - rộng rãi hiển thị đầy đủ
  ws.getColumn('D').width = 48.0;  // Tên hàng hóa, quy cách - rộng rãi hiển thị đầy đủ
  ws.getColumn('E').width = 8.5;   // Đơn vị tính
  ws.getColumn('F').width = 8.5;   // Số lượng
  ws.getColumn('G').width = 13.0;  // Đơn giá
  ws.getColumn('H').width = 16.0;  // Thành tiền

  // 0. Chèn Logo Nam Khánh chuẩn vị trí cột B-C, dòng 1-4 như trong biểu mẫu
  try {
    const logoId = workbook.addImage({
      base64: NK_LOGO_BASE64,
      extension: 'png'
    });
    // Hiển thị logo theo đúng tỷ lệ 1:1 chuẩn xác, không bị dẹp hay méo hình
    ws.addImage(logoId, {
      tl: { col: 1.25, row: 0.20 },
      ext: { width: 86, height: 86 },
      editAs: 'oneCell'
    } as any);
  } catch (e) {
    console.error('Không thể chèn logo vào báo giá:', e);
  }

  // 1. Tên công ty (Dòng 1, merge B1:H1)
  ws.mergeCells('B1:H1');
  const r1 = ws.getCell('B1');
  r1.value = 'CÔNG TY TNHH NK NAM KHÁNH ';
  r1.font = { name: 'Times New Roman', size: 14, bold: true };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 25.8;

  // 2. Địa chỉ công ty (Dòng 2 - ô D2)
  ws.getRow(2).height = 17.4;
  const r2 = ws.getCell('D2');
  r2.value = 'Địa chỉ ( Address):  Khu X1, Thôn Nguyên Khê  - Xã Phúc Thịnh - TP.Hà Nội';
  r2.font = { name: 'Times New Roman', size: 12 };

  // 3. Mã số thuế (Dòng 3 - ô D3)
  ws.getRow(3).height = 17.4;
  const r3 = ws.getCell('D3');
  r3.value = 'Mã số thuế : 0108910572';
  r3.font = { name: 'Times New Roman', size: 12 };

  // 4. Hotline & Email (Dòng 4 - ô D4)
  ws.getRow(4).height = 17.4;
  const r4 = ws.getCell('D4');
  r4.value = 'Số điện thoại : 0766.088.886      - Gmail : phankhanhfj@gmail.com';
  r4.font = { name: 'Times New Roman', size: 12 };

  // 5. Tiêu đề BẢNG BÁO GIÁ (Dòng 5, merge B5:H5 chuẩn mẫu)
  ws.mergeCells('B5:H5');
  const r5 = ws.getCell('B5');
  r5.value = 'BẢNG BÁO GIÁ';
  r5.font = { name: 'Times New Roman', size: 14, bold: true };
  r5.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(5).height = 21.6;

  // 6. Ngày tháng năm (Dòng 6, merge B6:H6, viền gạch dưới medium chuẩn mẫu)
  ws.mergeCells('B6:H6');
  const r6 = ws.getCell('B6');
  r6.value = formatVietnameseDate(quotation.date);
  r6.font = { name: 'Times New Roman', size: 12 };
  r6.alignment = { horizontal: 'center', vertical: 'top' };
  ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
    ws.getCell(`${col}6`).border = { bottom: { style: 'medium' } };
  });
  ws.getRow(6).height = 20.4;

  // 7. Khách hàng
  ws.mergeCells('B7:C7');
  const r7Title = ws.getCell('B7');
  r7Title.value = 'Kính gửi';
  r7Title.font = { name: 'Times New Roman', size: 12 };
  r7Title.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells('D7:H7');
  const r7Val = ws.getCell('D7');
  r7Val.value = quotation.customer?.name || (quotation.customer as any)?.companyName || 'Quý Khách hàng';
  r7Val.font = { name: 'Times New Roman', size: 12, bold: true };
  r7Val.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(7).height = 22.2;

  // 8. Người đại diện
  ws.mergeCells('B8:H8');
  const r8 = ws.getCell('B8');
  const contact = (quotation as any).contactPerson || quotation.customer?.contactPerson || '';
  r8.value = `Người đại diện : ${contact}`;
  r8.font = { name: 'Times New Roman', size: 12 };
  r8.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(8).height = 18;

  // 9. Số điện thoại
  ws.mergeCells('B9:H9');
  const r9 = ws.getCell('B9');
  const phone = (quotation as any).phone || quotation.customer?.phone || '';
  r9.value = `Số điện thoại : ${phone}`;
  r9.font = { name: 'Times New Roman', size: 12 };
  r9.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(9).height = 18;

  // 10. Địa chỉ
  ws.mergeCells('B10:H10');
  const r10 = ws.getCell('B10');
  const address = (quotation as any).deliveryAddress || quotation.customer?.deliveryAddress || quotation.customer?.address || '';
  r10.value = `Địa chỉ : ${address}`;
  r10.font = { name: 'Times New Roman', size: 12 };
  r10.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(10).height = 18;

  // 11. Lời mở đầu
  ws.mergeCells('B11:H11');
  const r11 = ws.getCell('B11');
  r11.value = 'Công ty TNHH NK Nam Khánh xin gửi tới quý Công ty bảng báo giá mặt hàng sau';
  r11.font = { name: 'Times New Roman', size: 12 };
  r11.alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(11).height = 22.2;

  // 12. Loại tiền
  ws.mergeCells('G12:H12');
  const r12 = ws.getCell('G12');
  r12.value = ' Loại tiền: Vnđ';
  r12.font = { name: 'Times New Roman', size: 12 };
  r12.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  ['G', 'H'].forEach((col) => {
    ws.getCell(`${col}12`).border = { bottom: { style: 'hair' } };
  });
  ws.getRow(12).height = 15;

  // 13. Tiêu đề bảng báo giá
  const headerRow = ws.getRow(13);
  headerRow.height = 40.2;
  const headers = [
    { col: 'B', text: 'Stt ' },
    { col: 'C', text: 'Mã hàng ' },
    { col: 'D', text: 'Tên hàng hóa, dịch vụ ' },
    { col: 'E', text: 'Đơn vị tính ' },
    { col: 'F', text: 'Số lượng ' },
    { col: 'G', text: 'Đơn giá ' },
    { col: 'H', text: 'Thành tiền' }
  ];

  headers.forEach((h) => {
    const c = ws.getCell(`${h.col}13`);
    c.value = h.text;
    c.font = { name: 'Times New Roman', size: 12, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = HAIR_BORDER;
  });

  // 14+. Dữ liệu sản phẩm báo giá
  const items = quotation.items || [];
  const startRow = 14;
  const lastItemRow = Math.max(startRow, startRow + items.length - 1);

  if (items.length === 0) {
    const r = ws.getRow(startRow);
    r.height = 18;
    ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
      const cell = ws.getCell(`${col}${startRow}`);
      cell.border = HAIR_BORDER;
      cell.font = { name: 'Times New Roman', size: 14 };
    });
  } else {
    items.forEach((it, idx) => {
      const rowIdx = startRow + idx;
      const r = ws.getRow(rowIdx);

      // Tự động tính chiều cao hàng theo độ dài tên hàng và mã hàng để hiển thị đầy đủ 100% nội dung
      const pName = it.productName || '';
      const pCode = it.productCode || '';
      const nameLines = pName.split(/\r?\n/).reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / 38)), 0);
      const codeLines = Math.ceil(pCode.length / 15);
      const rowLines = Math.max(nameLines, codeLines, 1);
      r.height = rowLines > 1 ? rowLines * 19 + 4 : 22;

      const cB = ws.getCell(`B${rowIdx}`);
      cB.value = idx + 1;
      cB.alignment = { horizontal: 'center', vertical: 'middle' };
      cB.font = { name: 'Times New Roman', size: 13 };
      cB.border = HAIR_BORDER;

      const cC = ws.getCell(`C${rowIdx}`);
      cC.value = pCode;
      cC.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cC.font = { name: 'Times New Roman', size: 13 };
      cC.border = HAIR_BORDER;

      const cD = ws.getCell(`D${rowIdx}`);
      cD.value = pName;
      cD.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      cD.font = { name: 'Times New Roman', size: 13 };
      cD.border = HAIR_BORDER;

      const cE = ws.getCell(`E${rowIdx}`);
      cE.value = it.unit || 'Cái';
      cE.alignment = { horizontal: 'center', vertical: 'middle' };
      cE.font = { name: 'Times New Roman', size: 13 };
      cE.border = HAIR_BORDER;

      const cF = ws.getCell(`F${rowIdx}`);
      const qInfo = formatQuantity(it.quantity);
      cF.value = qInfo.value;
      cF.alignment = { horizontal: 'center', vertical: 'middle' };
      cF.font = { name: 'Times New Roman', size: 13 };
      cF.numFmt = qInfo.numFmt;
      cF.border = HAIR_BORDER;

      const cG = ws.getCell(`G${rowIdx}`);
      cG.value = Number(it.unitPrice) || 0;
      cG.alignment = { horizontal: 'right', vertical: 'middle' };
      cG.font = { name: 'Times New Roman', size: 13 };
      cG.numFmt = NUMBER_FORMAT_CURRENCY;
      cG.border = HAIR_BORDER;

      const cH = ws.getCell(`H${rowIdx}`);
      cH.value = { formula: `+F${rowIdx}*G${rowIdx}`, result: Number(it.quantity) * Number(it.unitPrice) };
      cH.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
      cH.font = { name: 'Times New Roman', size: 13 };
      cH.numFmt = NUMBER_FORMAT_CURRENCY;
      cH.border = HAIR_BORDER;
    });
  }

  // --- Dòng Tổng cộng tiền hàng ---
  const sumRowIdx = lastItemRow + 1;
  ws.getRow(sumRowIdx).height = 18;
  const cSumLabel = ws.getCell(`B${sumRowIdx}`);
  cSumLabel.value = 'Tổng cộng tiền hàng';
  cSumLabel.font = { name: 'Times New Roman', size: 12, bold: true };
  cSumLabel.alignment = { vertical: 'middle' };
  cSumLabel.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' } };

  ['C', 'D', 'E', 'F'].forEach((col) => {
    ws.getCell(`${col}${sumRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };
  });
  ws.getCell(`G${sumRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } };

  const cSumVal = ws.getCell(`H${sumRowIdx}`);
  cSumVal.value = { formula: `SUM(H${startRow}:H${lastItemRow})`, result: Number(quotation.subtotal) };
  cSumVal.font = { name: 'Times New Roman', size: 12, bold: true };
  cSumVal.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  cSumVal.numFmt = NUMBER_FORMAT_CURRENCY;
  cSumVal.border = HAIR_BORDER;

  // --- Dòng Thuế VAT ---
  const vatRowIdx = sumRowIdx + 1;
  ws.getRow(vatRowIdx).height = 18;
  const cVatLabel = ws.getCell(`B${vatRowIdx}`);
  cVatLabel.value = 'Thuế VAT';
  cVatLabel.font = { name: 'Times New Roman', size: 12, bold: true };
  cVatLabel.alignment = { vertical: 'middle' };
  cVatLabel.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' } };

  ws.getCell(`C${vatRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };

  const vatRateDec = (Number(quotation.vatRate) || 8) / 100;
  const cVatRate = ws.getCell(`D${vatRowIdx}`);
  cVatRate.value = vatRateDec;
  cVatRate.font = { name: 'Times New Roman', size: 12, bold: true };
  cVatRate.alignment = { horizontal: 'left', vertical: 'middle' };
  cVatRate.numFmt = '0%';
  cVatRate.border = { top: { style: 'hair' }, bottom: { style: 'hair' } };

  ['E', 'F'].forEach((col) => {
    ws.getCell(`${col}${vatRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };
  });
  ws.getCell(`G${vatRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } };

  const cVatVal = ws.getCell(`H${vatRowIdx}`);
  cVatVal.value = { formula: `+H${sumRowIdx}*D${vatRowIdx}`, result: Number(quotation.vatAmount) };
  cVatVal.font = { name: 'Times New Roman', size: 12, bold: true };
  cVatVal.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  cVatVal.numFmt = NUMBER_FORMAT_CURRENCY;
  cVatVal.border = HAIR_BORDER;

  // --- Dòng Tổng tiền thanh toán ---
  const totalRowIdx = vatRowIdx + 1;
  ws.getRow(totalRowIdx).height = 18;
  const cTotalLabel = ws.getCell(`B${totalRowIdx}`);
  cTotalLabel.value = 'Tổng tiền thanh toán ';
  cTotalLabel.font = { name: 'Times New Roman', size: 12, bold: true };
  cTotalLabel.alignment = { vertical: 'middle' };
  cTotalLabel.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' } };

  ['C', 'D', 'E', 'F'].forEach((col) => {
    ws.getCell(`${col}${totalRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };
  });
  ws.getCell(`G${totalRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } };

  const cTotalVal = ws.getCell(`H${totalRowIdx}`);
  cTotalVal.value = { formula: `+H${vatRowIdx}+H${sumRowIdx}`, result: Number(quotation.totalAmount) };
  cTotalVal.font = { name: 'Times New Roman', size: 12, bold: true };
  cTotalVal.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  cTotalVal.numFmt = NUMBER_FORMAT_CURRENCY;
  cTotalVal.border = HAIR_BORDER;

  // --- Dòng Bằng chữ ---
  const wordsRowIdx = totalRowIdx + 1;
  ws.getRow(wordsRowIdx).height = 20;
  const cWordsLabel = ws.getCell(`B${wordsRowIdx}`);
  cWordsLabel.value = 'Bằng chữ : ';
  cWordsLabel.font = { name: 'Times New Roman', size: 12, bold: true };
  cWordsLabel.alignment = { vertical: 'middle' };
  cWordsLabel.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' } };

  ws.getCell(`C${wordsRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };

  ws.mergeCells(`D${wordsRowIdx}:H${wordsRowIdx}`);
  const cWordsVal = ws.getCell(`D${wordsRowIdx}`);
  cWordsVal.value = numberToWords(quotation.totalAmount);
  cWordsVal.font = { name: 'Times New Roman', size: 12, bold: true };
  cWordsVal.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  ['D', 'E', 'F', 'G'].forEach((col) => {
    ws.getCell(`${col}${wordsRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' } };
  });
  ws.getCell(`H${wordsRowIdx}`).border = { top: { style: 'hair' }, bottom: { style: 'hair' }, right: { style: 'hair' } };

  // --- Ghi chú chuẩn biểu mẫu Báo giá ---
  // --- Ghi chú / Đường kẻ ngăn cách chuẩn Bao_Gia_BG-2026-0002_2026-10-17.xlsx ---
  let nextRowIdx = wordsRowIdx + 1;
  const customNotes = quotation.notes && quotation.notes.trim();

  if (customNotes) {
    ws.mergeCells(`B${nextRowIdx}:C${nextRowIdx}`);
    const cNoteTitle = ws.getCell(`B${nextRowIdx}`);
    cNoteTitle.value = 'Ghi chú:';
    cNoteTitle.font = { name: 'Times New Roman', size: 11, bold: true };
    cNoteTitle.alignment = { horizontal: 'left' };
    ws.getCell(`B${nextRowIdx}`).border = { top: { style: 'hair' } };
    ws.getCell(`C${nextRowIdx}`).border = { top: { style: 'hair' } };

    nextRowIdx++;
    ws.mergeCells(`B${nextRowIdx}:H${nextRowIdx}`);
    const cell = ws.getCell(`B${nextRowIdx}`);
    cell.value = `* ${customNotes}`;
    cell.font = { name: 'Times New Roman', size: 11 };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(nextRowIdx).height = 19.05;
  } else {
    // Trường hợp không có ghi chú riêng: tạo 1 dòng trống với đường kẻ viền top hair B:C giống hệt file mẫu
    ws.getRow(nextRowIdx).height = 16.8;
    ws.mergeCells(`B${nextRowIdx}:C${nextRowIdx}`);
    ws.getCell(`B${nextRowIdx}`).border = { top: { style: 'hair' } };
    ws.getCell(`C${nextRowIdx}`).border = { top: { style: 'hair' } };
  }

  // --- Chữ ký 2 bên chuẩn Bao_Gia_BG-2026-0002_2026-10-17.xlsx ---
  const signTitleRow = nextRowIdx + 1;
  ws.getRow(signTitleRow).height = 36;

  // Bên trái: Xác nhận bên bán hàng
  ws.mergeCells(`B${signTitleRow}:D${signTitleRow}`);
  const cSignSeller = ws.getCell(`B${signTitleRow}`);
  cSignSeller.value = 'Xác nhận bên bán hàng';
  cSignSeller.font = { name: 'Times New Roman', size: 13, bold: true };
  cSignSeller.alignment = { horizontal: 'center', vertical: 'middle' };

  // Bên phải: Xác nhận bên mua hàng 
  ws.mergeCells(`F${signTitleRow}:H${signTitleRow}`);
  const cSignBuyer = ws.getCell(`F${signTitleRow}`);
  cSignBuyer.value = 'Xác nhận bên mua hàng ';
  cSignBuyer.font = { name: 'Times New Roman', size: 13, bold: true };
  cSignBuyer.alignment = { horizontal: 'center', vertical: 'middle' };

  // Khoảng trống ký tên chuẩn biểu mẫu (3 dòng trống)
  ws.getRow(signTitleRow + 1).height = 36;
  ws.getRow(signTitleRow + 2).height = 36;
  ws.getRow(signTitleRow + 3).height = 36;

  // Vùng in giới hạn chính xác A1 đến H(cuối trang)
  ws.pageSetup.printArea = `A1:H${signTitleRow + 3}`;

  const finalFileName = fileName || `Bao_Gia_${quotation.code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await saveWorkbook(workbook, finalFileName);
}

/**
 * Xuất danh sách toàn bộ Đơn Hàng ra file Excel (.xlsx) chuẩn chỉnh
 */
export async function exportOrdersListToExcel(orders: Order[], fileName?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NK Nam Khánh CRM';
  const ws = workbook.addWorksheet('Danh sách Đơn hàng', {
    views: [{ showGridLines: true }]
  });

  const headers = [
    { key: 'stt', header: 'STT', width: 6 },
    { key: 'code', header: 'Mã đơn hàng', width: 16 },
    { key: 'customerName', header: 'Khách hàng', width: 32 },
    { key: 'customerCode', header: 'Mã khách', width: 14 },
    { key: 'phone', header: 'Số điện thoại', width: 15 },
    { key: 'contactPerson', header: 'Người nhận', width: 20 },
    { key: 'deliveryAddress', header: 'Địa chỉ giao hàng', width: 40 },
    { key: 'orderDate', header: 'Ngày đặt', width: 14 },
    { key: 'deliveryDate', header: 'Ngày hẹn giao', width: 14 },
    { key: 'deliveryStatus', header: 'Trạng thái giao', width: 16 },
    { key: 'paymentStatus', header: 'Thanh toán', width: 16 },
    { key: 'subtotal', header: 'Cộng tiền hàng', width: 16 },
    { key: 'vatRate', header: 'Thuế VAT (%)', width: 12 },
    { key: 'vatAmount', header: 'Tiền thuế VAT', width: 15 },
    { key: 'totalAmount', header: 'Tổng tiền đơn (VNĐ)', width: 20 },
    { key: 'paidAmount', header: 'Thực thu (VNĐ)', width: 18 },
    { key: 'remainingAmount', header: 'Còn phải thu (VNĐ)', width: 18 },
    { key: 'manager', header: 'Người phụ trách', width: 20 },
    { key: 'notes', header: 'Ghi chú', width: 30 }
  ];

  ws.columns = headers;

  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE53935' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  const getDeliveryText = (st: string) => {
    switch (st) {
      case 'DELIVERED': return 'Đã giao hàng';
      case 'DELIVERING': return 'Đang giao';
      case 'PARTIAL': return 'Giao một phần';
      case 'CANCELLED': return 'Đã hủy đơn';
      default: return 'Chờ xuất kho';
    }
  };

  const getPaymentText = (st: string) => {
    switch (st) {
      case 'PAID': return 'Đã thanh toán';
      case 'PARTIAL_PAID': return 'Thanh toán 1 phần';
      default: return 'Chưa thanh toán';
    }
  };

  orders.forEach((o, idx) => {
    const row = ws.addRow({
      stt: idx + 1,
      code: o.code,
      customerName: o.customer?.name || '',
      customerCode: o.customer?.code || '',
      phone: o.phone || o.customer?.phone || '',
      contactPerson: o.contactPerson || '',
      deliveryAddress: o.deliveryAddress || '',
      orderDate: new Date(o.orderDate).toLocaleDateString('vi-VN'),
      deliveryDate: o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('vi-VN') : '',
      deliveryStatus: getDeliveryText(o.deliveryStatus),
      paymentStatus: getPaymentText(o.paymentStatus),
      subtotal: Number(o.subtotal) || 0,
      vatRate: o.vatRate || 8,
      vatAmount: Number(o.vatAmount) || 0,
      totalAmount: Number(o.totalAmount) || 0,
      paidAmount: Number(o.paidAmount) || 0,
      remainingAmount: Number(o.remainingAmount) || 0,
      manager: o.manager?.fullName || '',
      notes: o.notes || ''
    });

    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Times New Roman', size: 11 };
      cell.border = THIN_BORDER;
      if ([12, 14, 15, 16, 17].includes(colNum)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if ([1, 2, 4, 5, 8, 9, 10, 11, 13].includes(colNum)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  const finalFileName = fileName || `Danh_Sach_Don_Hang_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await saveWorkbook(workbook, finalFileName);
}

/**
 * Xuất danh sách toàn bộ Báo Giá ra file Excel (.xlsx) chuẩn chỉnh
 */
export async function exportQuotationsListToExcel(quotations: Quotation[], fileName?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NK Nam Khánh CRM';
  const ws = workbook.addWorksheet('Danh sách Báo giá', {
    views: [{ showGridLines: true }]
  });

  const headers = [
    { key: 'stt', header: 'STT', width: 6 },
    { key: 'code', header: 'Mã báo giá', width: 16 },
    { key: 'customerName', header: 'Khách hàng', width: 32 },
    { key: 'customerCode', header: 'Mã khách', width: 14 },
    { key: 'phone', header: 'Số điện thoại', width: 15 },
    { key: 'contactPerson', header: 'Người liên hệ', width: 20 },
    { key: 'date', header: 'Ngày báo giá', width: 14 },
    { key: 'validUntil', header: 'Hiệu lực đến', width: 14 },
    { key: 'status', header: 'Trạng thái', width: 16 },
    { key: 'subtotal', header: 'Cộng tiền hàng', width: 16 },
    { key: 'vatRate', header: 'Thuế VAT (%)', width: 12 },
    { key: 'vatAmount', header: 'Tiền thuế VAT', width: 15 },
    { key: 'totalAmount', header: 'Tổng tiền (VNĐ)', width: 20 },
    { key: 'manager', header: 'Người phụ trách', width: 20 },
    { key: 'notes', header: 'Ghi chú', width: 30 }
  ];

  ws.columns = headers;

  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE53935' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  const getStatusText = (st: string) => {
    switch (st) {
      case 'DRAFT': return 'Bản thảo';
      case 'SENT': return 'Đã gửi khách';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'ORDERED': return 'Đã lên đơn';
      case 'CANCELLED': return 'Đã hủy';
      default: return st;
    }
  };

  quotations.forEach((q, idx) => {
    const row = ws.addRow({
      stt: idx + 1,
      code: q.code,
      customerName: q.customer?.name || '',
      customerCode: q.customer?.code || '',
      phone: q.customer?.phone || '',
      contactPerson: q.customer?.contactPerson || '',
      date: new Date(q.date).toLocaleDateString('vi-VN'),
      validUntil: q.validUntil ? new Date(q.validUntil).toLocaleDateString('vi-VN') : '',
      status: getStatusText(q.status),
      subtotal: Number(q.subtotal) || 0,
      vatRate: q.vatRate || 8,
      vatAmount: Number(q.vatAmount) || 0,
      totalAmount: Number(q.totalAmount) || 0,
      manager: q.manager?.fullName || '',
      notes: q.notes || ''
    });

    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Times New Roman', size: 11 };
      cell.border = THIN_BORDER;
      if ([10, 12, 13].includes(colNum)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if ([1, 2, 4, 5, 7, 8, 9, 11].includes(colNum)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  const finalFileName = fileName || `Danh_Sach_Bao_Gia_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await saveWorkbook(workbook, finalFileName);
}

// =========================================================================
// PHIẾU THU TIỀN (CHUẨN BIỂU MẪU BIEU_MAU_CRM.xlsx - MẪU SỐ 01 - TT)
// =========================================================================

/**
 * Xây dựng sheet Phiếu thu chuẩn mẫu số 01 - TT (Kèm theo TT 99/2025/TT-BTC)
 * Đúng từng ô, kích thước cột/dòng, căn lề và định dạng như file BIEU_MAU_CRM.xlsx
 */
export function buildReceiptVoucherSheet(workbook: ExcelJS.Workbook, voucher: ReceiptVoucher): ExcelJS.Worksheet {
  const ws = workbook.addWorksheet('Phiếu thu', {
    views: [{ showGridLines: true }]
  });

  // Thiết lập 25 cột chuẩn BIEU_MAU_CRM.xlsx với độ rộng 8pt mỗi cột
  for (let c = 1; c <= 25; c++) {
    ws.getColumn(c).width = 8;
  }

  // Cấu hình trang in chuẩn khổ A4 đứng, tự động co giãn vừa vặn 1 trang A4 khi in
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
  };

  // Chiều cao dòng chuẩn mẫu BIEU_MAU_CRM.xlsx
  ws.getRow(1).height = 15.75;
  ws.getRow(2).height = 17.4;
  ws.getRow(3).height = 15.75;
  ws.getRow(4).height = 15.75;
  ws.getRow(5).height = 15.75;
  ws.getRow(6).height = 15.75;
  ws.getRow(7).height = 15.75;
  ws.getRow(8).height = 15;
  ws.getRow(9).height = 15.75;
  ws.getRow(10).height = 15.75;
  ws.getRow(11).height = 15.75;
  ws.getRow(12).height = 15.75;
  ws.getRow(13).height = 15.75;
  ws.getRow(14).height = 15.75;
  ws.getRow(15).height = 15;
  ws.getRow(16).height = 15.75;
  ws.getRow(17).height = 15.75;
  ws.getRow(21).height = 20;

  // Hợp nhất ô (Merge cells) chuẩn mẫu
  ws.mergeCells('A1:G1');
  ws.mergeCells('A2:G2');
  ws.mergeCells('I1:O1');
  ws.mergeCells('I2:O3');
  ws.mergeCells('C4:J6');
  ws.mergeCells('K5:L5');
  ws.mergeCells('M5:O5');
  ws.mergeCells('K6:L6');
  ws.mergeCells('M6:O6');
  ws.mergeCells('C7:J7');
  ws.mergeCells('K7:L7');
  ws.mergeCells('M7:O7');
  ws.mergeCells('D9:O9');
  ws.mergeCells('A10:B10');
  ws.mergeCells('C10:O10');
  ws.mergeCells('C11:O11');
  ws.mergeCells('C12:O12');
  ws.mergeCells('A13:B13');
  ws.mergeCells('C13:O13');
  ws.mergeCells('D14:O14');

  // Khối chữ ký
  ws.mergeCells('A16:C16');
  ws.mergeCells('D16:F16');
  ws.mergeCells('G16:I16');
  ws.mergeCells('J16:L16');
  ws.mergeCells('M16:O16');

  ws.mergeCells('A17:C17');
  ws.mergeCells('D17:F17');
  ws.mergeCells('G17:I17');
  ws.mergeCells('J17:L17');
  ws.mergeCells('M17:O17');

  ws.mergeCells('A21:C21');
  ws.mergeCells('D21:F21');
  ws.mergeCells('G21:I21');
  ws.mergeCells('J21:L21');
  ws.mergeCells('M21:O21');

  // Điền dữ liệu và căn chỉnh
  const cellA1 = ws.getCell('A1');
  cellA1.value = 'CÔNG TY TNHH NK NAM KHÁNH';
  cellA1.font = { name: 'Times New Roman', size: 11 };
  cellA1.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

  const cellA2 = ws.getCell('A2');
  cellA2.value = 'X1 Thôn Toàn Thắng, Xã Phúc Thịnh , TP.Hà Nội';
  cellA2.font = { name: 'Times New Roman', size: 11 };
  cellA2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const cellI1 = ws.getCell('I1');
  cellI1.value = 'Mẫu số 01 - TT';
  cellI1.font = { name: 'Times New Roman', size: 12, bold: true };
  cellI1.alignment = { horizontal: 'center', vertical: 'middle' };

  const cellI2 = ws.getCell('I2');
  cellI2.value = '(Kèm theo Thông tư số 99/2025/TT-BTC ngày 27 \ntháng 10 năm 2025 của Bộ trưởng Bộ Tài chính)';
  cellI2.font = { name: 'Times New Roman', size: 10, italic: true };
  cellI2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const cellC4 = ws.getCell('C4');
  cellC4.value = 'PHIẾU THU';
  cellC4.font = { name: 'Times New Roman', size: 16, bold: true };
  cellC4.alignment = { horizontal: 'center', vertical: 'middle' };

  const cellK5 = ws.getCell('K5');
  cellK5.value = 'Số:';
  cellK5.font = { name: 'Times New Roman', size: 12 };
  cellK5.alignment = { horizontal: 'left', vertical: 'top' };

  const cellM5 = ws.getCell('M5');
  cellM5.value = voucher.code;
  cellM5.font = { name: 'Times New Roman', size: 12 };
  cellM5.alignment = { horizontal: 'left', vertical: 'top' };

  const cellK6 = ws.getCell('K6');
  cellK6.value = 'Nợ:';
  cellK6.font = { name: 'Times New Roman', size: 12 };
  cellK6.alignment = { horizontal: 'left', vertical: 'top' };

  const cellM6 = ws.getCell('M6');
  cellM6.value = voucher.paymentMethod === 'BANK_TRANSFER' ? '1121' : '1111';
  cellM6.font = { name: 'Times New Roman', size: 12 };
  cellM6.alignment = { horizontal: 'left', vertical: 'top' };

  const cellC7 = ws.getCell('C7');
  cellC7.value = formatVietnameseDate(voucher.voucherDate);
  cellC7.font = { name: 'Times New Roman', size: 12, bold: true, italic: true };
  cellC7.alignment = { horizontal: 'center', vertical: 'top' };

  const cellK7 = ws.getCell('K7');
  cellK7.value = 'Có:';
  cellK7.font = { name: 'Times New Roman', size: 12 };
  cellK7.alignment = { horizontal: 'left', vertical: 'top' };

  const cellM7 = ws.getCell('M7');
  cellM7.value = '131';
  cellM7.font = { name: 'Times New Roman', size: 12 };
  cellM7.alignment = { horizontal: 'left', vertical: 'top' };

  const cellA9 = ws.getCell('A9');
  cellA9.value = 'Họ tên người nộp tiền:';
  cellA9.font = { name: 'Times New Roman', size: 12 };
  cellA9.alignment = { vertical: 'top' };

  const cellD9 = ws.getCell('D9');
  cellD9.value = voucher.payer || '';
  cellD9.font = { name: 'Times New Roman', size: 12 };
  cellD9.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellA10 = ws.getCell('A10');
  cellA10.value = 'Địa chỉ:';
  cellA10.font = { name: 'Times New Roman', size: 12 };
  cellA10.alignment = { horizontal: 'left', vertical: 'top' };

  const cellC10 = ws.getCell('C10');
  cellC10.value = voucher.address || '';
  cellC10.font = { name: 'Times New Roman', size: 12 };
  cellC10.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellA11 = ws.getCell('A11');
  cellA11.value = 'Lý do nộp:';
  cellA11.font = { name: 'Times New Roman', size: 12 };
  cellA11.alignment = { vertical: 'top' };

  const cellC11 = ws.getCell('C11');
  cellC11.value = voucher.reason || '';
  cellC11.font = { name: 'Times New Roman', size: 12 };
  cellC11.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellA12 = ws.getCell('A12');
  cellA12.value = 'Số tiền:';
  cellA12.font = { name: 'Times New Roman', size: 12 };
  cellA12.alignment = { horizontal: 'left', vertical: 'top' };

  const cellC12 = ws.getCell('C12');
  cellC12.value = `${Number(voucher.amount || 0).toLocaleString('vi-VN')} VND`;
  cellC12.font = { name: 'Times New Roman', size: 12, bold: true };
  cellC12.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellA13 = ws.getCell('A13');
  cellA13.value = 'Viết bằng chữ:';
  cellA13.font = { name: 'Times New Roman', size: 12 };
  cellA13.alignment = { horizontal: 'left', vertical: 'top' };

  const amountWords = numberToWords(voucher.amount);
  const cellC13 = ws.getCell('C13');
  cellC13.value = amountWords ? amountWords.charAt(0).toUpperCase() + amountWords.slice(1) : '';
  cellC13.font = { name: 'Times New Roman', size: 12, bold: true, italic: true };
  cellC13.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellA14 = ws.getCell('A14');
  cellA14.value = 'Kèm theo số chứng từ : ';
  cellA14.font = { name: 'Times New Roman', size: 12 };
  cellA14.alignment = { vertical: 'top' };

  const cellD14 = ws.getCell('D14');
  cellD14.value = voucher.invoiceNumber || '';
  cellD14.font = { name: 'Times New Roman', size: 12 };
  cellD14.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  // Khối chữ ký 5 bên
  const signHeaders = [
    { cell: 'A16', text: 'Tổng Giám đốc' },
    { cell: 'D16', text: 'Kế toán trưởng' },
    { cell: 'G16', text: 'Người nộp tiền' },
    { cell: 'J16', text: 'Người lập phiếu' },
    { cell: 'M16', text: 'Thủ quỹ' }
  ];

  signHeaders.forEach(sh => {
    const c = ws.getCell(sh.cell);
    c.value = sh.text;
    c.font = { name: 'Times New Roman', size: 12, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const signSubtitles = [
    { cell: 'A17', text: '(Ký, họ tên, đóng dấu)' },
    { cell: 'D17', text: '(Ký, họ tên)' },
    { cell: 'G17', text: '(Ký, họ tên)' },
    { cell: 'J17', text: '(Ký, họ tên)' },
    { cell: 'M17', text: '(Ký, họ tên)' }
  ];

  signSubtitles.forEach(st => {
    const c = ws.getCell(st.cell);
    c.value = st.text;
    c.font = { name: 'Times New Roman', size: 11, italic: true };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  if (voucher.createdBy?.fullName) {
    const c = ws.getCell('J21');
    c.value = voucher.createdBy.fullName;
    c.font = { name: 'Times New Roman', size: 11, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'top' };
  }

  return ws;
}

// =========================================================================
// PHIẾU CHI TIỀN (CHUẨN BIỂU MẪU BIEU_MAU_CRM.xlsx - MẪU SỐ 02 - TT)
// =========================================================================

/**
 * Xây dựng sheet Phiếu chi chuẩn mẫu số 02 - TT (Kèm theo TT 99/2025/TT-BTC)
 * Đúng từng ô, kích thước cột/dòng, căn lề và định dạng như file BIEU_MAU_CRM.xlsx
 */
export function buildPaymentVoucherSheet(workbook: ExcelJS.Workbook, voucher: PaymentVoucher): ExcelJS.Worksheet {
  const ws = workbook.addWorksheet('Phiếu chi', {
    views: [{ showGridLines: true }]
  });

  // Thiết lập 20 cột chuẩn BIEU_MAU_CRM.xlsx với độ rộng 6.44pt mỗi cột
  for (let c = 1; c <= 20; c++) {
    ws.getColumn(c).width = 6.44;
  }

  // Cấu hình trang in chuẩn khổ A4 đứng, tự động co giãn vừa vặn 1 trang A4 khi in
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
  };

  // Chiều cao dòng chuẩn mẫu BIEU_MAU_CRM.xlsx
  ws.getRow(1).height = 15.75;
  ws.getRow(2).height = 15.75;
  ws.getRow(3).height = 14.4;
  ws.getRow(4).height = 15;
  ws.getRow(5).height = 20.25;
  ws.getRow(6).height = 20.25;
  ws.getRow(7).height = 15.75;
  ws.getRow(8).height = 15.75;
  ws.getRow(9).height = 15;
  ws.getRow(10).height = 15.75;
  ws.getRow(11).height = 15.75;
  ws.getRow(12).height = 15.75;
  ws.getRow(13).height = 15.75;
  ws.getRow(14).height = 15.75;
  ws.getRow(15).height = 15.75;
  ws.getRow(16).height = 15;
  ws.getRow(17).height = 15.75;
  ws.getRow(18).height = 15.75;
  ws.getRow(22).height = 20;

  // Hợp nhất ô (Merge cells) chuẩn mẫu
  ws.mergeCells('A1:H1');
  ws.mergeCells('A2:H2');
  ws.mergeCells('L1:T1');
  ws.mergeCells('L2:T3');
  ws.mergeCells('E5:M5');
  ws.mergeCells('Q6:R6');
  ws.mergeCells('E7:M7');
  ws.mergeCells('Q7:R7');
  ws.mergeCells('Q8:R8');
  ws.mergeCells('A10:C10');
  ws.mergeCells('D10:T10');
  ws.mergeCells('A11:C11');
  ws.mergeCells('D11:T11');
  ws.mergeCells('A12:B12');
  ws.mergeCells('C12:T12');
  ws.mergeCells('A13:B13');
  ws.mergeCells('C13:T13');
  ws.mergeCells('A14:B14');
  ws.mergeCells('C14:T14');
  ws.mergeCells('A15:D15');
  ws.mergeCells('E15:T15');

  // Khối chữ ký 5 bên
  ws.mergeCells('A17:D17');
  ws.mergeCells('F17:H17');
  ws.mergeCells('J17:K17');
  ws.mergeCells('M17:O17');
  ws.mergeCells('P17:R17');

  ws.mergeCells('A18:D18');
  ws.mergeCells('F18:H18');
  ws.mergeCells('J18:K18');
  ws.mergeCells('M18:O18');
  ws.mergeCells('P18:R18');

  ws.mergeCells('A22:D22');
  ws.mergeCells('F22:H22');
  ws.mergeCells('J22:K22');
  ws.mergeCells('M22:O22');
  ws.mergeCells('P22:R22');

  // Điền dữ liệu và căn chỉnh
  const cellA1 = ws.getCell('A1');
  cellA1.value = 'CÔNG TY TNHH NK NAM KHÁNH  ';
  cellA1.font = { name: 'Times New Roman', size: 11 };
  cellA1.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

  const cellA2 = ws.getCell('A2');
  cellA2.value = 'X1 Thôn Toàn thắng , Xã Phúc Thịnh, TP. Hà Nội';
  cellA2.font = { name: 'Times New Roman', size: 11 };
  cellA2.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

  const cellL1 = ws.getCell('L1');
  cellL1.value = 'Mẫu số 02 - TT';
  cellL1.font = { name: 'Times New Roman', size: 12, bold: true };
  cellL1.alignment = { horizontal: 'center', vertical: 'middle' };

  const cellL2 = ws.getCell('L2');
  cellL2.value = '(Kèm theo Thông tư số 99/2025/TT-BTC ngày 27 \ntháng 10 năm 2025 của Bộ trưởng Bộ Tài chính)';
  cellL2.font = { name: 'Times New Roman', size: 10, italic: true };
  cellL2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const cellE5 = ws.getCell('E5');
  cellE5.value = 'PHIẾU CHI';
  cellE5.font = { name: 'Times New Roman', size: 16, bold: true };
  cellE5.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const cellP6 = ws.getCell('P6');
  cellP6.value = 'Số:';
  cellP6.font = { name: 'Times New Roman', size: 12 };
  cellP6.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };

  const cellQ6 = ws.getCell('Q6');
  cellQ6.value = voucher.code;
  cellQ6.font = { name: 'Times New Roman', size: 12 };
  cellQ6.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellE7 = ws.getCell('E7');
  cellE7.value = formatVietnameseDate(voucher.voucherDate);
  cellE7.font = { name: 'Times New Roman', size: 12, bold: true, italic: true };
  cellE7.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

  const cellP7 = ws.getCell('P7');
  cellP7.value = 'Nợ:';
  cellP7.font = { name: 'Times New Roman', size: 12 };
  cellP7.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };

  const cellQ7 = ws.getCell('Q7');
  cellQ7.value = voucher.category?.code || '141';
  cellQ7.font = { name: 'Times New Roman', size: 12 };
  cellQ7.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellP8 = ws.getCell('P8');
  cellP8.value = 'Có:';
  cellP8.font = { name: 'Times New Roman', size: 12 };
  cellP8.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };

  const cellQ8 = ws.getCell('Q8');
  cellQ8.value = voucher.paymentMethod === 'BANK_TRANSFER' ? '1121' : '1111';
  cellQ8.font = { name: 'Times New Roman', size: 12 };
  cellQ8.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellA10 = ws.getCell('A10');
  cellA10.value = 'Họ và tên người nhận tiền:';
  cellA10.font = { name: 'Times New Roman', size: 12 };
  cellA10.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellD10 = ws.getCell('D10');
  cellD10.value = voucher.recipient || '';
  cellD10.font = { name: 'Times New Roman', size: 12 };
  cellD10.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellA11 = ws.getCell('A11');
  cellA11.value = 'Địa chỉ:';
  cellA11.font = { name: 'Times New Roman', size: 12 };
  cellA11.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellD11 = ws.getCell('D11');
  cellD11.value = voucher.address || '';
  cellD11.font = { name: 'Times New Roman', size: 12 };
  cellD11.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellA12 = ws.getCell('A12');
  cellA12.value = 'Lý do chi:';
  cellA12.font = { name: 'Times New Roman', size: 12 };
  cellA12.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellC12 = ws.getCell('C12');
  cellC12.value = voucher.reason || '';
  cellC12.font = { name: 'Times New Roman', size: 12 };
  cellC12.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellA13 = ws.getCell('A13');
  cellA13.value = 'Số tiền:';
  cellA13.font = { name: 'Times New Roman', size: 12 };
  cellA13.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellC13 = ws.getCell('C13');
  cellC13.value = `${Number(voucher.amount || 0).toLocaleString('vi-VN')} VND`;
  cellC13.font = { name: 'Times New Roman', size: 12, bold: true };
  cellC13.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellA14 = ws.getCell('A14');
  cellA14.value = 'Viết bằng chữ:';
  cellA14.font = { name: 'Times New Roman', size: 12 };
  cellA14.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const amountWords = numberToWords(voucher.amount);
  const cellC14 = ws.getCell('C14');
  cellC14.value = amountWords ? amountWords.charAt(0).toUpperCase() + amountWords.slice(1) : '';
  cellC14.font = { name: 'Times New Roman', size: 12, bold: true, italic: true };
  cellC14.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

  const cellA15 = ws.getCell('A15');
  cellA15.value = 'Kèm theo chứng từ số';
  cellA15.font = { name: 'Times New Roman', size: 12 };
  cellA15.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  const cellE15 = ws.getCell('E15');
  cellE15.value = voucher.invoiceNumber || '';
  cellE15.font = { name: 'Times New Roman', size: 12 };
  cellE15.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  // Khối chữ ký 5 bên
  const signHeaders = [
    { cell: 'A17', text: 'Tổng Giám đốc' },
    { cell: 'F17', text: 'Kế toán trưởng' },
    { cell: 'J17', text: 'Thủ quỹ' },
    { cell: 'M17', text: 'Người lập phiếu' },
    { cell: 'P17', text: 'Người nhận tiền' }
  ];

  signHeaders.forEach(sh => {
    const c = ws.getCell(sh.cell);
    c.value = sh.text;
    c.font = { name: 'Times New Roman', size: 12, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const signSubtitles = [
    { cell: 'A18', text: '(Ký, họ tên, đóng dấu)' },
    { cell: 'F18', text: '(Ký, họ tên)' },
    { cell: 'J18', text: '(Ký, họ tên)' },
    { cell: 'M18', text: '(Ký, họ tên)' },
    { cell: 'P18', text: '(Ký, họ tên)' }
  ];

  signSubtitles.forEach(st => {
    const c = ws.getCell(st.cell);
    c.value = st.text;
    c.font = { name: 'Times New Roman', size: 11, italic: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  if (voucher.createdBy?.fullName) {
    const c = ws.getCell('M22');
    c.value = voucher.createdBy.fullName;
    c.font = { name: 'Times New Roman', size: 11, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'top' };
  }

  return ws;
}

/**
 * Xuất file Excel Phiếu Thu đúng chuẩn mẫu số 01 - TT từ BIEU_MAU_CRM.xlsx
 */
export async function exportReceiptVoucherToExcel(voucher: ReceiptVoucher, fileName?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NK Nam Khánh CRM';
  workbook.lastModifiedBy = 'NK Nam Khánh CRM';
  workbook.created = new Date();
  workbook.modified = new Date();

  buildReceiptVoucherSheet(workbook, voucher);

  const finalFileName = fileName || `${voucher.code || 'Phieu_Thu'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await saveWorkbook(workbook, finalFileName);
}

/**
 * Xuất file Excel Phiếu Chi đúng chuẩn mẫu số 02 - TT từ BIEU_MAU_CRM.xlsx
 */
export async function exportPaymentVoucherToExcel(voucher: PaymentVoucher, fileName?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NK Nam Khánh CRM';
  workbook.lastModifiedBy = 'NK Nam Khánh CRM';
  workbook.created = new Date();
  workbook.modified = new Date();

  buildPaymentVoucherSheet(workbook, voucher);

  const finalFileName = fileName || `${voucher.code || 'Phieu_Chi'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await saveWorkbook(workbook, finalFileName);
}

/**
 * Xuất file Excel phiếu tài chính (Phiếu thu hoặc Phiếu chi) tự động theo type
 */
export async function exportVoucherToExcel(
  voucher: ReceiptVoucher | PaymentVoucher,
  type: 'RECEIPT' | 'PAYMENT',
  fileName?: string
) {
  if (type === 'RECEIPT') {
    return exportReceiptVoucherToExcel(voucher as ReceiptVoucher, fileName);
  } else {
    return exportPaymentVoucherToExcel(voucher as PaymentVoucher, fileName);
  }
}

/**
 * Xuất danh sách toàn bộ Phiếu Thu ra file Excel (.xlsx) chuẩn thương hiệu NK Nam Khánh
 */
export async function exportReceiptsListToExcel(receipts: ReceiptVoucher[], fileName?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NK Nam Khánh CRM';
  const ws = workbook.addWorksheet('Danh sách Phiếu thu', {
    views: [{ showGridLines: true }]
  });

  const headers = [
    { key: 'stt', header: 'STT', width: 6 },
    { key: 'code', header: 'Số phiếu thu', width: 16 },
    { key: 'voucherDate', header: 'Ngày thu', width: 14 },
    { key: 'payer', header: 'Người nộp tiền', width: 28 },
    { key: 'phone', header: 'Số điện thoại', width: 15 },
    { key: 'address', header: 'Địa chỉ', width: 35 },
    { key: 'orderInfo', header: 'Đơn hàng liên kết', width: 25 },
    { key: 'reason', header: 'Nội dung thu', width: 35 },
    { key: 'amount', header: 'Số tiền (VNĐ)', width: 18 },
    { key: 'paymentMethod', header: 'Phương thức thanh toán', width: 22 },
    { key: 'invoiceNumber', header: 'Số chứng từ kèm theo', width: 22 },
    { key: 'status', header: 'Trạng thái', width: 18 },
    { key: 'createdBy', header: 'Người lập phiếu', width: 20 },
    { key: 'notes', header: 'Ghi chú', width: 30 }
  ];

  ws.columns = headers;

  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE53935' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  const getStatusText = (st: string) => {
    switch (st) {
      case 'PAID': return 'Đã thu tiền';
      case 'APPROVED': return 'Đã duyệt';
      case 'PENDING': return 'Chờ phê duyệt';
      case 'REJECTED': return 'Từ chối';
      default: return st;
    }
  };

  receipts.forEach((r, idx) => {
    let orderInfo = '';
    if (r.allocations && r.allocations.length > 0) {
      orderInfo = `Phân bổ ${r.allocations.length} đơn: ` + r.allocations.map((a) => a.order?.code).filter(Boolean).join('; ');
    } else if (r.order) {
      orderInfo = `${r.order.code}`;
    }

    const row = ws.addRow({
      stt: idx + 1,
      code: r.code,
      voucherDate: new Date(r.voucherDate).toLocaleDateString('vi-VN'),
      payer: r.payer || '',
      phone: r.phone || '',
      address: r.address || '',
      orderInfo,
      reason: r.reason || '',
      amount: Number(r.amount) || 0,
      paymentMethod: r.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt',
      invoiceNumber: r.invoiceNumber || '',
      status: getStatusText(r.status),
      createdBy: r.createdBy?.fullName || '',
      notes: r.notes || ''
    });

    row.height = 22;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Times New Roman', size: 11 };
      cell.border = THIN_BORDER;
      if (colNum === 9) { // amount
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if ([1, 2, 3, 5, 10, 11, 12].includes(colNum)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  const finalFileName = fileName || `Danh_Sach_Phieu_Thu_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await saveWorkbook(workbook, finalFileName);
}

/**
 * Xuất danh sách toàn bộ Phiếu Chi ra file Excel (.xlsx) chuẩn thương hiệu NK Nam Khánh
 */
export async function exportPaymentsListToExcel(payments: PaymentVoucher[], fileName?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NK Nam Khánh CRM';
  const ws = workbook.addWorksheet('Danh sách Phiếu chi', {
    views: [{ showGridLines: true }]
  });

  const headers = [
    { key: 'stt', header: 'STT', width: 6 },
    { key: 'code', header: 'Số phiếu chi', width: 16 },
    { key: 'voucherDate', header: 'Ngày chi', width: 14 },
    { key: 'recipient', header: 'Người nhận tiền', width: 28 },
    { key: 'phone', header: 'Số điện thoại', width: 15 },
    { key: 'address', header: 'Địa chỉ', width: 35 },
    { key: 'category', header: 'Danh mục chi', width: 25 },
    { key: 'type', header: 'Loại chi phí', width: 25 },
    { key: 'reason', header: 'Nội dung chi', width: 35 },
    { key: 'amount', header: 'Số tiền (VNĐ)', width: 18 },
    { key: 'paymentMethod', header: 'Phương thức thanh toán', width: 22 },
    { key: 'invoiceNumber', header: 'Số chứng từ kèm theo', width: 22 },
    { key: 'status', header: 'Trạng thái', width: 18 },
    { key: 'createdBy', header: 'Người lập phiếu', width: 20 },
    { key: 'notes', header: 'Ghi chú', width: 30 }
  ];

  ws.columns = headers;

  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE53935' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  const getStatusText = (st: string) => {
    switch (st) {
      case 'PAID': return 'Đã chi tiền';
      case 'APPROVED': return 'Đã duyệt chi';
      case 'PENDING': return 'Chờ duyệt';
      case 'REJECTED': return 'Từ chối chi';
      default: return st;
    }
  };

  payments.forEach((p, idx) => {
    const row = ws.addRow({
      stt: idx + 1,
      code: p.code,
      voucherDate: new Date(p.voucherDate).toLocaleDateString('vi-VN'),
      recipient: p.recipient || '',
      phone: p.phone || '',
      address: p.address || '',
      category: p.category?.name || '',
      type: p.type?.name || '',
      reason: p.reason || '',
      amount: Number(p.amount) || 0,
      paymentMethod: p.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt',
      invoiceNumber: p.invoiceNumber || '',
      status: getStatusText(p.status),
      createdBy: p.createdBy?.fullName || '',
      notes: p.notes || ''
    });

    row.height = 22;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Times New Roman', size: 11 };
      cell.border = THIN_BORDER;
      if (colNum === 10) { // amount
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if ([1, 2, 3, 5, 11, 12, 13].includes(colNum)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  const finalFileName = fileName || `Danh_Sach_Phieu_Chi_${new Date().toISOString().slice(0, 10)}.xlsx`;
  await saveWorkbook(workbook, finalFileName);
}

