-- =====================================================
-- 04. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Bu dosya tüm tablolar için güvenlik politikalarını oluşturur
-- Tarih: 2024-01-15
-- Açıklama: Kullanıcıların sadece kendi verilerine erişmesini sağlar

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROJECTS RLS POLICIES
-- =====================================================

-- Users can view projects they own or are members of
CREATE POLICY "Users can view projects they own or are members of" ON projects
    FOR SELECT USING (
        owner_id = auth.uid() OR
        id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Users can create projects (owner_id will be set to current user)
CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update projects they own
CREATE POLICY "Users can update projects they own" ON projects
    FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete projects they own
CREATE POLICY "Users can delete projects they own" ON projects
    FOR DELETE USING (owner_id = auth.uid());

-- =====================================================
-- TASKS RLS POLICIES
-- =====================================================

-- Users can view tasks from projects they own or are members of
CREATE POLICY "Users can view tasks from projects they have access to" ON tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Users can create tasks in projects they own or are members of
CREATE POLICY "Users can create tasks in projects they have access to" ON tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Users can update tasks they are assigned to or in projects they own
CREATE POLICY "Users can update tasks they are assigned to or own" ON tasks
    FOR UPDATE USING (
        assignee_id = auth.uid() OR
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Users can delete tasks in projects they own
CREATE POLICY "Users can delete tasks in projects they own" ON tasks
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- COMMENTS RLS POLICIES
-- =====================================================

-- Users can view comments from projects they have access to
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

-- Users can create comments in projects they have access to
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

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (author_id = auth.uid());

-- Users can delete their own comments or comments in projects they own
CREATE POLICY "Users can delete their own comments or in projects they own" ON comments
    FOR DELETE USING (
        author_id = auth.uid() OR
        (project_id IS NOT NULL AND project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        ))
    );

-- =====================================================
-- PROJECT MEMBERS RLS POLICIES
-- =====================================================

-- Users can view project members for projects they have access to
CREATE POLICY "Users can view project members for projects they have access to" ON project_members
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Project owners can add members
CREATE POLICY "Project owners can add members" ON project_members
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Project owners can update member roles
CREATE POLICY "Project owners can update member roles" ON project_members
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- Project owners can remove members
CREATE POLICY "Project owners can remove members" ON project_members
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify RLS policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('projects', 'tasks', 'comments', 'project_members')
ORDER BY tablename, policyname; 