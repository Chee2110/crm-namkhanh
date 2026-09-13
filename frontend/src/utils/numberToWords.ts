/**
 * Chuyển đổi số tiền thành chữ tiếng Việt chuẩn kế toán
 * Ví dụ: 15.000.000 -> Mười lăm triệu đồng chẵn
 */

const defaultNumbers = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readThreeDigits(threeDigits: string, readZeroHundred = false): string {
  let result = '';
  const hundred = parseInt(threeDigits[0], 10);
  const ten = parseInt(threeDigits[1], 10);
  const unit = parseInt(threeDigits[2], 10);

  if (hundred === 0 && ten === 0 && unit === 0) return '';

  if (hundred !== 0 || readZeroHundred) {
    result += `${defaultNumbers[hundred]} trăm `;
    if (ten === 0 && unit !== 0) {
      result += 'lẻ ';
    }
  }

  if (ten !== 0 && ten !== 1) {
    result += `${defaultNumbers[ten]} mươi `;
    if (ten === 0 && unit !== 0) result += 'lẻ ';
  }

  if (ten === 1) {
    result += 'mười ';
  }

  switch (unit) {
    case 1:
      if (ten > 1) {
        result += 'mốt ';
      } else {
        result += `${defaultNumbers[unit]} `;
      }
      break;
    case 5:
      if (ten > 0) {
        result += 'lăm ';
      } else {
        result += `${defaultNumbers[unit]} `;
      }
      break;
    default:
      if (unit !== 0) {
        result += `${defaultNumbers[unit]} `;
      }
      break;
  }

  return result.trim();
}

export function numberToWords(amount: number | string): string {
  let num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return 'Không đồng chẵn';

  const isNegative = num < 0;
  num = Math.abs(Math.round(num));

  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  let numStr = num.toString();

  // Thêm 0 vào đầu để độ dài chia hết cho 3
  while (numStr.length % 3 !== 0) {
    numStr = '0' + numStr;
  }

  const groups: string[] = [];
  for (let i = 0; i < numStr.length; i += 3) {
    groups.push(numStr.substring(i, i + 3));
  }

  let result = '';
  const totalGroups = groups.length;

  for (let i = 0; i < totalGroups; i++) {
    const group = groups[i];
    const scaleIndex = totalGroups - 1 - i;
    const groupText = readThreeDigits(group, i > 0);

    if (groupText !== '') {
      result += `${groupText} ${scales[scaleIndex]} `;
    }
  }

  result = result.replace(/\s+/g, ' ').trim();
  if (!result) return 'Không đồng chẵn';

  // Viết hoa chữ cái đầu tiên
  result = result.charAt(0).toUpperCase() + result.slice(1);

  return `${isNegative ? 'Âm ' : ''}${result} đồng chẵn`;
}
