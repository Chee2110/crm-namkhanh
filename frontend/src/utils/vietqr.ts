/**
 * Tiện ích tạo link ảnh mã VietQR chuẩn NAPAS 24/7
 * Dịch vụ cung cấp bởi VietQR.io (chuẩn Open Banking Việt Nam)
 */

export interface VietQROptions {
  bankId?: string; // Ví dụ: MB, VCB, TCB, ACB, VPB...
  accountNo?: string;
  accountName?: string;
  amount?: number;
  memo?: string; // Nội dung chuyển khoản
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export const NAMKHANH_BANK_INFO = {
  bankId: 'MB', // Ngân hàng Quân Đội (MBBank)
  bankName: 'MBBank - Ngân hàng TMCP Quân Đội',
  accountNo: '0988111222',
  accountName: 'CONG TY TNHH NK NAM KHANH'
};

/**
 * Sinh URL hình ảnh mã VietQR thanh toán tự động
 * Hỗ trợ cả 2 cách gọi:
 * 1. generateVietQRUrl({ amount: 100000, memo: 'DH-001' })
 * 2. generateVietQRUrl(100000, 'DH-001')
 */
export function generateVietQRUrl(
  amountOrOptions: number | VietQROptions,
  memoText?: string,
  extraOptions?: Partial<VietQROptions>
): string {
  let opts: VietQROptions;

  if (typeof amountOrOptions === 'number') {
    opts = {
      amount: amountOrOptions,
      memo: memoText,
      ...extraOptions
    };
  } else {
    opts = amountOrOptions;
  }

  const bankId = opts.bankId || NAMKHANH_BANK_INFO.bankId;
  const accountNo = opts.accountNo || NAMKHANH_BANK_INFO.accountNo;
  const accountName = encodeURIComponent(opts.accountName || NAMKHANH_BANK_INFO.accountName);
  const template = opts.template || 'compact2';
  const amount = opts.amount ? Math.round(opts.amount) : 0;
  const memo = encodeURIComponent(opts.memo || 'THANH TOAN NAM KHANH');

  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${memo}&accountName=${accountName}`;
}
