-- =====================================================
-- 06. DATABASE VIEWS
-- =====================================================
-- Bu dosya sık kullanılan sorgular için database views oluşturur
-- Tarih: 2024-01-15
-- Açıklama: İstatistikler ve raporlar için views

-- =====================================================
-- PROJECT STATISTICS VIEW
-- =====================================================
-- View for project statistics per user
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

-- =====================================================
-- TASK STATISTICS VIEW
-- =====================================================
-- View for task statistics per user
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

-- =====================================================
-- PROJECT DETAILS VIEW
-- =====================================================
-- View for project details with owner information
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

-- =====================================================
-- TASK DETAILS VIEW
-- =====================================================
-- View for task details with related information
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
-- OVERDUE TASKS VIEW
-- =====================================================
-- View for overdue tasks
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT 
    t.id,
    t.title,
    t.due_date,
    (CURRENT_DATE - t.due_date)::INTEGER as days_overdue,
    t.priority,
    t.status,
    p.title as project_title,
    p.owner_id as project_owner_id,
    assignee.email as assignee_email,
    assignee.raw_user_meta_data->>'name' as assignee_name
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN auth.users assignee ON t.assignee_id = assignee.id
WHERE t.due_date < CURRENT_DATE 
AND t.status NOT IN ('completed', 'cancelled')
ORDER BY t.due_date ASC;

-- =====================================================
-- RECENT ACTIVITY VIEW
-- =====================================================
-- View for recent activity across all entities
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    'project_created' as activity_type,
    p.id as entity_id,
    p.title as entity_title,
    p.owner_id as user_id,
    p.created_at,
    u.email as user_email,
    u.raw_user_meta_data->>'name' as user_name
FROM projects p
JOIN auth.users u ON p.owner_id = u.id

UNION ALL

SELECT 
    'task_created' as activity_type,
    t.id as entity_id,
    t.title as entity_title,
    p.owner_id as user_id,
    t.created_at,
    u.email as user_email,
    u.raw_user_meta_data->>'name' as user_name
FROM tasks t
JOIN projects p ON t.project_id = p.id
JOIN auth.users u ON p.owner_id = u.id

UNION ALL

SELECT 
    'comment_created' as activity_type,
    c.id as entity_id,
    LEFT(c.content, 50) || '...' as entity_title,
    c.author_id as user_id,
    c.created_at,
    u.email as user_email,
    u.raw_user_meta_data->>'name' as user_name
FROM comments c
JOIN auth.users u ON c.author_id = u.id

ORDER BY created_at DESC;

-- =====================================================
-- PROJECT MEMBERS VIEW
-- =====================================================
-- View for project members with user details
CREATE OR REPLACE VIEW project_members_details AS
SELECT 
    pm.*,
    p.title as project_title,
    u.email as user_email,
    u.raw_user_meta_data->>'name' as user_name,
    u.raw_user_meta_data->>'avatar' as user_avatar,
    u.created_at as user_created_at
FROM project_members pm
JOIN projects p ON pm.project_id = p.id
JOIN auth.users u ON pm.user_id = u.id
ORDER BY pm.joined_at DESC;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify views were created successfully
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'VIEW'
AND table_name IN (
    'project_stats',
    'task_stats', 
    'project_details',
    'task_details',
    'overdue_tasks',
    'recent_activity',
    'project_members_details'
)
ORDER BY table_name; 