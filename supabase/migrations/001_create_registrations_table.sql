-- Tạo bảng registrations nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS public.registrations (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    full_name TEXT NOT NULL,
    dob DATE NOT NULL,
    plate TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cấp quyền cho anon và authenticated roles
GRANT ALL ON TABLE public.registrations TO anon, authenticated;
GRANT USAGE ON SEQUENCE public.registrations_id_seq TO anon, authenticated;