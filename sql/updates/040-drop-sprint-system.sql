-- 040-drop-sprint-system.sql
-- Amaç: Sprint sistemi ile ilgili TÜM veritabanı nesnelerini temizlemek
-- Güvenli: IF EXISTS kullanılır, sıraya dikkat edilir

BEGIN;

-- 1) View'lar
DROP VIEW IF EXISTS public.sprint_members_view;
DROP VIEW IF EXISTS public.sprint_stats;

-- 2) Sprints üzerindeki tetikleyiciler
DROP TRIGGER IF EXISTS update_sprint_updated_at ON public.sprints;
DROP TRIGGER IF EXISTS create_sprint_activity_trigger ON public.sprints;
DROP TRIGGER IF EXISTS track_sprint_status_change_trigger ON public.sprints;

-- 3) Tetikleyici fonksiyonları (eğer ayrı fonksiyonlar olarak tanımlandıysa)
DROP FUNCTION IF EXISTS public.update_sprint_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.create_sprint_activity() CASCADE;
DROP FUNCTION IF EXISTS public.track_sprint_status_change() CASCADE;

-- 4) RPC / yardımcı fonksiyonlar
DROP FUNCTION IF EXISTS public.create_sprint(p_project_id uuid, p_name text, p_description text, p_start_date date, p_end_date date) CASCADE;
DROP FUNCTION IF EXISTS public.close_sprint(p_sprint_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.open_sprint(p_sprint_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_sprint_tasks(sprint_uuid uuid) CASCADE;

-- 5) RLS politikaları (sprints, sprint_members, sprint_activities)
-- sprints
DROP POLICY IF EXISTS "Users can view sprints of their projects" ON public.sprints;
DROP POLICY IF EXISTS "Users can create sprints in their projects" ON public.sprints;
DROP POLICY IF EXISTS "Users can update sprints they own or are admin" ON public.sprints;
DROP POLICY IF EXISTS "Users can delete sprints they own or are admin" ON public.sprints;

-- sprint_members
DROP POLICY IF EXISTS "Users can view sprint members of their projects" ON public.sprint_members;
DROP POLICY IF EXISTS "Sprint owners can manage members" ON public.sprint_members;

-- sprint_activities
DROP POLICY IF EXISTS "Users can view sprint activities of their projects" ON public.sprint_activities;
DROP POLICY IF EXISTS "Users can create sprint activities" ON public.sprint_activities;

-- 6) tasks tablosundaki sprint ile ilgili index ve kolon
DROP INDEX IF EXISTS public.idx_tasks_sprint_id;
ALTER TABLE IF EXISTS public.tasks DROP COLUMN IF EXISTS sprint_id;

-- 7) Sprint tablolarını kaldır (bağımlılık sırası önemli)
DROP TABLE IF EXISTS public.sprint_activities CASCADE;
DROP TABLE IF EXISTS public.sprint_members CASCADE;
DROP TABLE IF EXISTS public.sprints CASCADE;

-- 8) İlgili olabilecek artık indexler
DROP INDEX IF EXISTS public.idx_sprints_project_id;
DROP INDEX IF EXISTS public.idx_sprints_status;
DROP INDEX IF EXISTS public.idx_sprints_dates;
DROP INDEX IF EXISTS public.idx_sprint_members_sprint_id;
DROP INDEX IF EXISTS public.idx_sprint_members_user_id;
DROP INDEX IF EXISTS public.idx_sprint_activities_sprint_id;

COMMIT;
