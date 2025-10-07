-- 🔐 تحديث جدول الشركات لإضافة نظام المصادقة

-- إضافة أعمدة المصادقة إلى جدول companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';

-- تحديث الشركات الموجودة لتكون نشطة (للتوافق مع البيانات القديمة)
UPDATE companies SET is_active = true WHERE status = 'approved' AND password_hash IS NULL;

-- 🔐 إنشاء جدول للمستخدمين الإداريين
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
-- البريد: admin@dawerha.com
-- كلمة المرور: Dawerha@2025
-- ⚠️ غيّر كلمة المرور بعد أول تسجيل دخول!
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
  'admin@dawerha.com',
  'Dawerha@2025', -- سيتم تشفيرها في الكود
  'مدير دوّرها',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- 🔐 إنشاء جدول للجلسات (Sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL, -- 'company' أو 'admin'
  user_id BIGINT NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس لتسريع البحث بالـ Token
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- تنظيف الجلسات المنتهية تلقائياً (يمكن تشغيله بـ Cron Job)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 🔐 تفعيل Row Level Security على الجداول الجديدة
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- سياسات للمستخدمين الإداريين (للقراءة فقط من خلال الكود)
CREATE POLICY "Admin users read own data"
  ON admin_users
  FOR SELECT
  USING (true);

-- سياسات للجلسات
CREATE POLICY "Sessions readable by all"
  ON sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Sessions insertable by all"
  ON sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sessions deletable by all"
  ON sessions
  FOR DELETE
  USING (true);

-- 📊 View محدّث لإحصائيات الشركات (مع المصادقة)
CREATE OR REPLACE VIEW company_stats_secure AS
SELECT 
  c.id AS company_id,
  c.email,
  c.name AS company_name,
  c.is_active,
  c.status,
  c.last_login,
  COUNT(gs.id) AS total_spins,
  COUNT(DISTINCT gs.visitor_name) AS unique_visitors,
  COUNT(CASE WHEN gs.created_at >= NOW() - INTERVAL '1 day' THEN 1 END) AS spins_today,
  COUNT(CASE WHEN gs.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS spins_week,
  COUNT(CASE WHEN gs.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS spins_month,
  MAX(gs.created_at) AS last_spin_at
FROM companies c
LEFT JOIN game_spins gs ON c.id = gs.company_id
WHERE c.status = 'approved' AND c.is_active = true
GROUP BY c.id, c.email, c.name, c.is_active, c.status, c.last_login;

COMMENT ON TABLE admin_users IS 'جدول المستخدمين الإداريين - فقط لفريق دوّرها';
COMMENT ON TABLE sessions IS 'جدول الجلسات - لتتبع تسجيلات الدخول النشطة';
COMMENT ON VIEW company_stats_secure IS 'إحصائيات الشركات مع بيانات المصادقة';

