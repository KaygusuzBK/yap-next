-- =====================================================
-- COMPLETE DATABASE UPDATE
-- =====================================================
-- Tarih: 2024-01-15
-- Açıklama: Tüm tablo güncellemeleri ve yeni özellikler

-- =====================================================
-- 1. ENHANCE EXISTING TABLES
-- =====================================================

-- Projects tablosuna yeni alanlar ekle
DO $$ 
BEGIN
    -- Priority alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority') THEN
        ALTER TABLE projects ADD COLUMN priority VARCHAR(10) DEFAULT 'medium';
        ALTER TABLE projects ADD CONSTRAINT projects_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    END IF;
    
    -- Tags alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tags') THEN
        ALTER TABLE projects ADD COLUMN tags TEXT[];
    END IF;
    
    -- Color alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'color') THEN
        ALTER TABLE projects ADD COLUMN color VARCHAR(7) DEFAULT '#3b82f6';
    END IF;
    
    -- Is_public alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_public') THEN
        ALTER TABLE projects ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Budget alanını genişlet (view'ları dikkate alarak)
-- Önce view'ları sil
DROP VIEW IF EXISTS project_stats CASCADE;
DROP VIEW IF EXISTS task_stats CASCADE;
DROP VIEW IF EXISTS project_details CASCADE;

-- Sonra budget tipini değiştir
ALTER TABLE projects 
ALTER COLUMN budget TYPE DECIMAL(12,2);

-- Tasks tablosuna yeni alanlar ekle
DO $$ 
BEGIN
    -- Color alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'color') THEN
        ALTER TABLE tasks ADD COLUMN color VARCHAR(7) DEFAULT '#6b7280';
    END IF;
    
    -- Is_recurring alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_recurring') THEN
        ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT false;
    END IF;
    
    -- Recurring_pattern alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'recurring_pattern') THEN
        ALTER TABLE tasks ADD COLUMN recurring_pattern VARCHAR(50);
    END IF;
    
    -- Recurring_end_date alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'recurring_end_date') THEN
        ALTER TABLE tasks ADD COLUMN recurring_end_date DATE;
    END IF;
END $$;

-- Comments tablosuna yeni alanlar ekle
DO $$ 
BEGIN
    -- Is_edited alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'is_edited') THEN
        ALTER TABLE comments ADD COLUMN is_edited BOOLEAN DEFAULT false;
    END IF;
    
    -- Edited_at alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'edited_at') THEN
        ALTER TABLE comments ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Project members tablosuna yeni alanlar ekle
DO $$ 
BEGIN
    -- Permissions alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_members' AND column_name = 'permissions') THEN
        ALTER TABLE project_members ADD COLUMN permissions TEXT[];
    END IF;
    
    -- Invited_by alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_members' AND column_name = 'invited_by') THEN
        ALTER TABLE project_members ADD COLUMN invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Is_active alanı
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_members' AND column_name = 'is_active') THEN
        ALTER TABLE project_members ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Role enum'ını güncelle
DO $$ 
BEGIN
    -- Eğer constraint varsa sil
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'project_members_role_check') THEN
        ALTER TABLE project_members DROP CONSTRAINT project_members_role_check;
    END IF;
    
    -- Yeni constraint ekle
    ALTER TABLE project_members 
    ADD CONSTRAINT project_members_role_check 
    CHECK (role IN ('owner', 'manager', 'member', 'viewer'));
END $$;

-- =====================================================
-- 2. CREATE NEW TABLES
-- =====================================================

-- Task assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT false,
    UNIQUE(task_id, user_id)
);

-- Project files table
CREATE TABLE IF NOT EXISTS project_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    url TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task time logs table
CREATE TABLE IF NOT EXISTS task_time_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project activities table
CREATE TABLE IF NOT EXISTS project_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'tr',
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    email_notifications JSONB DEFAULT '{"project_updates": true, "task_assignments": true, "due_date_reminders": true}',
    dashboard_layout JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES (IMMUTABLE FIXED)
-- =====================================================

-- New tables indexes
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_primary ON task_assignments(task_id, is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_task_id ON project_files(task_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_start_time ON task_time_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_end_time ON task_time_logs(end_time);

CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_user_id ON project_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_created_at ON project_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Enhanced indexes for existing tables (IMMUTABLE FIXED)
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);
CREATE INDEX IF NOT EXISTS idx_project_members_active ON project_members(is_active) WHERE is_active = true;

-- =====================================================
-- 4. ENABLE RLS AND CREATE POLICIES
-- =====================================================

-- Task assignments RLS
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own task assignments" ON task_assignments
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Project owners and managers can manage task assignments" ON task_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = (SELECT project_id FROM tasks WHERE id = task_assignments.task_id)
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'manager')
            AND pm.is_active = true
        )
    );

-- Project files RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view files of projects they are members of" ON project_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_files.project_id
            AND pm.user_id = auth.uid()
            AND pm.is_active = true
        )
    );
CREATE POLICY "Project owners and managers can upload files" ON project_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_files.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'manager')
            AND pm.is_active = true
        )
    );

