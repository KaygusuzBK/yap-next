-- =====================================================
-- 05. POSTGRESQL FUNCTIONS AND TRIGGERS
-- =====================================================
-- Bu dosya PostgreSQL functions ve triggers oluşturur
-- Tarih: 2024-01-15
-- Açıklama: Otomatik timestamp güncellemesi ve yardımcı fonksiyonlar

-- =====================================================
-- TIMESTAMP UPDATE FUNCTION
-- =====================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================
-- Trigger for projects table
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tasks table
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for comments table
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get project statistics for a user
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

-- Function to get task statistics for a user
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

-- Function to get overdue tasks for a user
CREATE OR REPLACE FUNCTION get_overdue_tasks(user_uuid UUID)
RETURNS TABLE (
    task_id UUID,
    task_title VARCHAR(200),
    project_title VARCHAR(200),
    due_date DATE,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as task_id,
        t.title as task_title,
        p.title as project_title,
        t.due_date,
        (CURRENT_DATE - t.due_date)::INTEGER as days_overdue
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.due_date < CURRENT_DATE 
    AND t.status NOT IN ('completed', 'cancelled')
    AND (
        p.owner_id = user_uuid OR
        p.id IN (
            SELECT project_id FROM project_members WHERE user_id = user_uuid
        )
    )
    ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent activity for a user
CREATE OR REPLACE FUNCTION get_recent_activity(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    activity_type VARCHAR(50),
    entity_id UUID,
    entity_title VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    (
        -- Recent projects
        SELECT 
            'project_created'::VARCHAR(50) as activity_type,
            p.id as entity_id,
            p.title as entity_title,
            p.created_at
        FROM projects p
        WHERE p.owner_id = user_uuid
        
        UNION ALL
        
        -- Recent tasks
        SELECT 
            'task_created'::VARCHAR(50) as activity_type,
            t.id as entity_id,
            t.title as entity_title,
            t.created_at
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE p.owner_id = user_uuid OR p.id IN (
            SELECT project_id FROM project_members WHERE user_id = user_uuid
        )
        
        UNION ALL
        
        -- Recent comments
        SELECT 
            'comment_created'::VARCHAR(50) as activity_type,
            c.id as entity_id,
            LEFT(c.content, 50) || '...' as entity_title,
            c.created_at
        FROM comments c
        WHERE c.author_id = user_uuid
    )
    ORDER BY created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify functions were created successfully
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
    'update_updated_at_column',
    'get_project_stats',
    'get_task_stats',
    'get_overdue_tasks',
    'get_recent_activity'
)
ORDER BY routine_name;

-- Verify triggers were created successfully
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table IN ('projects', 'tasks', 'comments')
ORDER BY event_object_table, trigger_name; 