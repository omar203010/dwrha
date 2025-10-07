-- 🔐 نفّذ هذا السكريبت في Supabase SQL Editor
-- 📍 https://app.supabase.com/project/zysakfczqrqefdaxrehc/sql

-- إضافة أعمدة المصادقة إلى جدول companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';

-- تحديث الشركات الموجودة لتكون نشطة
UPDATE companies SET is_active = true WHERE status = 'approved' AND password_hash IS NULL;

-- إنشاء جدول للمستخدمين الإداريين
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج حساب إداري افتراضي
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
  'admin@dawerha.com',
  'RGF3ZXJoYUAyMDI1X2Rhd2VyaGFfc2FsdF8yMDI1',
  'مدير دوّرها',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- إنشاء جدول للجلسات
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL,
  user_id BIGINT NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- تفعيل Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- سياسات للمستخدمين الإداريين
DROP POLICY IF EXISTS "Admin users read own data" ON admin_users;
CREATE POLICY "Admin users read own data"
  ON admin_users
  FOR SELECT
  USING (true);

-- سياسات للجلسات
DROP POLICY IF EXISTS "Sessions readable by all" ON sessions;
CREATE POLICY "Sessions readable by all"
  ON sessions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sessions insertable by all" ON sessions;
CREATE POLICY "Sessions insertable by all"
  ON sessions
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Sessions deletable by all" ON sessions;
CREATE POLICY "Sessions deletable by all"
  ON sessions
  FOR DELETE
  USING (true);

-- ✅ انتهى! الآن جرّب التسجيل مرة أخرى

