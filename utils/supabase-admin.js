require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Kết nối với service role key để có quyền admin
const supabaseUrl = 'https://rezupfvczeynxwhsqrlz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlenVwZnZjemV5bnh3aHNxcmx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM1OTEzOSwiZXhwIjoyMDc4OTM1MTM5fQ.8sjtli1dp8QFO_5VTpu9Ddmr2-5SdDCM2AXD0XDHrt8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Tạo bảng clicks_tracking
 */
async function createClicksTable() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS clicks_tracking (
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
        
        GRANT ALL ON TABLE clicks_tracking TO anon, authenticated;
        GRANT USAGE ON SEQUENCE clicks_tracking_id_seq TO anon, authenticated;
        
        CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks_tracking(clicked_at);
        CREATE INDEX IF NOT EXISTS idx_clicks_ip_address ON clicks_tracking(ip_address);
      `
    });

    if (error) {
      console.error('Lỗi tạo bảng:', error);
      return false;
    }
    
    console.log('✅ Bảng clicks_tracking đã được tạo thành công!');
    return true;
  } catch (err) {
    console.error('Lỗi kết nối:', err);
    return false;
  }
}

/**
 * Kiểm tra bảng đã tồn tại chưa
 */
async function checkTableExists() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'clicks_tracking');

    if (error) {
      console.error('Lỗi kiểm tra bảng:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (err) {
    console.error('Lỗi:', err);
    return false;
  }
}

/**
 * chạy thử
 */
async function main() {
  console.log('Đang kiểm tra bảng clicks_tracking...');
  
  const exists = await checkTableExists();
  if (exists) {
    console.log('✅ Bảng đã tồn tại!');
  } else {
    console.log('📝 Đang tạo bảng...');
    await createClicksTable();
  }
  
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { createClicksTable, checkTableExists };