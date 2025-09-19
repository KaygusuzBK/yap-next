-- ADIM 2: PROJELER İÇİN RLS (Güvenli)
-- İlk adım başarılı olduktan sonra bu scripti çalıştır

-- PROJECTS - Proje yönetimi
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "projects_select_team_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_update_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_owner" ON public.projects;
DROP POLICY IF EXISTS "prj_select" ON public.projects;
DROP POLICY IF EXISTS "prj_insert" ON public.projects;
DROP POLICY IF EXISTS "prj_update" ON public.projects;
DROP POLICY IF EXISTS "prj_delete" ON public.projects;
DROP POLICY IF EXISTS "read own projects" ON public.projects;
DROP POLICY IF EXISTS "insert own projects" ON public.projects;
DROP POLICY IF EXISTS "update own projects" ON public.projects;
DROP POLICY IF EXISTS "delete own projects" ON public.projects;

-- Yeni temiz politikalar
CREATE POLICY "projects_select_team_owner" ON public.projects FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = projects.team_id AND user_id = auth.uid())
);
CREATE POLICY "projects_insert_owner" ON public.projects FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "projects_update_owner" ON public.projects FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "projects_delete_owner" ON public.projects FOR DELETE USING (owner_id = auth.uid());

-- PROJECT_MEMBERS - Proje üyeleri
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "project_members_select_owner" ON public.project_members;
DROP POLICY IF EXISTS "project_members_insert_owner" ON public.project_members;
DROP POLICY IF EXISTS "project_members_update_owner" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete_owner" ON public.project_members;
DROP POLICY IF EXISTS "pm_select" ON public.project_members;
DROP POLICY IF EXISTS "pm_insert" ON public.project_members;
DROP POLICY IF EXISTS "pm_update" ON public.project_members;
DROP POLICY IF EXISTS "pm_delete" ON public.project_members;

-- Yeni temiz politikalar
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

-- SONUÇLARI KONTROL ET
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
    AND tablename IN ('projects', 'project_members')
ORDER BY tablename;
