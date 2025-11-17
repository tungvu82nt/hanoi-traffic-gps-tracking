const crypto = require('crypto');

// Load encryption key from environment or generate one (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? 
  Buffer.from(process.env.ENCRYPTION_KEY, 'hex').length === 32 ? process.env.ENCRYPTION_KEY : crypto.randomBytes(32).toString('hex') :
  crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

/**
 * Mã hóa dữ liệu nhạy cảm
 * @param {string} text - Dữ liệu cần mã hóa
 * @returns {string} - Dữ liệu đã mã hóa dạng base64
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
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
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
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
  if (!ip) return null;
  
  // Giữ lại 2 octet đầu để có thể phân tích vùng miền
  const parts = ip.split('.');
  if (parts.length === 4) {
    const prefix = parts.slice(0, 2).join('.');
    const suffix = parts.slice(2).join('.');
    const encryptedSuffix = encrypt(suffix);
    return `${prefix}.${encryptedSuffix}`;
  }
  
  return encrypt(ip);
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
  isEncrypted
};