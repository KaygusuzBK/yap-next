-- =====================================================
-- 08. DATABASE MIGRATIONS
-- =====================================================
-- Bu dosya gelecek veritabanı güncellemeleri için kullanılır
-- Tarih: 2024-01-15
-- Açıklama: Yeni özellikler ve değişiklikler için migration'lar

-- =====================================================
-- MIGRATION HISTORY
-- =====================================================
-- v1.0.0 - Initial schema (2024-01-15)
--   - Created projects, tasks, comments, project_members tables
--   - Added RLS policies
--   - Added indexes and functions
--   - Added views for statistics

-- =====================================================
-- FUTURE MIGRATIONS
-- =====================================================

-- =====================================================
-- MIGRATION: Add task_attachments table
-- Version: v1.1.0
-- Date: 2024-01-20
-- Description: Add support for file attachments to tasks
-- =====================================================
/*
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);

-- Add RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view attachments for tasks they have access to" ON task_attachments
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM tasks WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can upload attachments to tasks they have access to" ON task_attachments
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() AND
        task_id IN (
            SELECT id FROM tasks WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete their own attachments" ON task_attachments
    FOR DELETE USING (uploaded_by = auth.uid());
*/

-- =====================================================
-- MIGRATION: Add project_templates table
-- Version: v1.2.0
-- Date: 2024-01-25
-- Description: Add project templates for quick project creation
-- =====================================================
/*
CREATE TABLE IF NOT EXISTS project_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL, -- Contains tasks, structure, etc.
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_project_templates_created_by ON project_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_project_templates_is_public ON project_templates(is_public);

-- Add RLS
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view public templates or their own" ON project_templates
    FOR SELECT USING (
        is_public = true OR created_by = auth.uid()
    );

CREATE POLICY "Users can create templates" ON project_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates" ON project_templates
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates" ON project_templates
    FOR DELETE USING (created_by = auth.uid());
*/

-- =====================================================
-- MIGRATION: Add notifications table
-- Version: v1.3.0
-- Date: 2024-02-01
-- Description: Add notification system for users
-- =====================================================
/*
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'success', 'error'
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(50), -- 'project', 'task', 'comment'
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (user_id = auth.uid());
*/

-- =====================================================
-- MIGRATION: Add time_tracking table
-- Version: v1.4.0
-- Date: 2024-02-10
-- Description: Add time tracking functionality for tasks
-- =====================================================
/*
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);

-- Add RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view time entries for tasks they have access to" ON time_entries
    FOR SELECT USING (
        user_id = auth.uid() OR
        task_id IN (
            SELECT id FROM tasks WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create their own time entries" ON time_entries
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        task_id IN (
            SELECT id FROM tasks WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own time entries" ON time_entries
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own time entries" ON time_entries
    FOR DELETE USING (user_id = auth.uid());
*/

-- =====================================================
-- MIGRATION: Add project_categories table
-- Version: v1.5.0
-- Date: 2024-02-15
-- Description: Add project categorization system
-- =====================================================
/*
CREATE TABLE IF NOT EXISTS project_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    created_by UUID REFERENCES auth.users(id),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES project_categories(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_project_categories_created_by ON project_categories(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);

-- Add RLS
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view categories" ON project_categories
    FOR SELECT USING (true); -- Categories are viewable by all

CREATE POLICY "Users can create categories" ON project_categories
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own categories" ON project_categories
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own categories" ON project_categories
    FOR DELETE USING (created_by = auth.uid());
*/

-- =====================================================
-- MIGRATION: Add task_dependencies table
-- Version: v1.6.0
-- Date: 2024-02-20
-- Description: Add task dependency management
-- =====================================================
/*
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dependent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    prerequisite_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'finish_to_start', -- 'finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dependent_task_id, prerequisite_task_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependent ON task_dependencies(dependent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_prerequisite ON task_dependencies(prerequisite_task_id);

-- Add RLS
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view dependencies for tasks they have access to" ON task_dependencies
    FOR SELECT USING (
        dependent_task_id IN (
            SELECT id FROM tasks WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create dependencies for tasks they have access to" ON task_dependencies
    FOR INSERT WITH CHECK (
        dependent_task_id IN (
            SELECT id FROM tasks WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete dependencies for tasks they have access to" ON task_dependencies
    FOR DELETE USING (
        dependent_task_id IN (
            SELECT id FROM tasks WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );
*/

-- =====================================================
-- MIGRATION: Add project_archives table
-- Version: v1.7.0
-- Date: 2024-02-25
-- Description: Add project archiving functionality
-- =====================================================
/*
-- Add archived_at column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add index for archived projects
CREATE INDEX IF NOT EXISTS idx_projects_archived_at ON projects(archived_at);

-- Update RLS policies to exclude archived projects by default
DROP POLICY IF EXISTS "Users can view projects they own or are members of" ON projects;
CREATE POLICY "Users can view active projects they own or are members of" ON projects
    FOR SELECT USING (
        archived_at IS NULL AND (
            owner_id = auth.uid() OR
            id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- Add policy for viewing archived projects
CREATE POLICY "Users can view archived projects they own" ON projects
    FOR SELECT USING (
        archived_at IS NOT NULL AND owner_id = auth.uid()
    );
*/

-- =====================================================
-- MIGRATION: Add user_preferences table
-- Version: v1.8.0
-- Date: 2024-03-01
-- Description: Add user preferences and settings
-- =====================================================
/*
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
    language VARCHAR(10) DEFAULT 'tr', -- 'tr', 'en'
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    dashboard_layout JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (user_id = auth.uid());
*/

-- =====================================================
-- MIGRATION EXECUTION HELPER
-- =====================================================
-- To execute a specific migration, uncomment the desired migration block above
-- and run the SQL commands. Always backup your database before running migrations.

-- Example: To run the task_attachments migration:
-- 1. Uncomment the task_attachments block above
-- 2. Execute the SQL commands
-- 3. Update the migration history comment below

-- =====================================================
-- MIGRATION STATUS
-- =====================================================
-- Current Version: v1.0.0
-- Last Migration: Initial schema
-- Next Migration: v1.1.0 (task_attachments)
-- 
-- To check current schema version:
-- SELECT 'v1.0.0' as current_version; 