-- Task time logs RLS
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own time logs" ON task_time_logs
    FOR ALL USING (auth.uid() = user_id);

-- Project activities RLS
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project members can view project activities" ON project_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_activities.project_id
            AND pm.user_id = auth.uid()
            AND pm.is_active = true
        )
    );

-- User preferences RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Enhanced policies for existing tables
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (
        owner_id = auth.uid() 
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = projects.id
            AND pm.user_id = auth.uid()
            AND pm.is_active = true
        )
    );

-- =====================================================
-- 5. CREATE ESSENTIAL FUNCTIONS
-- =====================================================

-- Task assignment function
CREATE OR REPLACE FUNCTION assign_task_to_user(
    p_task_id UUID,
    p_user_id UUID,
    p_is_primary BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assignment_id UUID;
BEGIN
    IF p_is_primary THEN
        UPDATE task_assignments 
        SET is_primary = false 
        WHERE task_id = p_task_id AND is_primary = true;
    END IF;
    
    INSERT INTO task_assignments (task_id, user_id, assigned_by, is_primary)
    VALUES (p_task_id, p_user_id, auth.uid(), p_is_primary)
    ON CONFLICT (task_id, user_id) 
    DO UPDATE SET 
        assigned_at = NOW(),
        assigned_by = auth.uid(),
        is_primary = p_is_primary
    RETURNING id INTO v_assignment_id;
    
    RETURN v_assignment_id;
END;
$$;

-- Notification function
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_project_id UUID DEFAULT NULL,
    p_task_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, project_id, task_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_project_id, p_task_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Time tracking functions
CREATE OR REPLACE FUNCTION start_time_log(p_task_id UUID, p_description TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_time_log_id UUID;
BEGIN
    INSERT INTO task_time_logs (task_id, user_id, start_time, description)
    VALUES (p_task_id, auth.uid(), NOW(), p_description)
    RETURNING id INTO v_time_log_id;
    
    RETURN v_time_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION stop_time_log(p_time_log_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_duration_minutes INTEGER;
BEGIN
    UPDATE task_time_logs 
    SET 
        end_time = NOW(),
        duration_minutes = EXTRACT(EPOCH FROM (NOW() - start_time)) / 60
    WHERE id = p_time_log_id AND user_id = auth.uid() AND end_time IS NULL
    RETURNING duration_minutes INTO v_duration_minutes;
    
    RETURN v_duration_minutes;
END;
$$;

-- User preferences function
CREATE OR REPLACE FUNCTION upsert_user_preferences(
    p_theme TEXT DEFAULT NULL,
    p_language TEXT DEFAULT NULL,
    p_timezone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_preferences_id UUID;
BEGIN
    INSERT INTO user_preferences (user_id, theme, language, timezone)
    VALUES (auth.uid(), p_theme, p_language, p_timezone)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        theme = COALESCE(p_theme, user_preferences.theme),
        language = COALESCE(p_language, user_preferences.language),
        timezone = COALESCE(p_timezone, user_preferences.timezone),
        updated_at = NOW()
    RETURNING id INTO v_preferences_id;
    
    RETURN v_preferences_id;
END;
$$;

-- =====================================================
-- 6. RECREATE VIEWS
-- =====================================================

-- Recreate project_stats view with updated budget type
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id,
    p.title,
    p.status,
    p.progress,
    p.budget,
    p.start_date,
    p.end_date,
    p.owner_id,
    p.priority,
    p.color,
    p.is_public,
    COUNT(t.id) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
    COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled')) as overdue_tasks,
    CASE 
        WHEN COUNT(t.id) > 0 THEN ROUND((COUNT(t.id) FILTER (WHERE t.status = 'completed')::NUMERIC / COUNT(t.id)) * 100, 2)
        ELSE 0
    END as completion_rate
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.title, p.status, p.progress, p.budget, p.start_date, p.end_date, p.owner_id, p.priority, p.color, p.is_public;

-- Recreate task_stats view
CREATE OR REPLACE VIEW task_stats AS
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.due_date,
    t.project_id,
    t.assignee_id,
    t.color,
    t.is_recurring,
    p.title as project_title,
    u.email as assignee_email
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN auth.users u ON t.assignee_id = u.id;

-- Recreate project_details view
CREATE OR REPLACE VIEW project_details AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.status,
    p.progress,
    p.budget,
    p.start_date,
    p.end_date,
    p.owner_id,
    p.priority,
    p.color,
    p.is_public,
    p.tags,
    p.created_at,
    p.updated_at
FROM projects p;

-- =====================================================
-- 7. UPDATE EXISTING DATA
-- =====================================================

-- Set default values for existing records
UPDATE projects 
SET 
    priority = 'medium',
    color = '#3b82f6',
    is_public = false
WHERE priority IS NULL OR color IS NULL OR is_public IS NULL;

UPDATE tasks 
SET 
    color = '#6b7280',
    is_recurring = false
WHERE color IS NULL OR is_recurring IS NULL;

UPDATE comments 
SET is_edited = false
WHERE is_edited IS NULL;

UPDATE project_members 
SET is_active = true
WHERE is_active IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Update completed successfully' as status;