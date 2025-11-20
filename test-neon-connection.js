require('dotenv').config();
const { query, testConnection, close } = require('./utils/neon-db');

/**
 * Script test kết nối và migration Neon PostgreSQL
 */

async function main() {
  console.log('🔍 Bắt đầu test Neon PostgreSQL...\n');

  // Test 1: Kiểm tra connection
  console.log('📡 Test 1: Kiểm tra kết nối...');
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Không thể kết nối database!');
    process.exit(1);
  }

  console.log('\n📋 Test 2: Kiểm tra bảng...');
  try {
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('   Các bảng hiện có:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    const hasRegistrations = tables.rows.some(r => r.table_name === 'registrations');
    const hasClicksTracking = tables.rows.some(r => r.table_name === 'clicks_tracking');

    if (!hasRegistrations || !hasClicksTracking) {
      console.log('\n⚠️  Thiếu bảng! Cần chạy migration:');
      console.log('   psql "postgresql://..." < neon-migration.sql');
    } else {
      console.log('\n✅ Tất cả bảng đã tồn tại!');
    }

  } catch (error) {
    console.error('❌ Lỗi kiểm tra bảng:', error.message);
  }

  // Test 3: Test insert
  console.log('\n🧪 Test 3: Test insert data...');
  try {
    const result = await query(
      `INSERT INTO registrations (email, phone, full_name, dob, plate, vehicle_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ['test@neon.com', '0900111222', 'Test User', '1990-01-01', '29A-123.45', 'Xe máy']
    );
    
    console.log(`   ✅ Insert thành công! ID: ${result.rows[0].id}`);

    // Xóa test data
    await query('DELETE FROM registrations WHERE email = $1', ['test@neon.com']);
    console.log('   🧹 Đã xóa test data');

  } catch (error) {
    console.error('   ❌ Lỗi insert:', error.message);
  }

  // Test 4: Test tracking insert
  console.log('\n🧪 Test 4: Test insert tracking...');
  try {
    const result = await query(
      `INSERT INTO clicks_tracking (
        ip_address, ip_hash, user_agent, latitude, longitude, 
        accuracy, consent_given, consent_timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id`,
      ['192.168.1.1', 'test_hash_' + Date.now(), 'Test Browser', 21.0285, 105.8542, 10.5, true]
    );

    console.log(`   ✅ Insert tracking thành công! ID: ${result.rows[0].id}`);

    // Xóa test data
    await query('DELETE FROM clicks_tracking WHERE id = $1', [result.rows[0].id]);
    console.log('   🧹 Đã xóa test data');

  } catch (error) {
    console.error('   ❌ Lỗi insert tracking:', error.message);
  }

  // Test 5: Test query stats
  console.log('\n📊 Test 5: Test query statistics...');
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM registrations) as total_registrations,
        (SELECT COUNT(*) FROM clicks_tracking) as total_clicks,
        (SELECT COUNT(DISTINCT ip_hash) FROM clicks_tracking) as unique_users
    `);

    console.log('   📈 Thống kê:');
    console.log(`      - Tổng đăng ký: ${stats.rows[0].total_registrations}`);
    console.log(`      - Tổng clicks: ${stats.rows[0].total_clicks}`);
    console.log(`      - Unique users: ${stats.rows[0].unique_users}`);

  } catch (error) {
    console.error('   ❌ Lỗi query stats:', error.message);
  }

  console.log('\n✅ Hoàn thành test Neon PostgreSQL!');
  console.log('📝 Nếu tất cả test pass, có thể chuyển sang sử dụng server-neon.js');

  await close();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Lỗi không mong đợi:', error);
  process.exit(1);
});
