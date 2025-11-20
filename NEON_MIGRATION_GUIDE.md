# 🚀 Hướng Dẫn Chuyển Đổi Sang Neon PostgreSQL

## 📋 Tổng Quan

Dự án đang chuyển từ **Supabase** sang **Neon PostgreSQL** để tối ưu chi phí và performance.

### Thông tin Neon Database:
```
Host: ep-odd-sun-a1slqrx5-pooler.ap-southeast-1.aws.neon.tech
Database: neondb
User: neondb_owner
Region: Singapore (ap-southeast-1)
```

---

## ⚡ QUICK START (5 phút)

### Bước 1: Cài đặt dependencies

```bash
npm install pg
```

### Bước 2: Cấu hình environment

```bash
# Backup file .env cũ
cp .env .env.supabase.backup

# Copy config Neon
cp .env.neon .env
```

### Bước 3: Chạy migration SQL

**Cách 1: Qua psql command line (Khuyến nghị)**

```bash
psql 'postgresql://neondb_owner:npg_lAdkYnTg8W6m@ep-odd-sun-a1slqrx5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' < neon-migration.sql
```

**Cách 2: Qua Neon Console**

1. Truy cập: https://console.neon.tech
2. Chọn project → SQL Editor
3. Copy nội dung `neon-migration.sql`
4. Paste và Execute

### Bước 4: Test connection

```bash
npm run test:neon
```

Kết quả mong đợi:
```
✅ Kết nối Neon thành công!
✅ Tất cả bảng đã tồn tại!
✅ Insert thành công!
✅ Hoàn thành test Neon PostgreSQL!
```

### Bước 5: Chạy server mới

```bash
# Development
npm run dev:neon

# Production
npm run start:neon
```

---

## 🔄 So Sánh: Supabase vs Neon

| Tính năng | Supabase | Neon |
|-----------|----------|------|
| **Database Engine** | PostgreSQL 15 | PostgreSQL 16 |
| **API Layer** | Auto RESTful API | Không có (dùng pg driver) |
| **Connection** | supabase-js | pg (node-postgres) |
| **Query Style** | `.from().select()` | `query('SELECT ...')` |
| **Performance** | Good | Excellent (serverless) |
| **Cost** | $25+/month | Free tier generous |
| **Autoscaling** | Limited | ✅ Auto scale to zero |
| **Branching** | Không | ✅ Database branching |

---

## 📝 Thay Đổi Code

### Before (Supabase):

```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

// Insert
const { data, error } = await supabase
  .from('registrations')
  .insert([{ email, phone }]);

// Select
const { data } = await supabase
  .from('clicks_tracking')
  .select('*')
  .eq('consent_given', true);
```

### After (Neon):

```javascript
const { query } = require('./utils/neon-db');

// Insert
const result = await query(
  'INSERT INTO registrations (email, phone) VALUES ($1, $2) RETURNING id',
  [email, phone]
);

// Select
const result = await query(
  'SELECT * FROM clicks_tracking WHERE consent_given = $1',
  [true]
);
```

---

## 🗂️ File Structure Mới

```
hanoi-traffic-backend/
├── server-neon.js              # ✨ Server mới dùng Neon
├── utils/
│   └── neon-db.js              # ✨ Database connection pool
├── neon-migration.sql          # ✨ SQL migration script
├── test-neon-connection.js     # ✨ Test script
├── .env.neon                   # ✨ Neon config template
├── NEON_MIGRATION_GUIDE.md     # ✨ Hướng dẫn này
│
├── server.js                   # ⚠️ Server cũ (Supabase)
├── .env                        # ⚠️ Update sang Neon config
└── package.json                # ✅ Đã thêm pg dependency
```

---

## ✅ Checklist Migration

### Pre-Migration:
- [x] Backup database Supabase hiện tại
- [x] Tạo file migration SQL
- [x] Setup Neon project
- [x] Test connection string

### Migration:
- [ ] Chạy `npm install pg`
- [ ] Update file `.env` với Neon config
- [ ] Chạy migration SQL
- [ ] Test connection: `npm run test:neon`
- [ ] Verify data integrity

