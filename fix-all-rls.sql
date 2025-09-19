-- Tüm RLS hatalarını düzelt
-- Bu script Supabase SQL Editor'de çalıştırılmalı

-- 1. Önce tüm mevcut politikaları temizle
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END$$;

-- 2. Tüm tablolarda RLS'yi aktif et
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
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES - Kullanıcı sadece kendi profilini görebilir
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. TEAMS - Sahip ve üyeler görebilir, sadece sahip düzenleyebilir
CREATE POLICY "teams_select_owner" ON public.teams FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "teams_select_member" ON public.teams FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = teams.id AND user_id = auth.uid())
);
CREATE POLICY "teams_insert_owner" ON public.teams FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "teams_update_owner" ON public.teams FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "teams_delete_owner" ON public.teams FOR DELETE USING (owner_id = auth.uid());

-- 5. TEAM_MEMBERS - Sahip ve üyeler görebilir, sadece sahip yönetebilir
CREATE POLICY "team_members_select_owner" ON public.team_members FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_members_insert_owner" ON public.team_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_members_update_owner" ON public.team_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_members_delete_owner" ON public.team_members FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
);

-- 6. TEAM_INVITATIONS - Sahip ve davet edilen kişi görebilir
CREATE POLICY "team_invitations_select_owner" ON public.team_invitations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_invitations.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_invitations_select_invited" ON public.team_invitations FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "team_invitations_insert_owner" ON public.team_invitations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_invitations.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_invitations_update_owner" ON public.team_invitations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_invitations.team_id AND owner_id = auth.uid())
);
CREATE POLICY "team_invitations_delete_owner" ON public.team_invitations FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_invitations.team_id AND owner_id = auth.uid())
);

-- 7. PROJECTS - Takım sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
CREATE POLICY "projects_select_team_owner" ON public.projects FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = projects.team_id AND user_id = auth.uid())
);
CREATE POLICY "projects_insert_owner" ON public.projects FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "projects_update_owner" ON public.projects FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "projects_delete_owner" ON public.projects FOR DELETE USING (owner_id = auth.uid());

-- 8. PROJECT_MEMBERS - Proje sahibi ve üyeleri görebilir, sadece sahip yönetebilir
CREATE POLICY "project_members_select_owner" ON public.project_members FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_members.project_id AND owner_id = auth.uid())
);
CREATE POLICY "project_members_insert_owner" ON public.project_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_members.project_id AND owner_id = auth.uid())
);
CREATE POLICY "project_members_update_owner" ON public.project_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_members.project_id AND owner_id = auth.uid())
);
CREATE POLICY "project_members_delete_owner" ON public.project_members FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_members.project_id AND owner_id = auth.uid())
);

-- 9. PROJECT_TASKS - Proje sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
CREATE POLICY "project_tasks_select_team" ON public.project_tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_tasks.project_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_tasks.project_id AND user_id = auth.uid())
);
CREATE POLICY "project_tasks_insert_owner" ON public.project_tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_tasks.project_id AND owner_id = auth.uid())
);
CREATE POLICY "project_tasks_update_owner" ON public.project_tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_tasks.project_id AND owner_id = auth.uid())
);
CREATE POLICY "project_tasks_delete_owner" ON public.project_tasks FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_tasks.project_id AND owner_id = auth.uid())
);

-- 10. PROJECT_COMMENTS - Proje sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
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

-- 11. PROJECT_FILES - Proje sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
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

-- 12. TASKS - Proje sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
CREATE POLICY "tasks_select_team" ON public.tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
);
CREATE POLICY "tasks_insert_owner" ON public.tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND owner_id = auth.uid())
);
CREATE POLICY "tasks_update_owner" ON public.tasks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND owner_id = auth.uid())
);
CREATE POLICY "tasks_delete_owner" ON public.tasks FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND owner_id = auth.uid())
);

-- 13. TASK_COMMENTS - Proje sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
CREATE POLICY "task_comments_select_team" ON public.task_comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_comments.task_id AND (p.owner_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
);
CREATE POLICY "task_comments_insert_team" ON public.task_comments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_comments.task_id AND (p.owner_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
);
CREATE POLICY "task_comments_update_owner" ON public.task_comments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_comments.task_id AND p.owner_id = auth.uid())
);
CREATE POLICY "task_comments_delete_owner" ON public.task_comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_comments.task_id AND p.owner_id = auth.uid())
);

-- 14. TASK_TIME_LOGS - Proje sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
CREATE POLICY "task_time_logs_select_team" ON public.task_time_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_time_logs.task_id AND (p.owner_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
);
CREATE POLICY "task_time_logs_insert_team" ON public.task_time_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_time_logs.task_id AND (p.owner_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
);
CREATE POLICY "task_time_logs_update_owner" ON public.task_time_logs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_time_logs.task_id AND p.owner_id = auth.uid())
);
CREATE POLICY "task_time_logs_delete_owner" ON public.task_time_logs FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_time_logs.task_id AND p.owner_id = auth.uid())
);

