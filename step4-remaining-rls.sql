-- ADIM 4: KALAN TABLOLAR İÇİN RLS (Güvenli)
-- Üçüncü adım başarılı olduktan sonra bu scripti çalıştır

-- PROJECT_COMMENTS - Proje yorumları
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "project_comments_select_team" ON public.project_comments;
DROP POLICY IF EXISTS "project_comments_insert_team" ON public.project_comments;
DROP POLICY IF EXISTS "project_comments_update_owner" ON public.project_comments;
DROP POLICY IF EXISTS "project_comments_delete_owner" ON public.project_comments;
DROP POLICY IF EXISTS "project_comments_rw" ON public.project_comments;

-- Yeni temiz politikalar
CREATE POLICY "project_comments_select_team" ON public.project_comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_comments.project_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_comments.project_id AND user_id = auth.uid())
);
CREATE POLICY "project_comments_insert_team" ON public.project_comments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_comments.project_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_comments.project_id AND user_id = auth.uid())
);
CREATE POLICY "project_comments_update_owner" ON public.project_comments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_comments.project_id AND owner_id = auth.uid())
);
CREATE POLICY "project_comments_delete_owner" ON public.project_comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_comments.project_id AND owner_id = auth.uid())
);

-- PROJECT_FILES - Proje dosyaları
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "project_files_select_team" ON public.project_files;
DROP POLICY IF EXISTS "project_files_insert_team" ON public.project_files;
DROP POLICY IF EXISTS "project_files_update_owner" ON public.project_files;
DROP POLICY IF EXISTS "project_files_delete_owner" ON public.project_files;
DROP POLICY IF EXISTS "project_files_rw" ON public.project_files;

-- Yeni temiz politikalar
CREATE POLICY "project_files_select_team" ON public.project_files FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_files.project_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_files.project_id AND user_id = auth.uid())
);
CREATE POLICY "project_files_insert_team" ON public.project_files FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_files.project_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_files.project_id AND user_id = auth.uid())
);
CREATE POLICY "project_files_update_owner" ON public.project_files FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_files.project_id AND owner_id = auth.uid())
);
CREATE POLICY "project_files_delete_owner" ON public.project_files FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_files.project_id AND owner_id = auth.uid())
);

-- NOTIFICATIONS - Bildirimler
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;

-- Yeni temiz politikalar
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- USER_PREFERENCES - Kullanıcı tercihleri
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
DROP POLICY IF EXISTS "user_preferences_delete_own" ON public.user_preferences;
DROP POLICY IF EXISTS "select own prefs" ON public.user_preferences;
DROP POLICY IF EXISTS "insert own prefs" ON public.user_preferences;
DROP POLICY IF EXISTS "update own prefs" ON public.user_preferences;

-- Yeni temiz politikalar
CREATE POLICY "user_preferences_select_own" ON public.user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_preferences_insert_own" ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_preferences_update_own" ON public.user_preferences FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_preferences_delete_own" ON public.user_preferences FOR DELETE USING (user_id = auth.uid());

-- SONUÇLARI KONTROL ET
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
    AND tablename IN ('project_comments', 'project_files', 'notifications', 'user_preferences')
ORDER BY tablename;
