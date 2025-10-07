-- 📊 جدول حفظ بيانات كل دورة عجلة
CREATE TABLE IF NOT EXISTS game_spins (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  visitor_name TEXT,
  prize TEXT NOT NULL,
  won BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  device_info TEXT
);

-- 📈 فهرس لتسريع الاستعلامات
CREATE INDEX idx_game_spins_company_id ON game_spins(company_id);
CREATE INDEX idx_game_spins_created_at ON game_spins(created_at DESC);
CREATE INDEX idx_game_spins_company_date ON game_spins(company_id, created_at DESC);

-- 🔐 تفعيل Row Level Security
ALTER TABLE game_spins ENABLE ROW LEVEL SECURITY;

-- 📝 سياسة: الشركات يمكنها قراءة بياناتها فقط
CREATE POLICY "Companies can view their own spins"
  ON game_spins
  FOR SELECT
  USING (true);  -- للتبسيط، يمكن التعديل لاحقاً حسب نظام المصادقة

-- 📝 سياسة: السماح بإدراج البيانات من أي مستخدم (العملاء)
CREATE POLICY "Anyone can insert spins"
  ON game_spins
  FOR INSERT
  WITH CHECK (true);

-- 📊 إنشاء View للتقارير الأساسية للشركات
CREATE OR REPLACE VIEW company_stats AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  COUNT(gs.id) AS total_spins,
  COUNT(DISTINCT gs.visitor_name) AS unique_visitors,
  COUNT(CASE WHEN gs.created_at >= NOW() - INTERVAL '1 day' THEN 1 END) AS spins_today,
  COUNT(CASE WHEN gs.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS spins_week,
  COUNT(CASE WHEN gs.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS spins_month,
  MAX(gs.created_at) AS last_spin_at
FROM companies c
LEFT JOIN game_spins gs ON c.id = gs.company_id
WHERE c.status = 'approved'
GROUP BY c.id, c.name;

-- 📊 View لأكثر الجوائز توزيعاً لكل شركة
CREATE OR REPLACE VIEW prize_distribution AS
SELECT 
  company_id,
  prize,
  COUNT(*) AS count,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY company_id)), 2) AS percentage
FROM game_spins
GROUP BY company_id, prize
ORDER BY company_id, count DESC;

-- 📊 View للإحصائيات الداخلية (لفريق دوّرها)
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

COMMENT ON TABLE game_spins IS 'سجل جميع دورات العجلة - يحفظ بيانات كل تفاعل';
COMMENT ON VIEW company_stats IS 'إحصائيات لكل شركة - تُستخدم في لوحة تحكم الشركة';
COMMENT ON VIEW prize_distribution IS 'توزيع الجوائز لكل شركة - لمعرفة الجوائز الأكثر شيوعاً';
COMMENT ON VIEW admin_stats IS 'إحصائيات عامة لفريق دوّرها - Dashboard إداري';

