import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Khóa mã hóa 32 bytes chuẩn AES-256
const SECRET_KEY = process.env.ENCRYPTION_KEY
  ? crypto.scryptSync(process.env.ENCRYPTION_KEY, 'namkhanh_crm_salt_2026', 32)
  : crypto.scryptSync('NamKhanh_CRM_Secure_Key_2026', 'namkhanh_crm_salt_2026', 32);

/**
 * Mã hóa dữ liệu nhạy cảm (Lương, phụ cấp, thông tin tài chính)
 * Định dạng lưu trữ: iv:encrypted_hex
 */
export function encryptSensitiveData(data: string | number | null | undefined): string | null {
  if (data === null || data === undefined || data === '') return null;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(String(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Error encrypting data:', err);
    return null;
  }
}

/**
 * Giải mã dữ liệu nhạy cảm khi người dùng có thẩm quyền (Giám đốc, HR, Admin)
 */
export function decryptSensitiveData(encryptedPayload: string | null | undefined): string | null {
  if (!encryptedPayload || typeof encryptedPayload !== 'string' || !encryptedPayload.includes(':')) {
    return null;
  }
  try {
    const [ivHex, cipherText] = encryptedPayload.split(':');
    if (!ivHex || !cipherText) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Error decrypting data:', err);
    return null;
  }
}