### Post-Migration:
- [ ] Update server start command
- [ ] Test tất cả endpoints
- [ ] Monitor performance 24h
- [ ] Update deployment (Netlify/Vercel)
- [ ] Archive Supabase project

---

## 🔧 Troubleshooting

### Lỗi: "Connection timeout"

```bash
# Check DNS resolution
ping ep-odd-sun-a1slqrx5-pooler.ap-southeast-1.aws.neon.tech

# Test raw connection
psql 'postgresql://neondb_owner:npg_lAdkYnTg8W6m@ep-odd-sun-a1slqrx5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
```

### Lỗi: "SSL required"

Thêm vào connection string:
```
?sslmode=require&sslrootcert=system
```

### Lỗi: "Column does not exist"

Chạy lại migration:
```bash
psql "..." < neon-migration.sql
```

### Performance issues

Enable connection pooling:
```javascript
// Trong neon-db.js đã config sẵn
max: 20,              // Tăng lên nếu cần
idleTimeoutMillis: 30000
```

---

## 📊 Migration Data từ Supabase → Neon

### Cách 1: Export/Import qua pg_dump

```bash
# Export từ Supabase
pg_dump "postgresql://postgres:[PASSWORD]@db.rezupfvczeynxwhsqrlz.supabase.co:5432/postgres" > supabase_backup.sql

# Import vào Neon
psql 'postgresql://neondb_owner:npg_lAdkYnTg8W6m@ep-odd-sun-a1slqrx5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' < supabase_backup.sql
```

### Cách 2: Script migration tự động

```javascript
// Tạo file migrate-data.js
const supabase = require('./old-supabase-client');
const { query } = require('./utils/neon-db');

async function migrateRegistrations() {
  const { data } = await supabase.from('registrations').select('*');
  
  for (const row of data) {
    await query(
      'INSERT INTO registrations (...) VALUES (...)',
      [row.email, row.phone, ...]
    );
  }
}
```

---

## 🎯 Performance Optimization

### 1. Connection Pooling
Đã config trong `neon-db.js`:
- Max 20 connections
- Auto-close idle connections
- Reuse connections

### 2. Prepared Statements
Sử dụng parameterized queries:
```javascript
// ✅ Good
query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ Bad (SQL injection risk)
query(`SELECT * FROM users WHERE id = ${userId}`);
```

### 3. Indexes
Migration đã tạo indexes:
- `idx_registrations_email`
- `idx_clicks_ip_hash`
- `idx_clicks_clicked_at`
- etc.

---

## 🔐 Security

### Environment Variables

**CRITICAL:** Không commit `.env` với credentials thật!

```bash
# .gitignore
.env
.env.neon
.env.*.local
```

### Production Config

```env
# Production .env
DATABASE_URL=postgresql://[PRODUCTION_URL]
NODE_ENV=production
ADMIN_API_TOKEN=[STRONG_RANDOM_TOKEN]
ENCRYPTION_KEY=[NEW_64_CHAR_HEX]
```

---

## 📈 Monitoring

### Neon Console
- Dashboard: https://console.neon.tech
- Metrics: CPU, Memory, Connections
- Query analytics

### Application Logging
```javascript
// Server logs
console.log('[SQL] Executed query in 125ms');
console.log('[SEC] POST /register - 200 - IP:1.2.3.4');
```

---

## 🆘 Support

### Neon Support
- Docs: https://neon.tech/docs
- Discord: https://discord.gg/neon
- Status: https://neon.tech/status

### Project Issues
- Check logs: `npm run dev:neon`
- Test connection: `npm run test:neon`
- Rollback: Dùng lại `server.js` với Supabase

---

## ✨ Next Steps

Sau khi migration thành công:

1. **Week 1:** Monitor performance và stability
2. **Week 2:** Optimize queries dựa trên metrics
3. **Week 3:** Implement database branching cho staging
4. **Week 4:** Archive Supabase project

---

**Last Updated:** 2025-11-20  
**Migration Status:** 🟡 Ready to Execute  
**Estimated Downtime:** < 5 minutes
