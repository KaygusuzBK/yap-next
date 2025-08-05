-- =====================================================
-- YAP PROJECT MANAGEMENT - COMPLETE DATABASE SETUP
-- =====================================================
-- Bu dosya tüm veritabanı kurulumunu tek seferde çalıştırır
-- Tarih: 2024-01-15
-- Açıklama: Tüm SQL dosyalarını sırasıyla çalıştırır

-- =====================================================
-- SETUP START
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '🚀 YAP Project Management Database Setup Başlıyor...';
    RAISE NOTICE '📅 Tarih: %', NOW();
END $$;

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '📦 PostgreSQL Extensions kuruluyor...';
END $$;

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional cryptographic functions (optional)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. TABLES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '🗄️ Veritabanı tabloları oluşturuluyor...';
END $$;

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE,
    budget DECIMAL(10,2),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    due_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROJECT MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- =====================================================
-- 3. INDEXES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '🔍 Performans indexleri oluşturuluyor...';
END $$;

-- PROJECTS INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_date_range ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- TASKS INDEXES
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status);

-- COMMENTS INDEXES
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- PROJECT MEMBERS INDEXES
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);
CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON project_members(project_id, user_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '🔐 Güvenlik politikaları ayarlanıyor...';
END $$;

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- PROJECTS RLS POLICIES
CREATE POLICY "Users can view projects they own or are members of" ON projects
    FOR SELECT USING (
        owner_id = auth.uid() OR
        id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update projects they own" ON projects
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete projects they own" ON projects
    FOR DELETE USING (owner_id = auth.uid());

-- TASKS RLS POLICIES
CREATE POLICY "Users can view tasks from projects they have access to" ON tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks in projects they have access to" ON tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks they are assigned to or in projects they own" ON tasks
    FOR UPDATE USING (
        assignee_id = auth.uid() OR
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks in projects they own" ON tasks
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- COMMENTS RLS POLICIES
CREATE POLICY "Users can view comments from projects they have access to" ON comments
    FOR SELECT USING (
        (project_id IS NOT NULL AND project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )) OR
        (task_id IS NOT NULL AND task_id IN (
            SELECT id FROM tasks WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        ))
    );

CREATE POLICY "Users can create comments in projects they have access to" ON comments
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND (
            (project_id IS NOT NULL AND project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )) OR
            (task_id IS NOT NULL AND task_id IN (
                SELECT id FROM tasks WHERE project_id IN (
                    SELECT id FROM projects WHERE owner_id = auth.uid()
                    UNION
                    SELECT project_id FROM project_members WHERE user_id = auth.uid()
                )
            ))
        )
    );

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own comments or in projects they own" ON comments
    FOR DELETE USING (
        author_id = auth.uid() OR
        (project_id IS NOT NULL AND project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        ))
    );

-- PROJECT MEMBERS RLS POLICIES
CREATE POLICY "Users can view project members for projects they have access to" ON project_members
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can add members" ON project_members
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can update member roles" ON project_members
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can remove members" ON project_members
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- 5. FUNCTIONS AND TRIGGERS
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '⚙️ Fonksiyonlar ve triggerlar oluşturuluyor...';
END $$;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Utility Functions
CREATE OR REPLACE FUNCTION get_project_stats(user_uuid UUID)
RETURNS TABLE (
    total BIGINT,
    active BIGINT,
    completed BIGINT,
    cancelled BIGINT,
    completion_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total,
        COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 2
        ) as completion_rate
    FROM projects
    WHERE owner_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_task_stats(user_uuid UUID)
RETURNS TABLE (
    total BIGINT,
    todo BIGINT,
    in_progress BIGINT,
    completed BIGINT,
    cancelled BIGINT,
    completion_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total,
        COUNT(*) FILTER (WHERE status = 'todo')::BIGINT as todo,
        COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 2
        ) as completion_rate
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE p.owner_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. VIEWS
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '📊 Database views oluşturuluyor...';
END $$;

