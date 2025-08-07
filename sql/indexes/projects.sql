-- =====================================================
-- PROJECTS INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_date_range ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
