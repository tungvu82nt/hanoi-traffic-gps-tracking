-- Tạo bảng clicks_tracking đơn giản để test
CREATE TABLE IF NOT EXISTS clicks_tracking (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT,
    ip_address TEXT,
    user_agent TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(10, 2),
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    element_id TEXT,
    element_type TEXT,
    page_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cấp quyền
GRANT ALL ON TABLE clicks_tracking TO anon, authenticated;
GRANT USAGE ON SEQUENCE clicks_tracking_id_seq TO anon, authenticated;

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks_tracking(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_address ON clicks_tracking(ip_address);