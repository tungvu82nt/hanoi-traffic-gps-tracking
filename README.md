# Hà Nội Traffic Safety System - GPS/IP Tracking

## 📋 Giới thiệu

Hệ thống đăng ký và theo dõi người dùng cho dự án an toàn giao thông Hà Nội, với khả năng thu thập vị trí GPS và địa chỉ IP khi người dùng tương tác.

## ✨ Tính năng chính

### 📝 Đăng ký người dùng
- Form đăng ký với thông tin: Email, SĐT, Họ tên, Ngày sinh, Biển số xe, Loại xe
- Lưu trữ dữ liệu vào Neon PostgreSQL
- Giao diện responsive, hiện đại

### 📍 Tracking GPS/IP
- Thu thập địa chỉ IP và mã hóa AES-256-GCM
- Thu thập vị trí GPS với sự đồng ý của người dùng (GDPR compliant)
- Lưu trữ thời gian click, user agent
- Dashboard admin để xem thống kê

### 🔐 Bảo mật & GDPR
- Banner yêu cầu quyền truy cập vị trí
- Mã hóa dữ liệu nhạy cảm (IP address)
- Tuân thủ quy định bảo vệ dữ liệu
- Có thể từ chối chia sẻ vị trí

### 📊 Admin Dashboard
- Thống kê tổng quan: Tổng click, có GPS, số người dùng unique
- Bộ lọc theo ngày và loại vị trí
- Phân trang dữ liệu
- Xuất báo cáo Excel

## 🛠️ Công nghệ sử dụng

- **Backend:** Node.js, Express.js
- **Database:** Neon PostgreSQL (Serverless PostgreSQL)
- **Frontend:** HTML, CSS, JavaScript, Tailwind CSS
- **Mã hóa:** crypto.createCipheriv (AES-256-GCM)
- **Geolocation:** Browser Geolocation API + IPInfo.io

## 📦 Cài đặt

1. Clone repository:
```bash
git clone https://github.com/your-username/hanoi-traffic-backend.git
cd hanoi-traffic-backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Cấu hình Neon PostgreSQL & biến môi trường:
- Tạo project trên Neon (https://neon.tech)
- Chạy migration SQL: `psql "YOUR_NEON_URL" < neon-migration.sql`
- Tạo file `.env` với các biến sau:
  - `DATABASE_URL` - Neon connection string
  - `ENCRYPTION_KEY` (chuỗi hex 64 ký tự cho AES-256-GCM)
  - `ADMIN_API_TOKEN` **hoặc** cặp `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASSWORD`
  - `IPINFO_API_KEY` - IPInfo.io API key cho geolocation (optional, free 50k/month)
  - (Tuỳ chọn) `REGISTER_RATE_LIMIT`, `REGISTER_RATE_WINDOW_MS`, `TRACK_RATE_LIMIT`, `TRACK_RATE_WINDOW_MS`, `ADMIN_COOKIE_MAX_AGE_MS`

4. Chạy server:
```bash
npm start
# hoặc
node server.js
```

5. Truy cập:
- Trang chính: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin

## 🔗 API Endpoints

### Đăng ký người dùng
- `POST /register` - Đăng ký người dùng mới

### Tracking
- `POST /track-click` - Ghi nhận click với GPS/IP (ẩn toạ độ & IP nếu người dùng từ chối consent)
- `GET /api/dashboard-stats` - Lấy thống kê tổng quan
- `GET /api/clicks` - Lấy danh sách clicks (có phân trang)

## 📋 Database Schema

### Bảng registrations
```sql
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  phone VARCHAR(20),
  full_name VARCHAR(255),
  dob DATE,
  plate VARCHAR(50),
  vehicle_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Bảng clicks_tracking
```sql
CREATE TABLE clicks_tracking (
  id SERIAL PRIMARY KEY,
  registration_id INTEGER REFERENCES registrations(id),
  ip_address TEXT,
  ip_prefix TEXT,
  ip_suffix_cipher TEXT,
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  clicked_at TIMESTAMP DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(10, 2),
  consent_given BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks_tracking(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_hash ON clicks_tracking(ip_hash);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_prefix ON clicks_tracking(ip_prefix);
```

## 🚀 Tính năng nổi bật

### Mã hóa dữ liệu
```javascript
// Sử dụng AES-256-GCM để mã hóa IP address
const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
```

### GDPR Consent
```javascript
// Yêu cầu quyền truy cập vị trí
if (consent && navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
}
```

### Real-time Dashboard
- Cập nhật thống kê theo thời gian thực
- Bộ lọc linh hoạt
- Phân trang hiệu quả

## 🔧 File structure

```
hanoi-traffic-backend/
├── public/                    # File tĩnh frontend
│   ├── index.html            # Trang đăng ký
│   ├── admin.html            # Dashboard admin
│   └── success.html          # Trang thành công
├── utils/                    # Utilities
│   ├── encryption.js         # Mã hóa dữ liệu AES-256-GCM
│   └── neon-db.js           # Neon PostgreSQL connection pool
├── server.js                 # Server chính (Express + Neon)
├── neon-migration.sql        # SQL migration cho Neon
├── test-neon-connection.js   # Test kết nối database
├── package.json              # Dependencies
└── .env                      # Environment variables
```

## ⚠️ Lưu ý bảo mật

**CẢNH BÁO:** File `.env` chứa thông tin nhạy cảm. Trong production:
- Không upload file `.env` lên GitHub
- Sử dụng environment variables của hosting service
- Rotate API keys định kỳ
- Implement rate limiting cho API endpoints
- Admin dashboard được bảo vệ bằng Basic Auth hoặc token:
  - Nếu cấu hình `ADMIN_BASIC_USER` + `ADMIN_BASIC_PASSWORD`: trình duyệt sẽ yêu cầu đăng nhập trước khi truy cập `/admin`
  - Nếu chỉ dùng `ADMIN_API_TOKEN`: truy cập lần đầu qua `https://host/admin?token=YOUR_TOKEN`, server sẽ thiết lập cookie HttpOnly và tự redirect sang `/admin`
- `/track-click` chỉ lưu hash của IP khi người dùng từ chối chia sẻ thông tin, đồng thời bỏ toàn bộ toạ độ/độ chính xác.
- ENCRYPTION_KEY phải luôn là chuỗi hex 64 ký tự; đổi key = phải rotate dữ liệu cũ.

## 🔐 Rate limiting & logging
- `POST /register`: mặc định 50 yêu cầu / 15 phút (config qua biến môi trường)
- `POST /track-click`: mặc định 120 yêu cầu / phút
- Mọi request đều được log với IP, route, status và thời gian xử lý để phục vụ audit.

## 🧪 Kiểm thử
- `npm run test:db`: kiểm tra kết nối Neon và schema
- `node test-api.js`: kiểm tra nhanh endpoint đăng ký
- `node test-tracking.js`: gửi 2 tình huống tracking (có consent & không consent)
- `node test-system.js`: test DB + API admin (cần `ADMIN_API_TOKEN` hoặc Basic Auth)

## 📝 License

Dự án thử nghiệm - sử dụng tự do cho mục đích học tập và nghiên cứu.

## 🤝 Contributing

1. Fork repository
2. Tạo branch cho tính năng mới
3. Commit thay đổi
4. Push lên branch
5. Tạo Pull Request

---

**Lưu ý:** Đây là dự án thử nghiệm với mục đích demo công nghệ tracking GPS/IP. Trong production cần implement thêm nhiều biện pháp bảo mật và tối ưu hóa khác.