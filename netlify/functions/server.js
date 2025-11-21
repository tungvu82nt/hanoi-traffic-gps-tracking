require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { query } = require('../../utils/neon-db');
const { encryptIP, hashData } = require('../../utils/encryption');
const { getGeoFromIP } = require('../../utils/ipinfo');

// Khởi tạo Express app
const app = express();

// Cấu hình bảo mật
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
const ADMIN_BASIC_USER = process.env.ADMIN_BASIC_USER;
const ADMIN_BASIC_PASSWORD = process.env.ADMIN_BASIC_PASSWORD;
const ADMIN_COOKIE_NAME = 'admin_token';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const parsePositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const registerLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.REGISTER_RATE_WINDOW_MS, 15 * 60 * 1000),
  max: parsePositiveInt(process.env.REGISTER_RATE_LIMIT, 50),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu đăng ký, vui lòng thử lại sau.' }
});

const trackingLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.TRACK_RATE_WINDOW_MS, 60 * 1000),
  max: parsePositiveInt(process.env.TRACK_RATE_LIMIT, 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu tracking, vui lòng thử lại sau.' }
});

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[SEC] ${req.method} ${req.originalUrl} - ${res.statusCode} - IP:${req.ip} - ${duration}ms`);
  });
  next();
};

const hasAdminCookie = (req) => {
  if (!ADMIN_API_TOKEN || !req.cookies) return false;
  return req.cookies[ADMIN_COOKIE_NAME] === ADMIN_API_TOKEN;
};

const persistAdminCookie = (res) => {
  if (!ADMIN_API_TOKEN || !res || typeof res.cookie !== 'function') return;
  res.cookie(ADMIN_COOKIE_NAME, ADMIN_API_TOKEN, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: parsePositiveInt(process.env.ADMIN_COOKIE_MAX_AGE_MS, 12 * 60 * 60 * 1000)
  });
};

const cleanQueryFromUrl = (req) => {
  const params = new URLSearchParams(req.query);
  params.delete('token');
  params.delete('adminToken');
  const queryString = params.toString();
  return queryString ? `${req.path}?${queryString}` : req.path;
};

const hasHeaderOrQueryToken = (req, res) => {
  if (!ADMIN_API_TOKEN) return false;
  const suppliedToken = req.get('x-admin-token') || req.query.adminToken || req.query.token;

  if (suppliedToken === ADMIN_API_TOKEN) {
    persistAdminCookie(res);
    const isAdminPageRequest = req.path === '/admin' || req.path === '/admin.html';
    if (isAdminPageRequest && req.method === 'GET' && (req.query.token || req.query.adminToken)) {
      return { authenticated: true, redirectTo: cleanQueryFromUrl(req) };
    }
    return { authenticated: true };
  }

  if (hasAdminCookie(req)) {
    return { authenticated: true };
  }

  return { authenticated: false };
};

const hasBasicCredential = (req) => {
  if (!ADMIN_BASIC_USER || !ADMIN_BASIC_PASSWORD) return false;
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return false;
  const decoded = Buffer.from(encoded, 'base64').toString();
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) return false;
  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);
  return username === ADMIN_BASIC_USER && password === ADMIN_BASIC_PASSWORD;
};

const ensureAdminAuthConfigured = () => {
  return Boolean(ADMIN_API_TOKEN || (ADMIN_BASIC_USER && ADMIN_BASIC_PASSWORD));
};

const requireAdminAuth = (req, res, next) => {
  if (!ensureAdminAuthConfigured()) {
    console.error('Admin auth chưa được cấu hình. Cần đặt ADMIN_API_TOKEN hoặc ADMIN_BASIC_USER/PASSWORD.');
    return res.status(500).json({ error: 'Admin auth chưa được cấu hình' });
  }

  const tokenCheck = hasHeaderOrQueryToken(req, res);
  if ((tokenCheck && tokenCheck.authenticated) || hasBasicCredential(req)) {
    if (tokenCheck && tokenCheck.redirectTo) {
      return res.redirect(tokenCheck.redirectTo);
    }
    return next();
  }

  if (ADMIN_BASIC_USER && ADMIN_BASIC_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Dashboard"');
  }

  if (req.accepts('html')) {
    return res.status(401).send('Không có quyền truy cập');
  }

  return res.status(401).json({ error: 'Không có quyền truy cập' });
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);
app.set('trust proxy', IS_PRODUCTION ? true : false);

const serveAdminPage = (_req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin.html'));
};

app.use((req, res, next) => {
  if (req.path === '/admin.html') {
    return requireAdminAuth(req, res, () => serveAdminPage(req, res));
  }
  return next();
});

// Neon PostgreSQL - connection được xử lý bởi utils/neon-db.js

// Không cần helper functions với Neon PostgreSQL

// Routes
app.post('/register', registerLimiter, async (req, res) => {
  const { email, phone, fullName, dob, plate, vehicleType } = req.body;

  if (!email || !phone || !fullName || !dob || !plate || !vehicleType) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin.' });
  }

  try {
    await query(
      `INSERT INTO registrations (email, phone, full_name, dob, plate, vehicle_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [email.trim(), phone.trim(), fullName.trim(), dob, plate.trim(), vehicleType.trim()]
    );

    return res.redirect('/success.html');
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Lỗi server.' });
  }
});

