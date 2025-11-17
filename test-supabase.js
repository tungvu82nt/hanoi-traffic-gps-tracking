require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test kết nối bằng cách truy vấn bảng registrations
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Lỗi kết nối Supabase:', error.message);
      console.error('Chi tiết:', error);
    } else {
      console.log('Kết nối Supabase thành công!');
      console.log('Dữ liệu test:', data);
    }

    // Test insert dữ liệu mẫu
    console.log('\nTest insert dữ liệu mẫu...');
    const testData = {
      email: 'test@example.com',
      phone: '0912345678',
      full_name: 'Nguyen Van A',
      dob: '1990-01-01',
      plate: '29A-123.45',
      vehicle_type: 'Xe máy'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('registrations')
      .insert([testData]);

    if (insertError) {
      console.error('Lỗi insert:', insertError.message);
      console.error('Chi tiết insert:', insertError);
    } else {
      console.log('Insert thành công!', insertData);
    }

  } catch (err) {
    console.error('Lỗi tổng quát:', err.message);
  }
}

testConnection();