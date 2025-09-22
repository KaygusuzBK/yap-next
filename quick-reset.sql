-- Hızlı Sıfırlama - Sadece Ana Tablolar
-- ⚠️ DİKKAT: Bu script ana verileri siler!

-- Ana tabloları temizle
TRUNCATE TABLE project_tasks CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE teams CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Sequence'leri sıfırla
ALTER SEQUENCE IF EXISTS teams_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS project_tasks_id_seq RESTART WITH 1;

SELECT 'Ana tablolar sıfırlandı!' as message;
