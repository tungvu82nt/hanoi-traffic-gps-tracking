# Hướng dẫn lấy Supabase Anon Key

## Cách 1: Từ Supabase Dashboard
1. Truy cập https://app.supabase.com
2. Chọn project `rezupfvczeynxwhsqrlz`
3. Vào **Settings** → **API**
4. Copy **anon key** (public key) trong phần "Project API keys"

## Cách 2: Từ Project Settings
1. Vào **Settings** → **General**
2. Trong phần "Project Configuration", copy **Reference ID**
3. Anon key sẽ có dạng: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlenVwZnZjemV5bnh3aHNxcmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAyMzQ1NjMsImV4cCI6MjAxNTgxMDU2M30.` + phần signature

## Cách 3: Kiểm tra connection string
Từ connection string bạn cung cấp:
```
postgresql://postgres.rezupfvczeynxwhsqrlz:Dh1206@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```
- Project ID: `rezupfvczeynxwhsqrlz`
- Password: `Dh1206`

**Lưu ý:** Password trong connection string là database password, không phải API key.

## Sau khi có anon key:
1. Copy anon key đầy đủ
2. Vào file `.env` trong project
3. Thay thế `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` bằng key thực tế
4. Restart server: `Ctrl+C` rồi `npm run dev`

## Test lại:
```bash
node test-supabase.js
```