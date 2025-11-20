const crypto = require('crypto');

const HEX_KEY_LENGTH = 64; // 32 bytes
const ALGORITHM = 'aes-256-gcm';
let cachedEncryptionKey;

/**
 * Lấy encryption key dạng Buffer, đảm bảo hợp lệ
 * @returns {Buffer}
 */
function getEncryptionKey() {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex || keyHex.length !== HEX_KEY_LENGTH || !/^[0-9a-fA-F]+$/.test(keyHex)) {
    throw new Error('ENCRYPTION_KEY phải là chuỗi hex 64 ký tự (32 bytes) để mã hóa AES-256-GCM');
  }

  cachedEncryptionKey = Buffer.from(keyHex, 'hex');
  return cachedEncryptionKey;
}

/**
 * Mã hóa dữ liệu nhạy cảm
 * @param {string} text - Dữ liệu cần mã hóa
 * @returns {string} - Dữ liệu đã mã hóa dạng base64
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv, authTag and encrypted data
    const result = {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted
    };
    
    return Buffer.from(JSON.stringify(result)).toString('base64');
  } catch (error) {
    console.error('Lỗi mã hóa:', error);
    return null;
  }
}

/**
 * Giải mã dữ liệu
 * @param {string} encryptedData - Dữ liệu đã mã hóa dạng base64
 * @returns {string} - Dữ liệu gốc
 */
function decrypt(encryptedData) {
  if (!encryptedData) return null;
  
  try {
    const decoded = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
    const iv = Buffer.from(decoded.iv, 'hex');
    const authTag = Buffer.from(decoded.authTag, 'hex');
    const encryptedText = decoded.data;
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from('additional-data'));
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Lỗi giải mã:', error);
    return null;
  }
}

/**
 * Mã hóa đối tượng JavaScript
 * @param {object} data - Đối tượng cần mã hóa
 * @returns {string} - Dữ liệu đã mã hóa
 */
function encryptObject(data) {
  if (!data) return null;
  return encrypt(JSON.stringify(data));
}

/**
 * Giải mã thành đối tượng JavaScript
 * @param {string} encryptedData - Dữ liệu đã mã hóa
 * @returns {object} - Đối tượng gốc
 */
function decryptObject(encryptedData) {
  if (!encryptedData) return null;
  const decrypted = decrypt(encryptedData);
  return decrypted ? JSON.parse(decrypted) : null;
}

/**
 * Hash dữ liệu nhạy cảm (one-way encryption)
 * @param {string} data - Dữ liệu cần hash
 * @param {string} salt - Muối (tùy chọn)
 * @returns {string} - Hash dạng hex
 */
function hashData(data, salt = '') {
  if (!data) return null;
  
  return crypto.createHash('sha256')
    .update(data + salt)
    .digest('hex');
}

/**
 * Mã hóa IP address (giữ lại một phần để có thể phân tích)
 * @param {string} ip - Địa chỉ IP
 * @returns {string} - IP đã mã hóa
 */
function encryptIP(ip) {
  if (!ip) {
    return {
      masked: null,
      prefix: null,
      suffixCipher: null,
      hash: null
    };
  }

  const normalized = ip.replace(/^::ffff:/, '');
  const hash = hashData(normalized, 'ip-hash-salt');
  const parts = normalized.split('.');

  if (parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part))) {
    const prefix = parts.slice(0, 2).join('.');
    const suffix = parts.slice(2).join('.');
    return {
      masked: `${parts[0]}.${parts[1]}.*.*`,
      prefix,
      suffixCipher: encrypt(suffix),
      hash
    };
  }

  return {
    masked: normalized.substring(0, 4) + '***',
    prefix: null,
    suffixCipher: encrypt(normalized),
    hash
  };
}

/**
 * Kiểm tra xem dữ liệu có phải đã được mã hóa không
 * @param {string} data - Dữ liệu cần kiểm tra
 * @returns {boolean} - True nếu là dữ liệu đã mã hóa
 */
function isEncrypted(data) {
  if (!data) return false;
  
  try {
    const decoded = Buffer.from(data, 'base64').toString();
    const parsed = JSON.parse(decoded);
    return parsed.iv && parsed.authTag && parsed.data;
  } catch {
    return false;
  }
}

module.exports = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hashData,
  encryptIP,
  isEncrypted,
  getEncryptionKey
};