-- 15. TASK_ACTIVITIES - Proje sahibi ve üyeleri görebilir
CREATE POLICY "task_activities_select_team" ON public.task_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_activities.task_id AND (p.owner_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
);

-- 16. TASK_ASSIGNMENTS - Proje sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
CREATE POLICY "task_assignments_select_team" ON public.task_assignments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_assignments.task_id AND (p.owner_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
);
CREATE POLICY "task_assignments_insert_owner" ON public.task_assignments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_assignments.task_id AND p.owner_id = auth.uid())
);
CREATE POLICY "task_assignments_update_owner" ON public.task_assignments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_assignments.task_id AND p.owner_id = auth.uid())
);
CREATE POLICY "task_assignments_delete_owner" ON public.task_assignments FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_assignments.task_id AND p.owner_id = auth.uid())
);

-- 17. TASK_FILES - Proje sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
CREATE POLICY "task_files_select_team" ON public.task_files FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_files.task_id AND (p.owner_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
);
CREATE POLICY "task_files_insert_team" ON public.task_files FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_files.task_id AND (p.owner_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
);
CREATE POLICY "task_files_update_owner" ON public.task_files FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_files.task_id AND p.owner_id = auth.uid())
);
CREATE POLICY "task_files_delete_owner" ON public.task_files FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_files.task_id AND p.owner_id = auth.uid())
);

-- 18. TASK_TAGS - Herkes görebilir, sadece sahip düzenleyebilir
CREATE POLICY "task_tags_select_all" ON public.task_tags FOR SELECT USING (true);
CREATE POLICY "task_tags_insert_owner" ON public.task_tags FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = task_tags.project_id AND owner_id = auth.uid())
);
CREATE POLICY "task_tags_update_owner" ON public.task_tags FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = task_tags.project_id AND owner_id = auth.uid())
);
CREATE POLICY "task_tags_delete_owner" ON public.task_tags FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = task_tags.project_id AND owner_id = auth.uid())
);

-- 19. TASK_TAG_RELATIONS - Proje sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
CREATE POLICY "task_tag_relations_select_team" ON public.task_tag_relations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_tag_relations.task_id AND (p.owner_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
);
CREATE POLICY "task_tag_relations_insert_owner" ON public.task_tag_relations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_tag_relations.task_id AND p.owner_id = auth.uid())
);
CREATE POLICY "task_tag_relations_update_owner" ON public.task_tag_relations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_tag_relations.task_id AND p.owner_id = auth.uid())
);
CREATE POLICY "task_tag_relations_delete_owner" ON public.task_tag_relations FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_tag_relations.task_id AND p.owner_id = auth.uid())
);

-- 20. PROJECT_TASK_STATUSES - Proje sahibi ve üyeleri görebilir, sadece sahip düzenleyebilir
CREATE POLICY "project_task_statuses_select_team" ON public.project_task_statuses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_task_statuses.project_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_task_statuses.project_id AND user_id = auth.uid())
);
CREATE POLICY "project_task_statuses_insert_owner" ON public.project_task_statuses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_task_statuses.project_id AND owner_id = auth.uid())
);
CREATE POLICY "project_task_statuses_update_owner" ON public.project_task_statuses FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_task_statuses.project_id AND owner_id = auth.uid())
);
CREATE POLICY "project_task_statuses_delete_owner" ON public.project_task_statuses FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_task_statuses.project_id AND owner_id = auth.uid())
);

-- 21. NOTIFICATIONS - Kullanıcı sadece kendi bildirimlerini görebilir
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- 22. USER_PREFERENCES - Kullanıcı sadece kendi tercihlerini görebilir
CREATE POLICY "user_preferences_select_own" ON public.user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_preferences_insert_own" ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_preferences_update_own" ON public.user_preferences FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_preferences_delete_own" ON public.user_preferences FOR DELETE USING (user_id = auth.uid());

-- 23. Security Definer View'ları düzelt
ALTER VIEW public.task_dependency_status SET (security_invoker = true);
ALTER VIEW public.task_status_transitions SET (security_invoker = true);
ALTER VIEW public.task_status_durations SET (security_invoker = true);
ALTER VIEW public.task_status_timeline SET (security_invoker = true);
ALTER VIEW public.project_task_stats SET (security_invoker = true);
ALTER VIEW public.task_status_intervals SET (security_invoker = true);

-- Sonuçları kontrol et
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
ORDER BY tablename;
