-- Tạo bảng clicks_tracking cơ bản trước
CREATE TABLE IF NOT EXISTS public.clicks_tracking (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cấp quyền
GRANT ALL ON TABLE public.clicks_tracking TO anon, authenticated;
GRANT USAGE ON SEQUENCE clicks_tracking_id_seq TO anon, authenticated;

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks_tracking(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_address ON clicks_tracking(ip_address);

-- Test insert đơn giản
INSERT INTO public.clicks_tracking (
  ip_address, user_agent, latitude, longitude, accuracy, consent_given
) VALUES 
  ('192.168.1.1', 'Mozilla/5.0 Test', 21.0285, 105.8542, 10.5, true);

-- Kiểm tra
SELECT COUNT(*) as total FROM clicks_tracking;