-- =====================================================
-- 03. DATABASE INDEXES
-- =====================================================
-- Bu dosya performans için gerekli indexleri oluşturur
-- Tarih: 2024-01-15
-- Açıklama: Sık kullanılan sorgular için indexler

-- =====================================================
-- PROJECTS INDEXES
-- =====================================================
-- Owner ID index for filtering projects by owner
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

-- Status index for filtering projects by status
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Date range index for filtering by date
CREATE INDEX IF NOT EXISTS idx_projects_date_range ON projects(start_date, end_date);

-- Created at index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- =====================================================
-- TASKS INDEXES
-- =====================================================
-- Project ID index for filtering tasks by project
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Assignee ID index for filtering tasks by assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);

-- Status index for filtering tasks by status
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Priority index for filtering tasks by priority
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Due date index for filtering overdue tasks
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Parent task index for hierarchical tasks
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_task_id);

-- Created at index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Composite index for project + status queries
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);

-- Composite index for assignee + status queries
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status);

-- =====================================================
-- COMMENTS INDEXES
-- =====================================================
-- Project ID index for filtering comments by project
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);

-- Task ID index for filtering comments by task
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);

-- Author ID index for filtering comments by author
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

-- Parent comment index for threaded comments
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);

-- Created at index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- =====================================================
-- PROJECT MEMBERS INDEXES
-- =====================================================
-- Project ID index for filtering members by project
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);

-- User ID index for filtering members by user
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Role index for filtering members by role
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Composite index for project + user queries
CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON project_members(project_id, user_id);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'tasks', 'comments', 'project_members')
ORDER BY tablename, indexname; 