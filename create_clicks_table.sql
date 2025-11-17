-- Tạo bảng clicks_tracking để lưu thông tin click và vị trí
CREATE TABLE IF NOT EXISTS clicks_tracking (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT REFERENCES registrations(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(10, 2),
    country VARCHAR(100),
    city VARCHAR(100),
    region VARCHAR(100),
    timezone VARCHAR(50),
    isp VARCHAR(200),
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cấp quyền cho anon và authenticated roles
GRANT ALL ON TABLE clicks_tracking TO anon, authenticated;
GRANT USAGE ON SEQUENCE clicks_tracking_id_seq TO anon, authenticated;

-- Tạo index cho performance
CREATE INDEX IF NOT EXISTS idx_clicks_registration_id ON clicks_tracking(registration_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks_tracking(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_address ON clicks_tracking(ip_address);