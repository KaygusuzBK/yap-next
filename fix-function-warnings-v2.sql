-- Function Search Path Warnings Düzeltmesi v2
-- Önce mevcut fonksiyonları sil, sonra yenilerini oluştur

-- 1. Mevcut fonksiyonları sil
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.get_task_dependency_stats(UUID);
DROP FUNCTION IF EXISTS public.get_team_stats(UUID);
DROP FUNCTION IF EXISTS public.is_team_admin(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_team_owner(UUID, UUID);
DROP FUNCTION IF EXISTS public.check_dependency_cycle(UUID, UUID);
DROP FUNCTION IF EXISTS public.update_task_dependency_updated_at();
DROP FUNCTION IF EXISTS public.get_dependency_chain(UUID);
DROP FUNCTION IF EXISTS public.set_updated_at_prefs();
DROP FUNCTION IF EXISTS public.get_recent_activities(INTEGER);
DROP FUNCTION IF EXISTS public.get_user_projects(UUID);
DROP FUNCTION IF EXISTS public.handle_new_task();
DROP FUNCTION IF EXISTS public.get_task_statistics(UUID);
DROP FUNCTION IF EXISTS public.handle_task_assignment();
DROP FUNCTION IF EXISTS public.handle_task_update();
DROP FUNCTION IF EXISTS public.search_tasks(TEXT, UUID);
DROP FUNCTION IF EXISTS public.handle_new_task_assignment();
DROP FUNCTION IF EXISTS public.handle_task_delete();
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_project();
DROP FUNCTION IF EXISTS public.trigger_set_timestamp();
DROP FUNCTION IF EXISTS public.get_task_details(UUID);
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.check_primary_project_belongs_to_team();
DROP FUNCTION IF EXISTS public.get_project_stats(UUID);
DROP FUNCTION IF EXISTS public.validate_team_primary_project();

-- 2. Yeniden oluştur - search_path ile

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- get_task_dependency_stats
CREATE OR REPLACE FUNCTION public.get_task_dependency_stats(task_id UUID)
RETURNS TABLE(
    total_dependencies INTEGER,
    completed_dependencies INTEGER,
    pending_dependencies INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_dependencies,
        COUNT(CASE WHEN pt.status = 'completed' THEN 1 END)::INTEGER as completed_dependencies,
        COUNT(CASE WHEN pt.status != 'completed' THEN 1 END)::INTEGER as pending_dependencies
    FROM public.task_dependencies td
    JOIN public.project_tasks pt ON td.depends_on_task_id = pt.id
    WHERE td.task_id = $1;
END;
$$;

-- get_team_stats
CREATE OR REPLACE FUNCTION public.get_team_stats(team_id UUID)
RETURNS TABLE(
    member_count BIGINT,
    project_count BIGINT,
    active_task_count BIGINT,
    completed_task_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.team_members WHERE team_id = $1) as member_count,
        (SELECT COUNT(*) FROM public.projects WHERE team_id = $1) as project_count,
        (SELECT COUNT(*) FROM public.project_tasks pt 
         JOIN public.projects p ON pt.project_id = p.id 
         WHERE p.team_id = $1 AND pt.status != 'completed') as active_task_count,
        (SELECT COUNT(*) FROM public.project_tasks pt 
         JOIN public.projects p ON pt.project_id = p.id 
         WHERE p.team_id = $1 AND pt.status = 'completed') as completed_task_count;
END;
$$;

-- is_team_admin
CREATE OR REPLACE FUNCTION public.is_team_admin(team_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.team_members 
        WHERE team_id = $1 AND user_id = $2 AND role = 'admin'
    );
END;
$$;

-- is_team_owner
CREATE OR REPLACE FUNCTION public.is_team_owner(team_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.teams 
        WHERE id = $1 AND owner_id = $2
    );
END;
$$;

-- check_dependency_cycle
CREATE OR REPLACE FUNCTION public.check_dependency_cycle(task_id UUID, depends_on_task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cycle_found BOOLEAN := FALSE;
BEGIN
    IF task_id = depends_on_task_id THEN
        RETURN TRUE;
    END IF;
    
    WITH RECURSIVE dependency_chain AS (
        SELECT td.task_id, td.depends_on_task_id, 1 as depth
        FROM public.task_dependencies td
        WHERE td.task_id = $1
        
        UNION ALL
        
        SELECT td.task_id, td.depends_on_task_id, dc.depth + 1
        FROM public.task_dependencies td
        JOIN dependency_chain dc ON td.task_id = dc.depends_on_task_id
        WHERE dc.depth < 10
    )
    SELECT EXISTS(
        SELECT 1 FROM dependency_chain 
        WHERE depends_on_task_id = $1
    ) INTO cycle_found;
    
    RETURN cycle_found;
END;
$$;

-- update_task_dependency_updated_at
CREATE OR REPLACE FUNCTION public.update_task_dependency_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.project_tasks 
    SET updated_at = NOW() 
    WHERE id = NEW.task_id;
    RETURN NEW;
END;
$$;

-- get_dependency_chain
CREATE OR REPLACE FUNCTION public.get_dependency_chain(task_id UUID)
RETURNS TABLE(
    task_id UUID,
    depends_on_task_id UUID,
    depth INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE dependency_chain AS (
        SELECT td.task_id, td.depends_on_task_id, 1 as depth
        FROM public.task_dependencies td
        WHERE td.task_id = $1
        
        UNION ALL
        
        SELECT td.task_id, td.depends_on_task_id, dc.depth + 1
        FROM public.task_dependencies td
        JOIN dependency_chain dc ON td.task_id = dc.depends_on_task_id
        WHERE dc.depth < 10
    )
    SELECT * FROM dependency_chain;
END;
$$;

-- set_updated_at_prefs
CREATE OR REPLACE FUNCTION public.set_updated_at_prefs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- get_recent_activities
CREATE OR REPLACE FUNCTION public.get_recent_activities(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
    id UUID,
    action TEXT,
    details JSONB,
    created_at TIMESTAMPTZ,
    user_id UUID,
    task_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ta.id,
        ta.action,
        ta.details,
        ta.created_at,
        ta.user_id,
        ta.task_id
    FROM public.task_activities ta
    ORDER BY ta.created_at DESC
    LIMIT limit_count;
END;
$$;

-- get_user_projects
CREATE OR REPLACE FUNCTION public.get_user_projects(user_id UUID)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.status,
        p.created_at,
        p.updated_at
    FROM public.projects p
    LEFT JOIN public.project_members pm ON p.id = pm.project_id
    WHERE p.owner_id = user_id OR pm.user_id = user_id
    ORDER BY p.created_at DESC;
END;
$$;

-- handle_new_task
CREATE OR REPLACE FUNCTION public.handle_new_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.task_activities (task_id, user_id, action, details)
    VALUES (NEW.id, NEW.created_by, 'created', jsonb_build_object('title', NEW.title));
    RETURN NEW;
END;
$$;

-- get_task_statistics
CREATE OR REPLACE FUNCTION public.get_task_statistics(project_id UUID DEFAULT NULL)
RETURNS TABLE(
    total_tasks BIGINT,
    completed_tasks BIGINT,
    in_progress_tasks BIGINT,
    todo_tasks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks
    FROM public.project_tasks
    WHERE (project_id IS NULL OR project_id = $1);
END;
$$;

-- handle_task_assignment
CREATE OR REPLACE FUNCTION public.handle_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.task_activities (task_id, user_id, action, details)
    VALUES (NEW.task_id, NEW.user_id, 'assigned', jsonb_build_object('assigned_by', NEW.assigned_by));
    RETURN NEW;
END;
$$;

-- handle_task_update
CREATE OR REPLACE FUNCTION public.handle_task_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.task_activities (task_id, user_id, action, details)
    VALUES (NEW.id, NEW.created_by, 'updated', jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_priority', OLD.priority,
        'new_priority', NEW.priority
    ));
    RETURN NEW;
END;
$$;

-- search_tasks
CREATE OR REPLACE FUNCTION public.search_tasks(search_term TEXT, project_id UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    project_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.id,
        pt.title,
        pt.description,
        pt.status,
        pt.priority,
        p.title as project_title
    FROM public.project_tasks pt
    JOIN public.projects p ON pt.project_id = p.id
    WHERE (project_id IS NULL OR pt.project_id = project_id)
    AND (pt.title ILIKE '%' || search_term || '%' OR pt.description ILIKE '%' || search_term || '%')
    ORDER BY pt.created_at DESC;
END;
$$;

-- handle_new_task_assignment
CREATE OR REPLACE FUNCTION public.handle_new_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.task_activities (task_id, user_id, action, details)
    VALUES (NEW.task_id, NEW.user_id, 'assigned', jsonb_build_object('assigned_by', NEW.assigned_by));
    RETURN NEW;
END;
$$;

-- handle_task_delete
CREATE OR REPLACE FUNCTION public.handle_task_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.task_activities (task_id, user_id, action, details)
    VALUES (OLD.id, OLD.created_by, 'deleted', jsonb_build_object('title', OLD.title));
    RETURN OLD;
END;
$$;

-- handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- handle_new_project
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.task_activities (task_id, user_id, action, details)
    VALUES (NEW.id, NEW.owner_id, 'project_created', jsonb_build_object('title', NEW.title));
    RETURN NEW;
END;
$$;

-- trigger_set_timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- get_task_details
CREATE OR REPLACE FUNCTION public.get_task_details(task_id UUID)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    assigned_to UUID,
    created_by UUID,
    due_date TIMESTAMPTZ,
    project_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.id,
        pt.title,
        pt.description,
        pt.status,
        pt.priority,
        pt.assigned_to,
        pt.created_by,
        pt.due_date,
        p.title as project_title
    FROM public.project_tasks pt
    JOIN public.projects p ON pt.project_id = p.id
    WHERE pt.id = task_id;
END;
$$;

-- set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- check_primary_project_belongs_to_team
CREATE OR REPLACE FUNCTION public.check_primary_project_belongs_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS(
        SELECT 1 FROM public.projects 
        WHERE id = NEW.primary_project_id AND team_id = NEW.id
    ) THEN
        RAISE EXCEPTION 'Primary project must belong to the team';
    END IF;
    RETURN NEW;
END;
$$;

-- get_project_stats
CREATE OR REPLACE FUNCTION public.get_project_stats(project_id UUID)
RETURNS TABLE(
    total_tasks BIGINT,
    completed_tasks BIGINT,
    in_progress_tasks BIGINT,
    todo_tasks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks
    FROM public.project_tasks
    WHERE project_id = $1;
END;
$$;

-- validate_team_primary_project
CREATE OR REPLACE FUNCTION public.validate_team_primary_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.primary_project_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM public.projects 
        WHERE id = NEW.primary_project_id AND team_id = NEW.id
    ) THEN
        RAISE EXCEPTION 'Primary project must belong to the team';
    END IF;
    RETURN NEW;
END;
$$;

-- Sonuç kontrolü
SELECT 
    proname as function_name,
    prosecurity as security_definer,
    proconfig as search_path_config
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
    'update_updated_at_column',
    'get_task_dependency_stats',
    'get_team_stats',
    'is_team_admin',
    'is_team_owner'
)
ORDER BY proname;
