-- Gevşetilmiş RLS Politikaları
-- 500 hatalarını çözmek için daha basit politikalar

-- Mevcut politikaları temizle
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Tüm tablolardaki politikaları sil
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "profiles_select_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "profiles_update_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "teams_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "teams_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "teams_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "teams_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "team_members_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "team_members_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "team_members_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "team_members_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "team_invitations_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "team_invitations_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "team_invitations_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "team_invitations_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "projects_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "projects_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "projects_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "projects_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_members_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_members_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_members_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_members_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_tasks_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_tasks_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_tasks_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_tasks_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_comments_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_comments_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_comments_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_comments_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_files_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_files_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_files_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_files_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "tasks_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "tasks_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "tasks_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "tasks_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_assignments_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_assignments_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_assignments_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_assignments_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_comments_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_comments_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_comments_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_comments_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_time_logs_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_time_logs_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_time_logs_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_time_logs_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_activities_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_dependencies_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_dependencies_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_dependencies_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_dependencies_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_files_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_files_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_files_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_files_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_tags_select_all" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_tags_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_tags_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_tags_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_tag_relations_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_tag_relations_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_tag_relations_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "task_tag_relations_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "notifications_select_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "notifications_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "notifications_update_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "notifications_delete_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "user_preferences_select_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "user_preferences_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "user_preferences_update_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "user_preferences_delete_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_task_statuses_select_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_task_statuses_insert_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_task_statuses_update_authenticated" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "project_task_statuses_delete_authenticated" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- RLS'yi tüm tablolarda aktif et
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_statuses ENABLE ROW LEVEL SECURITY;

-- BASİT POLİTİKALAR - Sadece giriş yapmış kullanıcılar için

-- 1. PROFILES - Kullanıcı sadece kendi profilini görebilir
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- 2. TEAMS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "teams_select_authenticated" ON public.teams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "teams_insert_authenticated" ON public.teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "teams_update_authenticated" ON public.teams FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "teams_delete_authenticated" ON public.teams FOR DELETE USING (auth.uid() IS NOT NULL);

-- 3. TEAM_MEMBERS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "team_members_select_authenticated" ON public.team_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "team_members_insert_authenticated" ON public.team_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "team_members_update_authenticated" ON public.team_members FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "team_members_delete_authenticated" ON public.team_members FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. TEAM_INVITATIONS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "team_invitations_select_authenticated" ON public.team_invitations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "team_invitations_insert_authenticated" ON public.team_invitations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "team_invitations_update_authenticated" ON public.team_invitations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "team_invitations_delete_authenticated" ON public.team_invitations FOR DELETE USING (auth.uid() IS NOT NULL);

-- 5. PROJECTS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "projects_select_authenticated" ON public.projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "projects_insert_authenticated" ON public.projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "projects_update_authenticated" ON public.projects FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "projects_delete_authenticated" ON public.projects FOR DELETE USING (auth.uid() IS NOT NULL);

-- 6. PROJECT_MEMBERS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "project_members_select_authenticated" ON public.project_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_members_insert_authenticated" ON public.project_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "project_members_update_authenticated" ON public.project_members FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_members_delete_authenticated" ON public.project_members FOR DELETE USING (auth.uid() IS NOT NULL);

-- 7. PROJECT_TASKS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "project_tasks_select_authenticated" ON public.project_tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_tasks_insert_authenticated" ON public.project_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "project_tasks_update_authenticated" ON public.project_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_tasks_delete_authenticated" ON public.project_tasks FOR DELETE USING (auth.uid() IS NOT NULL);

-- 8. PROJECT_COMMENTS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "project_comments_select_authenticated" ON public.project_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_comments_insert_authenticated" ON public.project_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "project_comments_update_authenticated" ON public.project_comments FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_comments_delete_authenticated" ON public.project_comments FOR DELETE USING (auth.uid() IS NOT NULL);

-- 9. PROJECT_FILES - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "project_files_select_authenticated" ON public.project_files FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_files_insert_authenticated" ON public.project_files FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "project_files_update_authenticated" ON public.project_files FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_files_delete_authenticated" ON public.project_files FOR DELETE USING (auth.uid() IS NOT NULL);

