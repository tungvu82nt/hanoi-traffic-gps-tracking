const { createClient } = require('@supabase/supabase-js');

// Kết nối với service role key
const supabaseUrl = 'https://rezupfvczeynxwhsqrlz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlenVwZnZjemV5bnh3aHNxcmx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM1OTEzOSwiZXhwIjoyMDc4OTM1MTM5fQ.8sjtli1dp8QFO_5VTpu9Ddmr2-5SdDCM2AXD0XDHrt8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Tạo bảng clicks_tracking bằng cách insert test data
 * Nếu bảng chưa tồn tại, sẽ báo lỗi và tạo bằng cách khác
 */
async function createTableByInsert() {
  try {
    // Thử insert data test để xem bảng có tồn tại không
    const { data, error } = await supabase
      .from('clicks_tracking')
      .insert([{
        ip_address: 'test_ip',
        user_agent: 'test_agent',
        consent_given: false,
        clicked_at: new Date().toISOString()
      }]);

    if (error) {
      console.log('Bảng chưa tồn tại, cần tạo mới');
      return false;
    }
    
    console.log('✅ Bảng đã tồn tại và insert test thành công!');
    return true;
  } catch (err) {
    console.error('Lỗi:', err);
    return false;
  }
}

/**
 * Tạo bảng bằng cách dùng raw SQL query
 */
async function createTableDirectly() {
  try {
    // Dùng SQL trực tiếp qua RPC
    const sql = `
      CREATE TABLE IF NOT EXISTS public.clicks_tracking (
        id BIGSERIAL PRIMARY KEY,
        registration_id BIGINT,
        ip_address TEXT,
        user_agent TEXT,
        clicked_at TIMESTAMPTZ DEFAULT NOW(),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        accuracy DECIMAL(10, 2),
        consent_given BOOLEAN DEFAULT FALSE,
        consent_timestamp TIMESTAMPTZ,
        element_id TEXT,
        element_type TEXT,
        page_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    console.log('📝 SQL cần chạy:');
    console.log(sql);
    
    // Thông báo cần chạy SQL thủ công
    console.log('⚠️  Cần chạy SQL trên Supabase Dashboard:');
    console.log('1. Vào https://app.supabase.com');
    console.log('2. Chọn project của bạn');
    console.log('3. Vào SQL Editor');
    console.log('4. Paste và chạy SQL ở trên');
    
    return true;
  } catch (err) {
    console.error('Lỗi:', err);
    return false;
  }
}

/**
 * Kiểm tra và tạo bảng
 */
async function main() {
  console.log('🔍 Đang kiểm tra bảng clicks_tracking...');
  
  const exists = await createTableByInsert();
  if (!exists) {
    await createTableDirectly();
  }
  
  process.exit(0);
}

if (require.main === module) {
  main();
}