-- Project statistics view
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    owner_id,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'active') as active,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'on_hold') as on_hold,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 2
    ) as completion_rate,
    AVG(progress) as avg_progress,
    SUM(budget) as total_budget,
    AVG(budget) as avg_budget
FROM projects
GROUP BY owner_id;

-- Task statistics view
CREATE OR REPLACE VIEW task_stats AS
SELECT 
    p.owner_id,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE t.status = 'todo') as todo,
    COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress,
    COUNT(*) FILTER (WHERE t.status = 'completed') as completed,
    COUNT(*) FILTER (WHERE t.status = 'cancelled') as cancelled,
    ROUND(
        (COUNT(*) FILTER (WHERE t.status = 'completed')::DECIMAL / COUNT(*)) * 100, 2
    ) as completion_rate,
    AVG(t.estimated_hours) as avg_estimated_hours,
    AVG(t.actual_hours) as avg_actual_hours,
    SUM(t.estimated_hours) as total_estimated_hours,
    SUM(t.actual_hours) as total_actual_hours
FROM tasks t
JOIN projects p ON t.project_id = p.id
GROUP BY p.owner_id;

-- Project details view
CREATE OR REPLACE VIEW project_details AS
SELECT 
    p.*,
    u.email as owner_email,
    u.raw_user_meta_data->>'name' as owner_name,
    u.raw_user_meta_data->>'avatar' as owner_avatar,
    COUNT(t.id) as task_count,
    COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'todo') as todo_tasks,
    COUNT(c.id) as comment_count,
    COUNT(pm.id) as member_count
FROM projects p
LEFT JOIN auth.users u ON p.owner_id = u.id
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN comments c ON p.id = c.project_id
LEFT JOIN project_members pm ON p.id = pm.project_id
GROUP BY p.id, u.email, u.raw_user_meta_data;

-- Task details view
CREATE OR REPLACE VIEW task_details AS
SELECT 
    t.*,
    p.title as project_title,
    p.status as project_status,
    assignee.email as assignee_email,
    assignee.raw_user_meta_data->>'name' as assignee_name,
    assignee.raw_user_meta_data->>'avatar' as assignee_avatar,
    owner.email as project_owner_email,
    owner.raw_user_meta_data->>'name' as project_owner_name,
    COUNT(c.id) as comment_count,
    CASE 
        WHEN t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled') 
        THEN (CURRENT_DATE - t.due_date)::INTEGER 
        ELSE 0 
    END as days_overdue
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN auth.users assignee ON t.assignee_id = assignee.id
LEFT JOIN auth.users owner ON p.owner_id = owner.id
LEFT JOIN comments c ON t.id = c.task_id
GROUP BY t.id, p.title, p.status, assignee.email, assignee.raw_user_meta_data, 
         owner.email, owner.raw_user_meta_data;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ YAP Project Management Database Setup Tamamlandı!';
    RAISE NOTICE '📊 Oluşturulan tablolar: projects, tasks, comments, project_members';
    RAISE NOTICE '🔐 RLS Policies aktif';
    RAISE NOTICE '📈 Views hazır';
    RAISE NOTICE '⚙️ Functions ve triggers çalışıyor';
    RAISE NOTICE '🎉 Veritabanı kullanıma hazır!';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify all components were created successfully
SELECT 'TABLES' as component, COUNT(*) as count FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'tasks', 'comments', 'project_members')
UNION ALL
SELECT 'VIEWS' as component, COUNT(*) as count FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name IN ('project_stats', 'task_stats', 'project_details', 'task_details')
UNION ALL
SELECT 'FUNCTIONS' as component, COUNT(*) as count FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('update_updated_at_column', 'get_project_stats', 'get_task_stats')
UNION ALL
SELECT 'TRIGGERS' as component, COUNT(*) as count FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN ('projects', 'tasks', 'comments')
ORDER BY component; 