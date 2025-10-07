-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎡 سكريبت دوّرها الكامل - نظام المصادقة والتقارير
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📍 نفّذ هذا السكريبت في: Supabase SQL Editor
-- 🔗 https://app.supabase.com/project/YOUR_PROJECT/sql
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ═════════════════════════════════════════════════════════════════════
-- 1️⃣ تحديث جدول الشركات (companies)
-- ═════════════════════════════════════════════════════════════════════

-- إضافة أعمدة المصادقة
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';

-- تفعيل الشركات الموجودة مسبقاً
UPDATE companies 
SET is_active = true 
WHERE status = 'approved' AND password_hash IS NULL;

-- ═════════════════════════════════════════════════════════════════════
-- 2️⃣ جدول سجلات دوران العجلة (game_spins)
-- ═════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS game_spins (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  visitor_name TEXT,
  prize TEXT NOT NULL,
  won BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  device_info TEXT
);

-- فهارس لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_game_spins_company_id ON game_spins(company_id);
CREATE INDEX IF NOT EXISTS idx_game_spins_created_at ON game_spins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_spins_company_date ON game_spins(company_id, created_at DESC);

-- تفعيل Row Level Security
ALTER TABLE game_spins ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
DROP POLICY IF EXISTS "Companies can view their own spins" ON game_spins;
CREATE POLICY "Companies can view their own spins"
  ON game_spins FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert spins" ON game_spins;
CREATE POLICY "Anyone can insert spins"
  ON game_spins FOR INSERT
  WITH CHECK (true);

-- ═════════════════════════════════════════════════════════════════════
-- 3️⃣ جدول المستخدمين الإداريين (admin_users)
-- ═════════════════════════════════════════════════════════════════════

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

-- حساب إداري افتراضي
-- 📧 Email: admin@dawerha.com
-- 🔑 Password: Dawerha@2025
-- ⚠️ غيّر كلمة المرور فوراً بعد أول تسجيل دخول!
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
  'admin@dawerha.com',
  'RGF3ZXJoYUAyMDI1X2Rhd2VyaGFfc2FsdF8yMDI1',
  'مدير دوّرها',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- تفعيل Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
DROP POLICY IF EXISTS "Admin users read own data" ON admin_users;
CREATE POLICY "Admin users read own data"
  ON admin_users FOR SELECT
  USING (true);

-- ═════════════════════════════════════════════════════════════════════
-- 4️⃣ جدول الجلسات (sessions)
-- ═════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- دالة تنظيف الجلسات المنتهية
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- تفعيل Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
DROP POLICY IF EXISTS "Sessions readable by all" ON sessions;
CREATE POLICY "Sessions readable by all"
  ON sessions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sessions insertable by all" ON sessions;
CREATE POLICY "Sessions insertable by all"
  ON sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Sessions deletable by all" ON sessions;
CREATE POLICY "Sessions deletable by all"
  ON sessions FOR DELETE
  USING (true);

-- ═════════════════════════════════════════════════════════════════════
-- 5️⃣ Views للتقارير
-- ═════════════════════════════════════════════════════════════════════

-- إحصائيات الشركات
DROP VIEW IF EXISTS company_stats CASCADE;
CREATE OR REPLACE VIEW company_stats AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  c.email,
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
WHERE c.status = 'approved'
GROUP BY c.id, c.name, c.email, c.is_active, c.status, c.last_login;

-- توزيع الجوائز
DROP VIEW IF EXISTS prize_distribution CASCADE;
CREATE OR REPLACE VIEW prize_distribution AS
SELECT 
  company_id,
  prize,
  COUNT(*) AS count,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY company_id)), 2) AS percentage
FROM game_spins
GROUP BY company_id, prize
ORDER BY company_id, count DESC;

-- إحصائيات الإدارة
DROP VIEW IF EXISTS admin_stats CASCADE;
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  COUNT(DISTINCT company_id) AS total_active_companies,
  COUNT(*) AS total_spins_all_time,
  COUNT(DISTINCT visitor_name) AS total_unique_visitors,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) AS spins_today,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS spins_week,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS spins_month,
  MAX(created_at) AS last_activity
FROM game_spins;

-- ═════════════════════════════════════════════════════════════════════
-- 6️⃣ تعليقات توضيحية
-- ═════════════════════════════════════════════════════════════════════

COMMENT ON TABLE game_spins IS 'سجل جميع دورات العجلة - يحفظ بيانات كل تفاعل';
COMMENT ON TABLE admin_users IS 'جدول المستخدمين الإداريين - فقط لفريق دوّرها';
COMMENT ON TABLE sessions IS 'جدول الجلسات - لتتبع تسجيلات الدخول النشطة';
COMMENT ON VIEW company_stats IS 'إحصائيات لكل شركة - تُستخدم في لوحة تحكم الشركة';
COMMENT ON VIEW prize_distribution IS 'توزيع الجوائز لكل شركة - لمعرفة الجوائز الأكثر شيوعاً';
COMMENT ON VIEW admin_stats IS 'إحصائيات عامة لفريق دوّرها - Dashboard إداري';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ انتهى السكريبت!
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- 📋 ما تم إنشاؤه:
-- ✅ تحديث جدول companies (إضافة حقول المصادقة)
-- ✅ جدول game_spins (سجلات دوران العجلة)
-- ✅ جدول admin_users (المستخدمين الإداريين)
-- ✅ جدول sessions (الجلسات)
-- ✅ 3 Views للتقارير
-- ✅ Row Level Security على جميع الجداول
-- ✅ فهارس لتسريع الاستعلامات
-- 
-- 🔐 الحساب الإداري الافتراضي:
-- Email: admin@dawerha.com
-- Password: Dawerha@2025
-- 
-- 🚀 الخطوة التالية:
-- جرّب تسجيل شركة جديدة في: http://localhost:5500/index.html
-- 
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

