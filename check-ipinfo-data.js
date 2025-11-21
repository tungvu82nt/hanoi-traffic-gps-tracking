/**
 * Kiểm tra thông tin IPInfo.io được lưu ở đâu trong database
 */

require('dotenv').config();
const { query } = require('./utils/neon-db');

async function checkIPInfoData() {
  console.log('🔍 Kiểm tra thông tin IPInfo.io trong database\n');
  console.log('='.repeat(60));

  try {
    // 1. Kiểm tra cấu trúc bảng
    console.log('\n📋 Cấu trúc bảng clicks_tracking:\n');
    const columnsResult = await query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'clicks_tracking'
        AND column_name IN ('country', 'city', 'region', 'timezone', 'isp')
      ORDER BY ordinal_position
    `);

    if (columnsResult.rows.length > 0) {
      console.log('✅ Các columns IPInfo.io đã có trong database:');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name.padEnd(15)} ${col.data_type.padEnd(25)} ${col.is_nullable === 'YES' ? '(Nullable)' : '(NOT NULL)'}`);
      });
    } else {
      console.log('❌ Không tìm thấy columns IPInfo.io');
    }

    // 2. Kiểm tra dữ liệu mẫu
    console.log('\n📊 Dữ liệu IPInfo.io có trong database:\n');
    const dataResult = await query(`
      SELECT 
        id,
        country,
        city,
        region,
        timezone,
        isp,
        clicked_at,
        consent_given
      FROM clicks_tracking
      WHERE country IS NOT NULL OR city IS NOT NULL
      ORDER BY clicked_at DESC
      LIMIT 10
    `);

    if (dataResult.rows.length > 0) {
      console.log(`✅ Tìm thấy ${dataResult.rows.length} records có geo data:\n`);
      dataResult.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. ID: ${row.id}`);
        console.log(`      📍 Location: ${row.city || 'N/A'}, ${row.region || 'N/A'}, ${row.country || 'N/A'}`);
        console.log(`      🕒 Timezone: ${row.timezone || 'N/A'}`);
        console.log(`      🌐 ISP: ${row.isp || 'N/A'}`);
        console.log(`      ⏰ Time: ${row.clicked_at}`);
        console.log(`      ✔️  Consent: ${row.consent_given ? 'Yes' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Chưa có dữ liệu IPInfo.io trong database');
      console.log('💡 Gửi tracking request để test:\n');
      console.log('   curl -X POST http://localhost:3000/track-click \\');
      console.log('     -H "Content-Type: application/json" \\');
      console.log('     -d \'{"latitude": 21.0285, "longitude": 105.8542, "consent_given": true}\'');
    }

    // 3. Thống kê
    console.log('\n📈 Thống kê IPInfo.io:\n');
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_clicks,
        COUNT(country) as has_country,
        COUNT(city) as has_city,
        COUNT(region) as has_region,
        COUNT(timezone) as has_timezone,
        COUNT(isp) as has_isp,
        COUNT(DISTINCT country) as unique_countries,
        COUNT(DISTINCT city) as unique_cities
      FROM clicks_tracking
    `);

    const stats = statsResult.rows[0];
    console.log(`   Tổng clicks: ${stats.total_clicks}`);
    console.log(`   Có country: ${stats.has_country} (${((stats.has_country/stats.total_clicks)*100).toFixed(1)}%)`);
    console.log(`   Có city: ${stats.has_city} (${((stats.has_city/stats.total_clicks)*100).toFixed(1)}%)`);
    console.log(`   Có region: ${stats.has_region} (${((stats.has_region/stats.total_clicks)*100).toFixed(1)}%)`);
    console.log(`   Có timezone: ${stats.has_timezone} (${((stats.has_timezone/stats.total_clicks)*100).toFixed(1)}%)`);
    console.log(`   Có ISP: ${stats.has_isp} (${((stats.has_isp/stats.total_clicks)*100).toFixed(1)}%)`);
    console.log(`   Unique countries: ${stats.unique_countries}`);
    console.log(`   Unique cities: ${stats.unique_cities}`);

    // 4. Top locations
    if (stats.has_city > 0) {
      console.log('\n🏙️  Top Cities:\n');
      const topCitiesResult = await query(`
        SELECT city, country, COUNT(*) as count
        FROM clicks_tracking
        WHERE city IS NOT NULL
        GROUP BY city, country
        ORDER BY count DESC
        LIMIT 5
      `);

      topCitiesResult.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. ${row.city}, ${row.country}: ${row.count} clicks`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Kiểm tra hoàn tất!\n');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

checkIPInfoData();
