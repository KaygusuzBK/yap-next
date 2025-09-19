-- Hızlı RLS Düzeltmesi
-- Tüm politikaları sil ve basit olanları oluştur

-- 1. TÜM POLİTİKALARI SİL
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON ' || pol.schemaname || '.' || pol.tablename;
    END LOOP;
END $$;

-- 2. RLS'Yİ AKTİF ET
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

-- 3. BASİT POLİTİKALAR - Sadece giriş yapmış kullanıcılar için

-- PROFILES - Kullanıcı sadece kendi profilini görebilir
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (id = auth.uid());

-- TEAMS - Herkes görebilir
CREATE POLICY "teams_all" ON public.teams FOR ALL USING (true);

-- TEAM_MEMBERS - Herkes görebilir
CREATE POLICY "team_members_all" ON public.team_members FOR ALL USING (true);

-- TEAM_INVITATIONS - Herkes görebilir
CREATE POLICY "team_invitations_all" ON public.team_invitations FOR ALL USING (true);

-- PROJECTS - Herkes görebilir
CREATE POLICY "projects_all" ON public.projects FOR ALL USING (true);

-- PROJECT_MEMBERS - Herkes görebilir
CREATE POLICY "project_members_all" ON public.project_members FOR ALL USING (true);

-- PROJECT_TASKS - Herkes görebilir
CREATE POLICY "project_tasks_all" ON public.project_tasks FOR ALL USING (true);

-- PROJECT_COMMENTS - Herkes görebilir
CREATE POLICY "project_comments_all" ON public.project_comments FOR ALL USING (true);

-- PROJECT_FILES - Herkes görebilir
CREATE POLICY "project_files_all" ON public.project_files FOR ALL USING (true);

-- TASKS - Herkes görebilir
CREATE POLICY "tasks_all" ON public.tasks FOR ALL USING (true);

-- TASK_ASSIGNMENTS - Herkes görebilir
CREATE POLICY "task_assignments_all" ON public.task_assignments FOR ALL USING (true);

-- TASK_COMMENTS - Herkes görebilir
CREATE POLICY "task_comments_all" ON public.task_comments FOR ALL USING (true);

-- TASK_TIME_LOGS - Herkes görebilir
CREATE POLICY "task_time_logs_all" ON public.task_time_logs FOR ALL USING (true);

-- TASK_ACTIVITIES - Herkes görebilir
CREATE POLICY "task_activities_all" ON public.task_activities FOR ALL USING (true);

-- TASK_DEPENDENCIES - Herkes görebilir
CREATE POLICY "task_dependencies_all" ON public.task_dependencies FOR ALL USING (true);

-- TASK_FILES - Herkes görebilir
CREATE POLICY "task_files_all" ON public.task_files FOR ALL USING (true);

-- TASK_TAGS - Herkes görebilir
CREATE POLICY "task_tags_all" ON public.task_tags FOR ALL USING (true);

-- TASK_TAG_RELATIONS - Herkes görebilir
CREATE POLICY "task_tag_relations_all" ON public.task_tag_relations FOR ALL USING (true);

-- NOTIFICATIONS - Kullanıcı sadece kendi bildirimlerini görebilir
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- USER_PREFERENCES - Kullanıcı sadece kendi tercihlerini görebilir
CREATE POLICY "user_preferences_own" ON public.user_preferences FOR ALL USING (user_id = auth.uid());

-- PROJECT_TASK_STATUSES - Herkes görebilir
CREATE POLICY "project_task_statuses_all" ON public.project_task_statuses FOR ALL USING (true);

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
