-- =====================================================
-- PROJECTS RLS POLICIES
-- =====================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

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
