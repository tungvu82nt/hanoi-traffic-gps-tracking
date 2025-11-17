-- Tạo bảng clicks_tracking đơn giản
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
  element_id TEXT,
  element_type TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cấp quyền cho anon và authenticated roles
GRANT ALL ON TABLE public.clicks_tracking TO anon, authenticated;
GRANT USAGE ON SEQUENCE clicks_tracking_id_seq TO anon, authenticated;

-- Tạo index cho performance
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks_tracking(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_address ON clicks_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_clicks_element_id ON clicks_tracking(element_id);

-- Thêm test data
INSERT INTO public.clicks_tracking (
  ip_address, user_agent, latitude, longitude, accuracy, 
  consent_given, element_id, element_type, page_url
) VALUES 
  ('192.168.1.1', 'Mozilla/5.0 Test', 21.0285, 105.8542, 10.5, 
   true, 'btn-test', 'button', 'http://localhost:3000/test'),
  ('192.168.1.2', 'Chrome/91.0 Test', null, null, null, 
   false, 'link-test', 'link', 'http://localhost:3000/');

-- Kiểm tra kết quả
SELECT COUNT(*) as total_clicks FROM clicks_tracking;
SELECT * FROM clicks_tracking ORDER BY clicked_at DESC LIMIT 5;