-- Supabase Veritabanı Sıfırlama Scripti
-- ⚠️ DİKKAT: Bu script tüm verileri siler!

-- Önce foreign key constraint'leri devre dışı bırak
SET session_replication_role = replica;

-- Tüm tabloları temizle (sırayla)
TRUNCATE TABLE IF EXISTS task_dependencies CASCADE;
TRUNCATE TABLE IF EXISTS task_assignments CASCADE;
TRUNCATE TABLE IF EXISTS task_comments CASCADE;
TRUNCATE TABLE IF EXISTS task_time_logs CASCADE;
TRUNCATE TABLE IF EXISTS task_activities CASCADE;
TRUNCATE TABLE IF EXISTS task_files CASCADE;
TRUNCATE TABLE IF EXISTS project_tasks CASCADE;
TRUNCATE TABLE IF EXISTS project_members CASCADE;
TRUNCATE TABLE IF EXISTS project_activities CASCADE;
TRUNCATE TABLE IF EXISTS project_files CASCADE;
TRUNCATE TABLE IF EXISTS projects CASCADE;
TRUNCATE TABLE IF EXISTS team_members CASCADE;
TRUNCATE TABLE IF EXISTS team_invitations CASCADE;
TRUNCATE TABLE IF EXISTS teams CASCADE;
TRUNCATE TABLE IF EXISTS task_tags CASCADE;
TRUNCATE TABLE IF EXISTS task_tag_relations CASCADE;
TRUNCATE TABLE IF EXISTS notifications CASCADE;
TRUNCATE TABLE IF EXISTS user_preferences CASCADE;
TRUNCATE TABLE IF EXISTS profiles CASCADE;

-- Foreign key constraint'leri tekrar etkinleştir
SET session_replication_role = DEFAULT;

-- Sequence'leri sıfırla (ID'ler 1'den başlasın)
ALTER SEQUENCE IF EXISTS teams_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS project_tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS task_dependencies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS task_assignments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS task_comments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS task_time_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS task_activities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS task_files_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS project_members_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS project_activities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS project_files_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS team_members_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS team_invitations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS task_tags_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS task_tag_relations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_preferences_id_seq RESTART WITH 1;

-- Başarı mesajı
SELECT 'Veritabanı başarıyla sıfırlandı! Tüm veriler silindi ve sequence'ler sıfırlandı.' as message;