app.post('/track-click', trackingLimiter, async (req, res) => {
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

  const ip_address = req.ip || req.connection.remoteAddress;
  const user_agent = req.get('User-Agent');

  try {
    // Chỉ hash IP để tracking unique users
    const ipHash = hashData(ip_address, 'ip-hash-salt');
    const hashed_user_agent = hashData(user_agent, 'user-agent-salt');
    const consented = Boolean(consent_given);

    // 🌍 Lấy thông tin Geo từ IP (IPInfo.io)
    let geoData = null;
    try {
      geoData = await getGeoFromIP(ip_address);
    } catch (geoErr) {
      console.error('[IPInfo] Geo lookup failed:', geoErr.message);
    }

    await query(
      `INSERT INTO clicks_tracking (
        registration_id, ip_address, ip_hash,
        user_agent, latitude, longitude, accuracy,
        country, city, region, timezone, isp,
        consent_given, consent_timestamp, element_id, element_type, page_url,
        clicked_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())`,
      [
        registration_id || null,
        consented ? ip_address : null,  // Lưu IP gốc cho admin
        ipHash,
        hashed_user_agent,
        consented ? latitude : null,
        consented ? longitude : null,
        consented ? accuracy : null,
        geoData?.country || null,
        geoData?.city || null,
        geoData?.region || null,
        geoData?.timezone || null,
        geoData?.isp || null,
        consented,
        consented ? new Date().toISOString() : null,
        elementId || null,
        elementType || null,
        pageUrl || null
      ]
    );

    res.json({ success: true, message: 'Đã ghi nhận click thành công.' });
  } catch (err) {
    console.error('Lỗi server tracking:', err);
    res.status(500).json({ error: 'Lỗi server.' });
  }
});

app.get('/api/dashboard-stats', requireAdminAuth, async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_clicks,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as gps_clicks,
        COUNT(DISTINCT ip_hash) as unique_users,
        COUNT(CASE WHEN DATE(clicked_at) = CURRENT_DATE THEN 1 END) as today_clicks
      FROM clicks_tracking
    `);

    res.json({
      totalClicks: parseInt(stats.rows[0].total_clicks),
      gpsClicks: parseInt(stats.rows[0].gps_clicks),
      uniqueUsers: parseInt(stats.rows[0].unique_users),
      todayClicks: parseInt(stats.rows[0].today_clicks)
    });
  } catch (error) {
    console.error('Lỗi dashboard stats:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/api/clicks', requireAdminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, location } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = [];
    let params = [];
    let paramIndex = 1;

    if (startDate) {
      whereClause.push(`clicked_at >= $${paramIndex}::timestamp`);
      params.push(`${startDate}T00:00:00`);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause.push(`clicked_at < $${paramIndex}::timestamp`);
      params.push(`${endDate}T23:59:59`);
      paramIndex++;
    }

    if (location === 'gps') {
      whereClause.push('latitude IS NOT NULL AND longitude IS NOT NULL');
    } else if (location === 'no-gps') {
      whereClause.push('(latitude IS NULL OR longitude IS NULL)');
    }

    const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM clicks_tracking ${whereSQL}`,
      params
    );

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT * FROM clicks_tracking ${whereSQL} 
       ORDER BY clicked_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      clicks: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Lỗi get clicks:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.use(express.static(path.join(__dirname, '../../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

app.get('/admin', requireAdminAuth, serveAdminPage);

app.get('/success.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/success.html'));
});

// Export cho Netlify Functions
module.exports.handler = serverless(app);