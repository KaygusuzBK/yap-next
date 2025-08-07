-- =====================================================
-- YAP PROJE - SUPABASE INITIAL SETUP
-- =====================================================
-- Bu dosya, ilk kurulum için tüm ana veritabanı yapılarını içerir.
-- Tarih: 2025-08-07

-- 1. EXTENSIONS
\i 01-extensions.sql

-- 2. TABLES
\i tables/projects.sql
\i tables/tasks.sql
\i tables/comments.sql
\i tables/project_members.sql
\i tables/task_assignments.sql
\i tables/project_files.sql
\i tables/task_time_logs.sql
\i tables/project_activities.sql
\i tables/user_preferences.sql
\i tables/notifications.sql

-- 3. INDEXES
\i indexes/tasks.sql

-- 4. FUNCTIONS
\i functions/update_updated_at.sql

-- 5. VIEWS
\i views/project_stats.sql
\i views/task_stats.sql

-- 6. POLICIES
\i policies/projects.sql

-- NOT: Diğer tablo, index, policy, function ve view dosyalarını da benzer şekilde ekleyebilirsiniz.
-- NOT: Sıralama önemlidir, önce tablo, sonra index, sonra fonksiyon, sonra policy gelmelidir.

-- Kurulum tamamlandıktan sonra, update'ler için 'updates/' klasörüne yeni dosyalar ekleyin.
