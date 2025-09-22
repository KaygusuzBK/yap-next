-- Sprint RLS politikasını düzelt
-- Kullanıcıların proje üyesi olması yeterli, admin/owner olması gerekmiyor

DROP POLICY IF EXISTS "Users can create sprints in their projects" ON sprints;
CREATE POLICY "Users can create sprints in their projects" ON sprints
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = sprints.project_id 
      AND pm.user_id = auth.uid()
    )
  );
