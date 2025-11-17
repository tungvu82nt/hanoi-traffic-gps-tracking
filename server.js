require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { encryptIP, encryptObject, hashData } = require('./utils/encryption');
const { saveTempClick, getTempClicks, getTempStats } = require('./utils/tempStorage');

const app = express();
const PORT = process.env.PORT || 3000;

// Kết nối Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware để lấy IP thực tế
app.set('trust proxy', true);

// Phục vụ file tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint đăng ký
app.post('/register', async (req, res) => {
  const { email, phone, fullName, dob, plate, vehicleType } = req.body;

  // Validate đơn giản
  if (!email || !phone || !fullName || !dob || !plate || !vehicleType) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin.' });
  }

  try {
    const { data, error } = await supabase
      .from('registrations') // Tên bảng trong Supabase
      .insert([
        {
          email: email.trim(),
          phone: phone.trim(),
          full_name: fullName.trim(),
          dob,
          plate: plate.trim(),
          vehicle_type: vehicleType.trim(),
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Lỗi khi lưu dữ liệu.' });
    }

    // Chuyển hướng về trang xác nhận thành công
    return res.redirect('/success.html');
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

// API endpoint để track clicks với IP và GPS (có mã hóa)
app.post('/track-click', async (req, res) => {
  const {
    registration_id,
    latitude,
    longitude,
    accuracy,
    consent_given = false,
    elementId,
    elementType,
    pageUrl
  } = req.body;

  // Lấy IP address từ request
  const ip_address = req.ip || req.connection.remoteAddress;
  const user_agent = req.get('User-Agent');

  try {
    // Mã hóa dữ liệu nhạy cảm
    const encrypted_ip = encryptIP(ip_address);
    const hashed_user_agent = hashData(user_agent, 'user-agent-salt');

    // Lưu vào database thật
    const { data, error } = await supabase
      .from('clicks_tracking')
      .insert([{
        registration_id: registration_id || null,
        ip_address: encrypted_ip,
        user_agent: hashed_user_agent,
        latitude: latitude || null,
        longitude: longitude || null,
        accuracy: accuracy || null,
        consent_given: consent_given,
        consent_timestamp: consent_given ? new Date().toISOString() : null,
        clicked_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Lỗi lưu tracking:', error);
      return res.status(500).json({ error: 'Lỗi khi lưu dữ liệu tracking.' });
    }

    res.json({ success: true, message: 'Đã ghi nhận click thành công.' });
  } catch (err) {
    console.error('Lỗi server tracking:', err);
    res.status(500).json({ error: 'Lỗi server.' });
  }
});

// API endpoints cho admin dashboard
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    // Dùng database thật
    const { count: totalClicks } = await supabase
      .from('clicks_tracking')
      .select('*', { count: 'exact', head: true });

    const { count: gpsClicks } = await supabase
      .from('clicks_tracking')
      .select('*', { count: 'exact', head: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    const { data: uniqueIps } = await supabase
      .from('clicks_tracking')
      .select('ip_address')
      .not('ip_address', 'is', null);
    
    const uniqueUsers = uniqueIps ? new Set(uniqueIps.map(item => item.ip_address)).size : 0;

    const today = new Date().toISOString().split('T')[0];
    const { count: todayClicks } = await supabase
      .from('clicks_tracking')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', `${today}T00:00:00`)
      .lt('clicked_at', `${today}T23:59:59`);

    res.json({
      totalClicks: totalClicks || 0,
      gpsClicks: gpsClicks || 0,
      uniqueUsers: uniqueUsers,
      todayClicks: todayClicks || 0
    });
  } catch (error) {
    console.error('Lỗi dashboard stats:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/api/clicks', async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, location } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('clicks_tracking')
      .select('*')
      .order('clicked_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by date range
    if (startDate) {
      query = query.gte('clicked_at', `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lt('clicked_at', `${endDate}T23:59:59`);
    }

    // Filter by location
    if (location === 'gps') {
      query = query.not('latitude', 'is', null).not('longitude', 'is', null);
    } else if (location === 'no-gps') {
      query = query.or('latitude.is.null,longitude.is.null');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Lỗi query clicks:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }

    res.json({
      clicks: data || [],
      total: count || data.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Lỗi get clicks:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Route mặc định trả về trang đăng ký
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route cho admin dashboard
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});