require('dotenv').config();
const { query, testConnection, close } = require('./utils/neon-db');

const adminApiToken = process.env.ADMIN_API_TOKEN;
const adminBasicUser = process.env.ADMIN_BASIC_USER;
const adminBasicPassword = process.env.ADMIN_BASIC_PASSWORD;

function getAdminHeaders() {
  if (adminApiToken) {
    return { 'X-Admin-Token': adminApiToken };
  }
  if (adminBasicUser && adminBasicPassword) {
    const encoded = Buffer.from(`${adminBasicUser}:${adminBasicPassword}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }
  throw new Error('Cần cấu hình ADMIN_API_TOKEN hoặc ADMIN_BASIC_USER/ADMIN_BASIC_PASSWORD để test API admin');
}

/**
 * Test kết nối và kiểm tra bảng
 */
async function testDatabase() {
  console.log('🔍 Đang test kết nối database...');
  
  try {
    // Test 1: Kiểm tra kết nối cơ bản
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Lỗi kết nối database');
      return false;
    }
    
    console.log('✅ Kết nối database thành công!');
    
    // Test 2: Insert data test
    const insertResult = await query(
      `INSERT INTO clicks_tracking (
        ip_address, ip_hash, user_agent, latitude, longitude, 
        accuracy, consent_given, consent_timestamp, clicked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id`,
      ['192.168.1.123', 'test_hash_' + Date.now(), 'Test Agent', 21.0285, 105.8542, 10.5, true]
    );
    
    console.log('✅ Insert test thành công!');
    console.log('📋 Inserted ID:', insertResult.rows[0].id);
    
    // Test 3: Đếm tổng số bản ghi
    const countResult = await query('SELECT COUNT(*) as total FROM clicks_tracking');
    console.log('📈 Tổng số bản ghi:', countResult.rows[0].total);
    
    // Test 4: Lấy danh sách 5 bản ghi mới nhất
    const listResult = await query(
      'SELECT * FROM clicks_tracking ORDER BY clicked_at DESC LIMIT 5'
    );
    
    console.log('📋 5 bản ghi mới nhất:');
    listResult.rows.forEach((item, index) => {
      console.log(`  ${index + 1}. ID: ${item.id}, IP: ${item.ip_address}, Time: ${item.clicked_at}`);
    });
    
    // Xóa test data
    await query('DELETE FROM clicks_tracking WHERE id = $1', [insertResult.rows[0].id]);
    console.log('🧹 Đã xóa test record');
    
    return true;
    
  } catch (err) {
    console.error('❌ Lỗi tổng quát:', err);
    return false;
  }
}

/**
 * Test API endpoints
 */
async function testAPIs() {
  console.log('\n🌐 Đang test API endpoints...');
  let headers;
  try {
    headers = getAdminHeaders();
  } catch (err) {
    console.warn(`⚠️  Bỏ qua test API vì thiếu cấu hình admin: ${err.message}`);
    return;
  }
  
  const endpoints = [
    'http://localhost:3000/api/dashboard-stats',
    'http://localhost:3000/api/clicks?page=1&limit=5'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { headers });
      const data = await response.json();
      console.log(`✅ ${endpoint}:`, data);
    } catch (err) {
      console.error(`❌ Lỗi ${endpoint}:`, err.message);
    }
  }
}

/**
 * Main test
 */
async function main() {
  console.log('🚀 Bắt đầu test toàn bộ hệ thống...\n');
  
  // Test database
  const dbSuccess = await testDatabase();
  
  if (dbSuccess) {
    console.log('\n✅ Database test thành công!');
    
    // Test APIs
    await testAPIs();
    
    console.log('\n🎉 Hoàn thành test toàn bộ hệ thống!');
  } else {
    console.log('\n❌ Database test thất bại!');
  }
  
  await close();
  process.exit(0);
}

if (require.main === module) {
  main();
}
