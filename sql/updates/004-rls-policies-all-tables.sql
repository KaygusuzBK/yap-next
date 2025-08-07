-- =====================================================
-- 004 - RLS Policies for All Tables
-- =====================================================
-- Tarih: 2025-08-07
-- Açıklama: Tüm ana tablolara Row Level Security (RLS) ve temel erişim policy'leri eklenir.

-- TASKS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view tasks in their projects" ON tasks
    FOR SELECT USING (
        project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    );
CREATE POLICY IF NOT EXISTS "Users can insert tasks in their projects" ON tasks
    FOR INSERT WITH CHECK (
        project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    );
CREATE POLICY IF NOT EXISTS "Users can update their assigned tasks" ON tasks
    FOR UPDATE USING (
        assignee_id = auth.uid() OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    );
CREATE POLICY IF NOT EXISTS "Users can delete their assigned tasks" ON tasks
    FOR DELETE USING (
        assignee_id = auth.uid() OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    );

-- COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view comments in their projects" ON comments
    FOR SELECT USING (
        project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    );
CREATE POLICY IF NOT EXISTS "Users can insert comments in their projects" ON comments
    FOR INSERT WITH CHECK (
        project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    );
CREATE POLICY IF NOT EXISTS "Users can update their own comments" ON comments
    FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can delete their own comments" ON comments
    FOR DELETE USING (author_id = auth.uid());

-- PROJECT_MEMBERS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view their project memberships" ON project_members
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can insert themselves as members" ON project_members
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can update their membership" ON project_members
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can delete their membership" ON project_members
    FOR DELETE USING (user_id = auth.uid());

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view their notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can update their notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can delete their notifications" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- Diğer tablolara da benzer şekilde RLS ve policy eklenebilir.
