-- ADIM 3: GÖREVLER İÇİN RLS (Güvenli)
-- İkinci adım başarılı olduktan sonra bu scripti çalıştır

-- PROJECT_TASKS - Proje görevleri
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "project_tasks_select_team" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_insert_owner" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_update_owner" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_delete_owner" ON public.project_tasks;
DROP POLICY IF EXISTS "tasks_select" ON public.project_tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.project_tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.project_tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.project_tasks;

-- Yeni temiz politikalar
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

-- TASKS - Eski görevler tablosu (eğer varsa)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "tasks_select_team" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_owner" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_owner" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_owner" ON public.tasks;

-- Yeni temiz politikalar
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

-- SONUÇLARI KONTROL ET
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
    AND tablename IN ('project_tasks', 'tasks')
ORDER BY tablename;
