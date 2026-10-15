import ExcelJS from 'exceljs';
import { Order, Quotation } from '../types';
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
  const isSinglePage = (order.items?.length || 0) <= 22;
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
    ws.addImage(logoId, {
      tl: { col: 1.0, row: 0.27 },
      br: { col: 3.0, row: 4.35 }
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

  // 6. Số chứng từ (Dòng 6, merge D6:G6)
  ws.mergeCells('D6:G6');
  const r6 = ws.getCell('D6');
  r6.value = `Số : ${order.code}`;
  r6.font = { name: 'Times New Roman', size: 11, bold: true };
  r6.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(6).height = 21.6;

  // 7. Ngày tháng năm (Dòng 7, merge B7:H7, viền gạch dưới medium chuẩn mẫu)
  ws.mergeCells('B7:H7');
  const r7 = ws.getCell('B7');
  r7.value = formatVietnameseDate(order.orderDate);
  r7.font = { name: 'Times New Roman', size: 12, bold: true };
  r7.alignment = { horizontal: 'left', vertical: 'top' };
  ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
    ws.getCell(`${col}7`).border = { bottom: { style: 'medium' } };
  });
  ws.getRow(7).height = 20.4;

  // 8. Kính gửi khách hàng
  ws.mergeCells('B8:C8');
  const r8Title = ws.getCell('B8');
  r8Title.value = 'Kính gửi';
  r8Title.font = { name: 'Times New Roman', size: 12 };
  r8Title.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells('D8:H8');
  const r8Val = ws.getCell('D8');
  r8Val.value = order.customer?.name || 'Quý Khách hàng';
  r8Val.font = { name: 'Times New Roman', size: 11, bold: true };
  r8Val.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(8).height = 22.2;

  // 9. Người đại diện
  ws.mergeCells('B9:H9');
  const r9 = ws.getCell('B9');
  const contact = order.contactPerson || order.customer?.contactPerson || '';
  r9.value = `Người đại diện : ${contact}`;
  r9.font = { name: 'Times New Roman', size: 12 };
  r9.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(9).height = 18;

  // 10. Số điện thoại
  ws.mergeCells('B10:H10');
  const r10 = ws.getCell('B10');
  const phone = order.phone || order.customer?.phone || '';
  r10.value = `Số điện thoại : ${phone}`;
  r10.font = { name: 'Times New Roman', size: 12 };
  r10.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(10).height = 18;

  // 11. Địa chỉ
  ws.mergeCells('B11:H11');
  const r11 = ws.getCell('B11');
  const address = order.deliveryAddress || order.customer?.deliveryAddress || order.customer?.address || '';
  r11.value = `Địa chỉ : ${address}`;
  r11.font = { name: 'Times New Roman', size: 12 };
  r11.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(11).height = 18;

  // 12. Lời mở đầu
  ws.mergeCells('B12:H12');
  const r12 = ws.getCell('B12');
  r12.value = 'Công ty TNHH NK Nam Khánh xin gửi tới quý Công ty bảng đơn hàng sau';
  r12.font = { name: 'Times New Roman', size: 12 };
  r12.alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(12).height = 22.2;

  // 13. Loại tiền
  ws.mergeCells('G13:H13');
  const r13 = ws.getCell('G13');
  r13.value = ' Loại tiền/  Vnđ';
  r13.font = { name: 'Times New Roman', size: 12 };
  r13.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  ['G', 'H'].forEach((col) => {
    ws.getCell(`${col}13`).border = { bottom: { style: 'hair' } };
  });
  ws.getRow(13).height = 15;

  // 14. Tiêu đề bảng hàng hóa (Header table)
  const headerRow = ws.getRow(14);
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
    const c = ws.getCell(`${h.col}14`);
    c.value = h.text;
    c.font = { name: 'Times New Roman', size: 12, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = HAIR_BORDER;
  });

  // 15+. Dữ liệu sản phẩm
  const items = order.items || [];
  const startRow = 15;
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
  cNoteTitle.font = { name: 'Times New Roman', size: 13, bold: true };
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
    cell.font = { name: 'Times New Roman', size: 13 };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(noteRowIdx).height = 19;
  });

  // --- Phần Chữ ký 2 bên chuẩn BIEU_MAU_CRM.xlsx (Bố cục B..D bên trái và F..H bên phải vừa vặn A4) ---
  const signTitleRow = noteRowIdx + 1;
  ws.getRow(signTitleRow).height = 36;

  // Bên trái: Công ty TNHH NK Nam Khánh
  ws.mergeCells(`B${signTitleRow}:D${signTitleRow}`);
  const cSignSeller = ws.getCell(`B${signTitleRow}`);
  cSignSeller.value = 'Công ty TNHH NK Nam Khánh';
  cSignSeller.font = { name: 'Times New Roman', size: 13, bold: true };
  cSignSeller.alignment = { horizontal: 'center', vertical: 'middle' };

  // Bên phải: Khách hàng
  ws.mergeCells(`F${signTitleRow}:H${signTitleRow}`);
  const cSignBuyer = ws.getCell(`F${signTitleRow}`);
  cSignBuyer.value = 'Khách hàng';
  cSignBuyer.font = { name: 'Times New Roman', size: 13, bold: true };
  cSignBuyer.alignment = { horizontal: 'center', vertical: 'middle' };

  const signHintRow = signTitleRow + 1;
  ws.getRow(signHintRow).height = 20;

  // Ghi chú ký bên trái
  ws.mergeCells(`B${signHintRow}:D${signHintRow}`);
  const cHintSeller = ws.getCell(`B${signHintRow}`);
  cHintSeller.value = '(Ký tên đóng dấu)';
  cHintSeller.font = { name: 'Times New Roman', size: 12, bold: true, italic: true };
  cHintSeller.alignment = { horizontal: 'center', vertical: 'middle' };

  // Ghi chú ký bên phải
  ws.mergeCells(`F${signHintRow}:H${signHintRow}`);
  const cHintBuyer = ws.getCell(`F${signHintRow}`);
  cHintBuyer.value = '(Ký tên đóng dấu)';
  cHintBuyer.font = { name: 'Times New Roman', size: 12, bold: true, italic: true };
  cHintBuyer.alignment = { horizontal: 'center', vertical: 'middle' };

  // Khoảng trống ký tên chuẩn biểu mẫu (không để tên người ký)
  ws.getRow(signHintRow + 1).height = 36;
  ws.getRow(signHintRow + 2).height = 36;

  // Vùng in giới hạn chính xác A1 đến H(cuối trang)
  ws.pageSetup.printArea = `A1:H${signHintRow + 2}`;

  // =========================================================================
  // SHEET 2: LỆNH XUẤT - BBGH (Biên bản bàn giao giao nhận thực tế)
  // =========================================================================
  const wsBBGH = workbook.addWorksheet('Lệnh xuất - BBGH', {
    views: [{ showGridLines: true, rightToLeft: false }]
  });

  const isSinglePageBBGH = (order.items?.length || 0) <= 22;
  wsBBGH.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: isSinglePageBBGH ? 1 : 0,
    margins: { left: 0.35, right: 0.35, top: 0.5, bottom: 0.4, header: 0.2, footer: 0.2 }
  };

  wsBBGH.getColumn('A').width = 1.0;
  wsBBGH.getColumn('B').width = 4.8;  // Stt
  wsBBGH.getColumn('C').width = 18.0; // Mã hàng
  wsBBGH.getColumn('D').width = 48.0; // Tên hàng hóa
  wsBBGH.getColumn('E').width = 11.0; // Đơn vị
  wsBBGH.getColumn('F').width = 12.0; // Số lượng

  // 1. Tiêu ngữ
  wsBBGH.mergeCells('B1:F1');
  const bb1 = wsBBGH.getCell('B1');
  bb1.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM ';
  bb1.font = { name: 'Times New Roman', size: 13, bold: true };
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

  // 3. Thời gian
  wsBBGH.mergeCells('B4:F4');
  const bb4 = wsBBGH.getCell('B4');
  bb4.value = `Hôm nay ngày ........ Tháng ....... Năm ${new Date().getFullYear()} tại ….................................................chúng tôi gồm có `;
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
  const repName = order.manager?.fullName || 'Nguyễn Thị Hằng';
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
  bb10Val.value = order.customer?.name || 'Khách hàng';
  bb10Val.font = { name: 'Times New Roman', size: 12, bold: true };
  bb10Val.alignment = { horizontal: 'left', vertical: 'middle' };
  wsBBGH.getRow(10).height = 20.4;

  const bb11 = wsBBGH.getCell('B11');
  bb11.value = `Địa chỉ : ${address}`;
  bb11.font = { name: 'Times New Roman', size: 12 };
  wsBBGH.getRow(11).height = 18;

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
    r.height = 20;
    ['B', 'C', 'D', 'E', 'F'].forEach((col) => {
      const c = wsBBGH.getCell(`${col}${bbStartRow}`);
      c.border = HAIR_BORDER;
      c.font = { name: 'Times New Roman', size: 14 };
    });
  } else {
    items.forEach((it, idx) => {
      const rowIdx = bbStartRow + idx;
      const r = wsBBGH.getRow(rowIdx);

      const pName = it.productName || '';
      const pCode = it.productCode || '';
      const nameLines = pName.split(/\r?\n/).reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / 38)), 0);
      const codeLines = Math.ceil(pCode.length / 16);
      const rowLines = Math.max(nameLines, codeLines, 1);
      r.height = rowLines > 1 ? rowLines * 19 + 4 : 22;

      const cB = wsBBGH.getCell(`B${rowIdx}`);
      cB.value = idx + 1;
      cB.alignment = { horizontal: 'center', vertical: 'middle' };
      cB.font = { name: 'Times New Roman', size: 13 };
      cB.border = HAIR_BORDER;

      const cC = wsBBGH.getCell(`C${rowIdx}`);
      cC.value = pCode;
      cC.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cC.font = { name: 'Times New Roman', size: 13 };
      cC.border = HAIR_BORDER;

      const cD = wsBBGH.getCell(`D${rowIdx}`);
      cD.value = pName;
      cD.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      cD.font = { name: 'Times New Roman', size: 13 };
      cD.border = HAIR_BORDER;

      const cE = wsBBGH.getCell(`E${rowIdx}`);
      cE.value = it.unit || 'Cái';
      cE.alignment = { horizontal: 'center', vertical: 'middle' };
      cE.font = { name: 'Times New Roman', size: 13 };
      cE.border = HAIR_BORDER;

      const cF = wsBBGH.getCell(`F${rowIdx}`);
      const qInfo = formatQuantity(it.quantity);
      cF.value = qInfo.value;
      cF.alignment = { horizontal: 'center', vertical: 'middle' };
      cF.font = { name: 'Times New Roman', size: 13 };
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

  // Vùng in giới hạn A1 đến F(cuối trang)
  wsBBGH.pageSetup.printArea = `A1:F${sign4Row + 2}`;

  // Tải file về máy
  const finalFileName = fileName || `Don_Hang_${order.code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
    ws.addImage(logoId, {
      tl: { col: 1.0, row: 0.27 },
      br: { col: 3.0, row: 4.35 }
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

  // 6. Số báo giá (Dòng 6, merge B6:H6)
  ws.mergeCells('B6:H6');
  const r6 = ws.getCell('B6');
  r6.value = `Số : ${quotation.code}`;
  r6.font = { name: 'Times New Roman', size: 12, bold: true };
  r6.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(6).height = 21.6;

  // 7. Ngày tháng năm (Dòng 7, merge B7:H7, viền gạch dưới medium chuẩn mẫu)
  ws.mergeCells('B7:H7');
  const r7 = ws.getCell('B7');
  r7.value = formatVietnameseDate(quotation.date);
  r7.font = { name: 'Times New Roman', size: 12, bold: true };
  r7.alignment = { horizontal: 'left', vertical: 'top' };
  ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((col) => {
    ws.getCell(`${col}7`).border = { bottom: { style: 'medium' } };
  });
  ws.getRow(7).height = 20.4;

  // 8. Khách hàng
  ws.mergeCells('B8:C8');
  const r8Title = ws.getCell('B8');
  r8Title.value = 'Kính gửi';
  r8Title.font = { name: 'Times New Roman', size: 12 };
  r8Title.alignment = { horizontal: 'left', vertical: 'middle' };

  ws.mergeCells('D8:H8');
  const r8Val = ws.getCell('D8');
  r8Val.value = quotation.customer?.name || 'Quý Khách hàng';
  r8Val.font = { name: 'Times New Roman', size: 12, bold: true };
  r8Val.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(8).height = 22.2;

  // 9. Người đại diện
  ws.mergeCells('B9:H9');
  const r9 = ws.getCell('B9');
  const contact = quotation.customer?.contactPerson || '';
  r9.value = `Người đại diện : ${contact}`;
  r9.font = { name: 'Times New Roman', size: 12 };
  r9.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(9).height = 18;

  // 10. Số điện thoại
  ws.mergeCells('B10:H10');
  const r10 = ws.getCell('B10');
  const phone = quotation.customer?.phone || '';
  r10.value = `Số điện thoại : ${phone}`;
  r10.font = { name: 'Times New Roman', size: 12 };
  r10.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(10).height = 18;

  // 11. Địa chỉ
  ws.mergeCells('B11:H11');
  const r11 = ws.getCell('B11');
  const address = quotation.customer?.deliveryAddress || quotation.customer?.address || '';
  r11.value = `Địa chỉ : ${address}`;
  r11.font = { name: 'Times New Roman', size: 12 };
  r11.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(11).height = 18;

  // 12. Lời mở đầu
  ws.mergeCells('B12:H12');
  const r12 = ws.getCell('B12');
  r12.value = 'Công ty TNHH NK Nam Khánh xin gửi tới quý Công ty bảng báo giá mặt hàng sau';
  r12.font = { name: 'Times New Roman', size: 12 };
  r12.alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(12).height = 22.2;

  // 13. Loại tiền
  ws.mergeCells('G13:H13');
  const r13 = ws.getCell('G13');
  r13.value = ' Loại tiền/  Vnđ';
  r13.font = { name: 'Times New Roman', size: 12 };
  r13.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
  ['G', 'H'].forEach((col) => {
    ws.getCell(`${col}13`).border = { bottom: { style: 'hair' } };
  });
  ws.getRow(13).height = 15;

  // 14. Tiêu đề bảng báo giá
  const headerRow = ws.getRow(14);
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
    const c = ws.getCell(`${h.col}14`);
    c.value = h.text;
    c.font = { name: 'Times New Roman', size: 12, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = HAIR_BORDER;
  });

  // 15+. Dữ liệu sản phẩm báo giá
  const items = quotation.items || [];
  const startRow = 15;
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
  let noteRowIdx = wordsRowIdx + 1;
  ws.mergeCells(`B${noteRowIdx}:C${noteRowIdx}`);
  const cNoteTitle = ws.getCell(`B${noteRowIdx}`);
  cNoteTitle.value = 'Ghi chú:';
  cNoteTitle.font = { name: 'Times New Roman', size: 13, bold: true };
  cNoteTitle.alignment = { horizontal: 'left' };
  ws.getCell(`B${noteRowIdx}`).border = { top: { style: 'hair' } };
  ws.getCell(`C${noteRowIdx}`).border = { top: { style: 'hair' } };

  const notesList = [
    '* Hàng hoá bảo hành theo tiêu chuẩn chính hãng',
    '* Báo giá có hiệu lực kể từ ngày ký đến khi có thông báo mới',
    '* Miễn phí vận chuyển tại nội thành Hà Nội và Đông Anh, Mê linh ,Sóc Sơn',
    '* Đơn giá chưa bao gồm VAT'
  ];
  if (quotation.notes && quotation.notes.trim()) {
    notesList.push(`* ${quotation.notes.trim()}`);
  }

  notesList.forEach((n) => {
    noteRowIdx++;
    ws.mergeCells(`B${noteRowIdx}:H${noteRowIdx}`);
    const cell = ws.getCell(`B${noteRowIdx}`);
    cell.value = n;
    cell.font = { name: 'Times New Roman', size: 13 };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(noteRowIdx).height = 19;
  });

  // --- Chữ ký 2 bên chuẩn BIEU_MAU_CRM.xlsx (Bố cục B..D bên trái và F..H bên phải vừa vặn A4) ---
  const signTitleRow = noteRowIdx + 1;
  ws.getRow(signTitleRow).height = 36;

  // Bên trái: Công ty TNHH NK Nam Khánh
  ws.mergeCells(`B${signTitleRow}:D${signTitleRow}`);
  const cSignSeller = ws.getCell(`B${signTitleRow}`);
  cSignSeller.value = 'Công ty TNHH NK Nam Khánh';
  cSignSeller.font = { name: 'Times New Roman', size: 13, bold: true };
  cSignSeller.alignment = { horizontal: 'center', vertical: 'middle' };

  // Bên phải: Khách hàng
  ws.mergeCells(`F${signTitleRow}:H${signTitleRow}`);
  const cSignBuyer = ws.getCell(`F${signTitleRow}`);
  cSignBuyer.value = 'Khách hàng';
  cSignBuyer.font = { name: 'Times New Roman', size: 13, bold: true };
  cSignBuyer.alignment = { horizontal: 'center', vertical: 'middle' };

  const signHintRow = signTitleRow + 1;
  ws.getRow(signHintRow).height = 20;

  // Ghi chú ký bên trái
  ws.mergeCells(`B${signHintRow}:D${signHintRow}`);
  const cHintSeller = ws.getCell(`B${signHintRow}`);
  cHintSeller.value = '(Ký tên đóng dấu)';
  cHintSeller.font = { name: 'Times New Roman', size: 12, bold: true, italic: true };
  cHintSeller.alignment = { horizontal: 'center', vertical: 'middle' };

  // Ghi chú ký bên phải
  ws.mergeCells(`F${signHintRow}:H${signHintRow}`);
  const cHintBuyer = ws.getCell(`F${signHintRow}`);
  cHintBuyer.value = '(Ký tên đóng dấu)';
  cHintBuyer.font = { name: 'Times New Roman', size: 12, bold: true, italic: true };
  cHintBuyer.alignment = { horizontal: 'center', vertical: 'middle' };

  // Khoảng trống ký tên chuẩn biểu mẫu (không để tên người ký)
  ws.getRow(signHintRow + 1).height = 36;
  ws.getRow(signHintRow + 2).height = 36;

  // Vùng in giới hạn chính xác A1 đến H(cuối trang)
  ws.pageSetup.printArea = `A1:H${signHintRow + 2}`;

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
