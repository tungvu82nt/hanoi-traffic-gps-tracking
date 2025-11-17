const { createClient } = require('@supabase/supabase-js');

// Kết nối với service role key
const supabaseUrl = 'https://rezupfvczeynxwhsqrlz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlenVwZnZjemV5bnh3aHNxcmx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM1OTEzOSwiZXhwIjoyMDc4OTM1MTM5fQ.8sjtli1dp8QFO_5VTpu9Ddmr2-5SdDCM2AXD0XDHrt8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Test kết nối và kiểm tra bảng
 */
async function testDatabase() {
  console.log('🔍 Đang test kết nối database...');
  
  try {
    // Test 1: Kiểm tra kết nối cơ bản
    const { data: testData, error: testError } = await supabase
      .from('clicks_tracking')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Lỗi kết nối:', testError);
      return false;
    }
    
    console.log('✅ Kết nối database thành công!');
    console.log('📊 Số bản ghi hiện tại:', testData ? testData.length : 0);
    
    // Test 2: Insert data test
    const { data: insertData, error: insertError } = await supabase
      .from('clicks_tracking')
      .insert([{
        ip_address: '192.168.1.123',
        user_agent: 'Test Agent',
        latitude: 21.0285,
        longitude: 105.8542,
        accuracy: 10.5,
        consent_given: true
      }])
      .select();
    
    if (insertError) {
      console.error('❌ Lỗi insert:', insertError);
      return false;
    }
    
    console.log('✅ Insert test thành công!');
    console.log('📋 Data insert:', insertData);
    
    // Test 3: Đếm tổng số bản ghi
    const { count, error: countError } = await supabase
      .from('clicks_tracking')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Lỗi đếm:', countError);
      return false;
    }
    
    console.log('📈 Tổng số bản ghi:', count);
    
    // Test 4: Lấy danh sách
    const { data: listData, error: listError } = await supabase
      .from('clicks_tracking')
      .select('*')
      .order('clicked_at', { ascending: false })
      .limit(5);
    
    if (listError) {
      console.error('❌ Lỗi lấy danh sách:', listError);
      return false;
    }
    
    console.log('📋 5 bản ghi mới nhất:');
    listData.forEach((item, index) => {
      console.log(`  ${index + 1}. ID: ${item.id}, IP: ${item.ip_address}, Time: ${item.clicked_at}`);
    });
    
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
  
  const endpoints = [
    'http://localhost:3000/api/dashboard-stats',
    'http://localhost:3000/api/clicks?page=1&limit=5'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
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
  
  process.exit(0);
}

if (require.main === module) {
  main();
}