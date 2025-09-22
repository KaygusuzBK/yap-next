-- Sadece Verileri Sil - Tabloları Koru
-- ✅ Bu script sadece verileri temizler, tablo yapısını korur

-- Foreign key constraint'leri geçici olarak devre dışı bırak
SET session_replication_role = replica;

-- Tüm tabloları temizle (sadece verileri sil)
TRUNCATE TABLE task_dependencies CASCADE;
TRUNCATE TABLE task_assignments CASCADE;
TRUNCATE TABLE task_comments CASCADE;
TRUNCATE TABLE task_time_logs CASCADE;
TRUNCATE TABLE task_activities CASCADE;
TRUNCATE TABLE task_files CASCADE;
TRUNCATE TABLE project_tasks CASCADE;
TRUNCATE TABLE project_members CASCADE;
TRUNCATE TABLE project_activities CASCADE;
TRUNCATE TABLE project_files CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE team_members CASCADE;
TRUNCATE TABLE team_invitations CASCADE;
TRUNCATE TABLE teams CASCADE;
TRUNCATE TABLE task_tags CASCADE;
TRUNCATE TABLE task_tag_relations CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE user_preferences CASCADE;
TRUNCATE TABLE profiles CASCADE;

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
SELECT '✅ Tüm veriler başarıyla silindi! Tablolar korundu ve sequence''ler sıfırlandı.' as message;
