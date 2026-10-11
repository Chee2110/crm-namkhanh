/**
 * Định dạng tiền tệ và số có dấu chấm (.) ngăn cách 3 chữ số theo chuẩn Việt Nam.
 * Ví dụ: 100000000 -> "100.000.000 đ"
 *        formatNumber(100000000) -> "100.000.000"
 */

export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0';
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '')) || 0;
  const isNegative = n < 0;
  const abs = Math.abs(Math.round(n));
  return (isNegative ? '-' : '') + abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatVND = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0 đ';
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '')) || 0;
  const isNegative = n < 0;
  const abs = Math.abs(Math.round(n));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}${formatted} đ`;
};

export const parseNumberFromFormatted = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const str = String(value).trim();
  const isNegative = str.startsWith('-');
  const cleaned = str.replace(/\D/g, '');
  const parsed = parseInt(cleaned, 10) || 0;
  return isNegative ? -parsed : parsed;
};
