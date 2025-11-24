/**
 * IPInfo.io Integration
 * Lấy thông tin geolocation từ IP address
 */

const https = require('https');

const IPINFO_TIMEOUT = 5000; // 5 seconds timeout

/**
 * Lấy thông tin geo từ IP address
 * @param {string} ip - IP address
 * @returns {Promise<Object>} Geo data hoặc null nếu thất bại
 */
async function getGeoFromIP(ip) {
  // Lấy API key từ biến môi trường mỗi khi hàm được gọi
  const IPINFO_API_KEY = process.env.IPINFO_API_KEY;
  
  // Bỏ qua nếu không có API key
  if (!IPINFO_API_KEY) {
    console.log('[IPInfo] No API key configured, skipping geo lookup');
    return null;
  }

  // Bỏ qua localhost/private IPs
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    console.log('[IPInfo] Skipping localhost/private IP:', ip);
    return null;
  }

  return new Promise((resolve) => {
    const url = `https://ipinfo.io/${ip}/json?token=${IPINFO_API_KEY}`;
    
    const req = https.get(url, { timeout: IPINFO_TIMEOUT }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            
            // Extract thông tin cần thiết
            const geoData = {
              country: parsed.country || null,
              city: parsed.city || null,
              region: parsed.region || null,
              timezone: parsed.timezone || null,
              isp: parsed.org || null, // ISP info từ field 'org'
              loc: parsed.loc || null // "latitude,longitude"
            };

            console.log(`[IPInfo] ✅ Geo lookup successful for ${ip}:`, geoData.city, geoData.country);
            resolve(geoData);
          } else {
            console.error(`[IPInfo] ❌ API error: ${res.statusCode}`);
            resolve(null);
          }
        } catch (err) {
          console.error('[IPInfo] ❌ Parse error:', err.message);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[IPInfo] ❌ Request error:', err.message);
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('[IPInfo] ❌ Request timeout');
      resolve(null);
    });
  });
}

/**
 * Batch lookup nhiều IPs (optional - để mở rộng sau)
 * @param {string[]} ips - Array of IP addresses
 * @returns {Promise<Object[]>}
 */
async function batchGeoLookup(ips) {
  const promises = ips.map(ip => getGeoFromIP(ip));
  return Promise.all(promises);
}

module.exports = {
  getGeoFromIP,
  batchGeoLookup
};