-- 10. TASKS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "tasks_select_authenticated" ON public.tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_insert_authenticated" ON public.tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_update_authenticated" ON public.tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_delete_authenticated" ON public.tasks FOR DELETE USING (auth.uid() IS NOT NULL);

-- 11. TASK_ASSIGNMENTS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "task_assignments_select_authenticated" ON public.task_assignments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_assignments_insert_authenticated" ON public.task_assignments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "task_assignments_update_authenticated" ON public.task_assignments FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_assignments_delete_authenticated" ON public.task_assignments FOR DELETE USING (auth.uid() IS NOT NULL);

-- 12. TASK_COMMENTS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "task_comments_select_authenticated" ON public.task_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_comments_insert_authenticated" ON public.task_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "task_comments_update_authenticated" ON public.task_comments FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_comments_delete_authenticated" ON public.task_comments FOR DELETE USING (auth.uid() IS NOT NULL);

-- 13. TASK_TIME_LOGS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "task_time_logs_select_authenticated" ON public.task_time_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_time_logs_insert_authenticated" ON public.task_time_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "task_time_logs_update_authenticated" ON public.task_time_logs FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_time_logs_delete_authenticated" ON public.task_time_logs FOR DELETE USING (auth.uid() IS NOT NULL);

-- 14. TASK_ACTIVITIES - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "task_activities_select_authenticated" ON public.task_activities FOR SELECT USING (auth.uid() IS NOT NULL);

-- 15. TASK_DEPENDENCIES - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "task_dependencies_select_authenticated" ON public.task_dependencies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_dependencies_insert_authenticated" ON public.task_dependencies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "task_dependencies_update_authenticated" ON public.task_dependencies FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_dependencies_delete_authenticated" ON public.task_dependencies FOR DELETE USING (auth.uid() IS NOT NULL);

-- 16. TASK_FILES - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "task_files_select_authenticated" ON public.task_files FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_files_insert_authenticated" ON public.task_files FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "task_files_update_authenticated" ON public.task_files FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_files_delete_authenticated" ON public.task_files FOR DELETE USING (auth.uid() IS NOT NULL);

-- 17. TASK_TAGS - Herkes görebilir
CREATE POLICY "task_tags_select_all" ON public.task_tags FOR SELECT USING (true);
CREATE POLICY "task_tags_insert_authenticated" ON public.task_tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "task_tags_update_authenticated" ON public.task_tags FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_tags_delete_authenticated" ON public.task_tags FOR DELETE USING (auth.uid() IS NOT NULL);

-- 18. TASK_TAG_RELATIONS - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "task_tag_relations_select_authenticated" ON public.task_tag_relations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_tag_relations_insert_authenticated" ON public.task_tag_relations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "task_tag_relations_update_authenticated" ON public.task_tag_relations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "task_tag_relations_delete_authenticated" ON public.task_tag_relations FOR DELETE USING (auth.uid() IS NOT NULL);

-- 19. NOTIFICATIONS - Kullanıcı sadece kendi bildirimlerini görebilir
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- 20. USER_PREFERENCES - Kullanıcı sadece kendi tercihlerini görebilir
CREATE POLICY "user_preferences_select_own" ON public.user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_preferences_insert_own" ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_preferences_update_own" ON public.user_preferences FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_preferences_delete_own" ON public.user_preferences FOR DELETE USING (user_id = auth.uid());

-- 21. PROJECT_TASK_STATUSES - Giriş yapmış kullanıcılar görebilir
CREATE POLICY "project_task_statuses_select_authenticated" ON public.project_task_statuses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_task_statuses_insert_authenticated" ON public.project_task_statuses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "project_task_statuses_update_authenticated" ON public.project_task_statuses FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "project_task_statuses_delete_authenticated" ON public.project_task_statuses FOR DELETE USING (auth.uid() IS NOT NULL);

-- View'ları düzelt
ALTER VIEW public.task_dependency_status SET (security_invoker = true);
ALTER VIEW public.task_status_transitions SET (security_invoker = true);
ALTER VIEW public.task_status_durations SET (security_invoker = true);
ALTER VIEW public.task_status_timeline SET (security_invoker = true);
ALTER VIEW public.project_task_stats SET (security_invoker = true);
ALTER VIEW public.task_status_intervals SET (security_invoker = true);

-- Sonuç kontrolü
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
ORDER BY tablename;
