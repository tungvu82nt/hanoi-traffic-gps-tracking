# Hà Nội Traffic Safety System - GPS/IP Tracking

## 📋 Giới thiệu

Hệ thống đăng ký và theo dõi người dùng cho dự án an toàn giao thông Hà Nội, với khả năng thu thập vị trí GPS và địa chỉ IP khi người dùng tương tác.

## ✨ Tính năng chính

### 📝 Đăng ký người dùng
- Form đăng ký với thông tin: Email, SĐT, Họ tên, Ngày sinh, Biển số xe, Loại xe
- Lưu trữ dữ liệu vào Supabase
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
- **Database:** Supabase (PostgreSQL)
- **Frontend:** HTML, CSS, JavaScript, Tailwind CSS
- **Mã hóa:** crypto.createCipheriv (AES-256-GCM)
- **Geolocation:** Browser Geolocation API

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

3. Cấu hình Supabase:
- Tạo project trên Supabase
- Tạo bảng `registrations` và `clicks_tracking`
- Copy connection string và điền vào file `.env`

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
- `POST /track-click` - Ghi nhận click với GPS/IP
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
  registration_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMP DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  consent_given BOOLEAN DEFAULT FALSE,
  accuracy DECIMAL(10, 2)
);
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
├── supabase/
│   └── migrations/           # SQL migrations
├── utils/                    # Utilities
│   ├── encryption.js         # Mã hóa dữ liệu
│   └── tempStorage.js      # Storage tạm thời
├── server.js                 # Server chính
├── package.json              # Dependencies
└── .env                      # Environment variables
```

## ⚠️ Lưu ý bảo mật

**CẢNH BÁO:** File `.env` chứa thông tin nhạy cảm. Trong production:
- Không upload file `.env` lên GitHub
- Sử dụng environment variables của hosting service
- Rotate API keys định kỳ
- Implement rate limiting cho API endpoints

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