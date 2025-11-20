-- =============================================
-- NEON POSTGRESQL MIGRATION SCRIPT
-- Dự án: Hanoi Traffic Safety System
-- =============================================

-- Bảng 1: Registrations
CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  phone VARCHAR(20),
  full_name VARCHAR(255),
  dob DATE,
  plate VARCHAR(50),
  vehicle_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index cho registrations
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);

-- Bảng 2: Clicks Tracking
CREATE TABLE IF NOT EXISTS clicks_tracking (
  id BIGSERIAL PRIMARY KEY,
  registration_id BIGINT REFERENCES registrations(id) ON DELETE SET NULL,
  
  -- IP Tracking (encrypted)
  ip_address TEXT,
  ip_prefix TEXT,
  ip_suffix_cipher TEXT,
  ip_hash TEXT NOT NULL,
  
  -- User info
  user_agent TEXT,
  
  -- Location data (GPS)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(10, 2),
  
  -- Geo IP data
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),
  timezone VARCHAR(50),
  isp VARCHAR(200),
  
  -- GDPR Compliance
  consent_given BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,
  
  -- Tracking metadata
  element_id TEXT,
  element_type TEXT,
  page_url TEXT,
  
  -- Timestamps
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes cho clicks_tracking
CREATE INDEX IF NOT EXISTS idx_clicks_registration_id ON clicks_tracking(registration_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks_tracking(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_hash ON clicks_tracking(ip_hash);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_prefix ON clicks_tracking(ip_prefix);
CREATE INDEX IF NOT EXISTS idx_clicks_element ON clicks_tracking(element_id, element_type);
CREATE INDEX IF NOT EXISTS idx_clicks_location ON clicks_tracking(country, city, region);
CREATE INDEX IF NOT EXISTS idx_clicks_consent ON clicks_tracking(consent_given);

-- Comments để document
COMMENT ON TABLE registrations IS 'Bảng lưu thông tin đăng ký người dùng';
COMMENT ON TABLE clicks_tracking IS 'Bảng tracking clicks với GPS/IP và GDPR consent';
COMMENT ON COLUMN clicks_tracking.ip_hash IS 'Hash SHA256 của IP để đếm unique users';
COMMENT ON COLUMN clicks_tracking.consent_given IS 'User có đồng ý chia sẻ vị trí GPS không';

-- Test insert để verify schema
INSERT INTO registrations (email, phone, full_name, dob, plate, vehicle_type)
VALUES ('test@neon.db', '0900000000', 'Test Neon User', '1990-01-01', '29A-999.99', 'Xe máy')
ON CONFLICT DO NOTHING;

-- Kiểm tra kết quả
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
