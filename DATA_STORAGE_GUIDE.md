# 📦 HƯỚNG DẪN LƯU TRỮ DỮ LIỆU

## 🗄️ Nơi Lưu Trữ: Neon PostgreSQL

**Database Provider:** Neon (https://neon.tech)  
**Region:** AWS ap-southeast-1 (Singapore)  
**Connection:** Pooled SSL connection  
**Database Name:** `neondb`

---

## 📊 CẤU TRÚC DATABASE

### 🏗️ 2 Bảng Chính:

```
neondb/
├── registrations (Đăng ký người dùng)
└── clicks_tracking (Tracking GPS/IP + IPInfo.io)
```

---

## 1️⃣ Bảng `registrations`

**Chức năng:** Lưu thông tin đăng ký người dùng

### Columns:
```sql
┌─────────────────┬──────────────┬──────────────────┐
│ Column          │ Type         │ Description      │
├─────────────────┼──────────────┼──────────────────┤
│ id              │ SERIAL       │ Primary Key      │
│ email           │ VARCHAR(255) │ Email người dùng │
│ phone           │ VARCHAR(20)  │ Số điện thoại    │
│ full_name       │ VARCHAR(255) │ Họ và tên        │
│ dob             │ DATE         │ Ngày sinh        │
│ plate           │ VARCHAR(50)  │ Biển số xe       │
│ vehicle_type    │ VARCHAR(50)  │ Loại xe          │
│ created_at      │ TIMESTAMP    │ Thời gian tạo    │
└─────────────────┴──────────────┴──────────────────┘
```

### Indexes:
- `idx_registrations_email` - Tìm kiếm theo email
- `idx_registrations_phone` - Tìm kiếm theo SĐT
- `idx_registrations_created_at` - Sắp xếp theo thời gian

### Ví dụ Data:
```sql
id | email              | phone      | full_name      | dob        | plate      | vehicle_type
---|--------------------|-----------:|----------------|------------|------------|-------------
1  | test@neon.db       | 0900000000 | Test Neon User | 1990-01-01 | 29A-999.99 | Xe máy
```

---

## 2️⃣ Bảng `clicks_tracking` ⭐

**Chức năng:** Lưu tracking clicks + GPS + IP + **IPInfo.io geo data**

### Columns (21 columns):

#### 🆔 Identifiers:
```sql
id                BIGSERIAL PRIMARY KEY
registration_id   BIGINT (FK → registrations.id)
```

#### 🌐 IP Tracking (Encrypted):
```sql
ip_address        TEXT          (Masked IP, consent required)
ip_prefix         TEXT          (First 3 octets, consent required)
ip_suffix_cipher  TEXT          (Encrypted last octet)
ip_hash           TEXT NOT NULL (SHA256 hash - always saved)
```

#### 👤 User Info:
```sql
user_agent        TEXT          (Browser/device info, hashed)
```

#### 📍 GPS Location (Browser):
```sql
latitude          DECIMAL(10, 8)  (GPS, consent required)
longitude         DECIMAL(11, 8)  (GPS, consent required)
accuracy          DECIMAL(10, 2)  (GPS accuracy in meters)
```

#### 🌍 IPInfo.io Geo Data (⭐ NEW):
```sql
country           VARCHAR(100)    (VN, US, JP, ...)
city              VARCHAR(100)    (Hanoi, Ho Chi Minh City, ...)
region            VARCHAR(100)    (Hanoi, HCMC, California, ...)
timezone          VARCHAR(50)     (Asia/Ho_Chi_Minh, ...)
isp               VARCHAR(200)    (VNPT Corp, Google LLC, ...)
```

#### ✅ GDPR Compliance:
```sql
consent_given     BOOLEAN DEFAULT FALSE
consent_timestamp TIMESTAMPTZ
```

#### 📄 Tracking Metadata:
```sql
element_id        TEXT           (Button/link ID)
element_type      TEXT           (button, link, ...)
page_url          TEXT           (URL where click happened)
```

#### ⏰ Timestamps:
```sql
clicked_at        TIMESTAMPTZ DEFAULT NOW()
created_at        TIMESTAMPTZ DEFAULT NOW()
```

### Indexes (7 indexes):
- `idx_clicks_registration_id` - Liên kết user
- `idx_clicks_clicked_at` - Time-based queries
- `idx_clicks_ip_hash` - Unique user counting
- `idx_clicks_ip_prefix` - IP range analysis
- `idx_clicks_element` - Element tracking
- `idx_clicks_location` - **Geo queries (country, city, region)** ⭐
- `idx_clicks_consent` - GDPR filtering

### Ví dụ Data:

```sql
id  | ip_hash      | latitude  | longitude  | country | city        | region  | timezone         | isp              | consent
----|--------------|-----------|------------|---------|-------------|---------|------------------|------------------|--------
1   | a3f2e9...    | 21.0285   | 105.8542   | VN      | Hanoi       | Hanoi   | Asia/Ho_Chi_Minh | AS45899 VNPT     | true
2   | b8d4c1...    | NULL      | NULL       | VN      | HCMC        | HCMC    | Asia/Ho_Chi_Minh | AS151858 FPT     | false
3   | c5a9f3...    | 10.7769   | 106.7009   | VN      | HCMC        | HCMC    | Asia/Ho_Chi_Minh | AS7552 Viettel   | true
```

**Lưu ý:**
- Khi `consent_given = false`: GPS (lat/long) = NULL, nhưng **IPInfo.io data vẫn được lưu**
- IPInfo.io không cần consent vì chỉ lưu thông tin vùng, không chính xác như GPS

---

## 📍 IPINFO.IO DATA - CHI TIẾT

### Nơi Lưu Trữ:
**Bảng:** `clicks_tracking`  
**Columns:** 5 columns (country, city, region, timezone, isp)

### Khi Nào Data Được Lưu?

**Mỗi khi có tracking request:**
```javascript
POST /track-click
  ↓
1. Server nhận IP từ request (req.ip)
2. Gọi IPInfo.io API: getGeoFromIP(ip)
3. Nhận geo data: { country, city, region, timezone, isp }
4. INSERT vào clicks_tracking với geo data
  ↓
Database lưu: country, city, region, timezone, isp
```

### Flow Chi Tiết:

```
User Click
  ↓
Browser gửi POST /track-click
  ↓
Server.js:
  ├─ Extract IP: req.ip
  ├─ Call: getGeoFromIP(clientIp)
  │   ├─ HTTPS request: ipinfo.io/{ip}/json?token=xxx
  │   ├─ Response: { city: "Hanoi", country: "VN", ... }
  │   └─ Return: geoData object
  ├─ Insert into DB:
  │   INSERT INTO clicks_tracking (
  │     ..., country, city, region, timezone, isp, ...
  │   ) VALUES (
  │     ..., 'VN', 'Hanoi', 'Hanoi', 'Asia/Ho_Chi_Minh', 'AS45899 VNPT', ...
  │   )
  └─ Response: { success: true, geo: { city: "Hanoi", country: "VN" } }
```

---

## 🔍 KIỂM TRA DỮ LIỆU

### Script có sẵn:
```bash
npm run check:ipinfo
```

### Output mẫu:
```
✅ Các columns IPInfo.io đã có trong database:
   - country         character varying         (Nullable)
   - city            character varying         (Nullable)
   - region          character varying         (Nullable)
   - timezone        character varying         (Nullable)
   - isp             character varying         (Nullable)

📈 Thống kê IPInfo.io:
   Tổng clicks: 12
   Có country: 12 (100.0%)
   Có city: 12 (100.0%)
   Unique countries: 3
   Unique cities: 8
```

---

## 📊 QUERY DỮ LIỆU IPINFO.IO

### Lấy tất cả geo data:
```sql
SELECT 
  id,
  country,
  city,
  region,
  timezone,
  isp,
  clicked_at
FROM clicks_tracking
WHERE country IS NOT NULL
ORDER BY clicked_at DESC;
```

### Thống kê theo thành phố:
```sql
SELECT 
  city,
  country,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT ip_hash) as unique_users
FROM clicks_tracking
WHERE city IS NOT NULL
GROUP BY city, country
ORDER BY total_clicks DESC;
```

### Top ISPs:
```sql
SELECT 
  isp,
  COUNT(*) as clicks
FROM clicks_tracking
WHERE isp IS NOT NULL
GROUP BY isp
ORDER BY clicks DESC
LIMIT 10;
```

### So sánh GPS vs IP location:
```sql
SELECT 
  id,
  -- GPS location
  latitude,
  longitude,
  -- IP location
  city,
  country,
  -- Check mismatch
  CASE 
    WHEN latitude IS NOT NULL AND city IS NOT NULL THEN 'GPS + IP'
    WHEN latitude IS NOT NULL THEN 'GPS only'
    WHEN city IS NOT NULL THEN 'IP only'
    ELSE 'No location'
  END as location_type
FROM clicks_tracking
ORDER BY clicked_at DESC;
```

---

## 🔐 BẢO MẬT DỮ LIỆU

### Encryption:
- **IP Address:** AES-256-GCM encrypted
- **User Agent:** SHA256 hashed
- **IPInfo.io data:** Plain text (không nhạy cảm)

### GDPR Compliance:
```sql
-- User đồng ý (consent_given = true):
  ✅ Lưu: GPS (lat/long), IP đầy đủ, geo data
  
-- User từ chối (consent_given = false):
  ✅ Lưu: IP hash only, geo data
  ❌ Không lưu: GPS coordinates, IP plaintext
```

**IPInfo.io data luôn được lưu** vì:
- Không cần consent (theo GDPR)
- Chỉ là thông tin vùng/thành phố (không chính xác như GPS)
- Cần thiết cho analytics

---

## 💾 BACKUP & EXPORT

### Export geo data:
```bash
# Export ra CSV
psql "postgresql://..." -c "COPY (
  SELECT country, city, region, timezone, isp, clicked_at 
  FROM clicks_tracking
) TO STDOUT CSV HEADER" > ipinfo_data.csv
```

### Backup toàn bộ database:
```bash
pg_dump "postgresql://..." > backup.sql
```

---

## 📈 STORAGE SIZE

**Hiện tại:**
- Bảng `registrations`: Minimal (chỉ user data)
- Bảng `clicks_tracking`: ~1KB per row (bao gồm geo data)

**Dự tính:**
- 1 triệu clicks ≈ 1GB storage
- Neon Free tier: 3GB storage

---

## 🎯 TÓM TẮT

### ❓ Thông tin IPInfo.io được lưu ở đâu?

**Trả lời:**
```
Database: Neon PostgreSQL
  └── neondb
      └── clicks_tracking (table)
          ├── country      (VARCHAR 100)
          ├── city         (VARCHAR 100)
          ├── region       (VARCHAR 100)
          ├── timezone     (VARCHAR 50)
          └── isp          (VARCHAR 200)
```

**Khi nào được lưu:**
- Mỗi lần có tracking request (POST /track-click)
- Tự động call IPInfo.io API
- Lưu vào database cùng với IP/GPS data

**Xem data:**
```bash
npm run check:ipinfo
```

**Access database:**
- URL: https://console.neon.tech
- Connection string trong `.env`
- Query tool: Admin dashboard (`/admin`)

---

✅ **Dữ liệu IPInfo.io hiện đang được lưu trữ an toàn trong Neon PostgreSQL!**
