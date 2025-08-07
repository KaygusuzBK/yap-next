-- =====================================================
-- TASK STATISTICS VIEW
-- =====================================================
CREATE OR REPLACE VIEW task_stats AS
SELECT 
    p.owner_id,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE t.status = 'todo') as todo,
    COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress,
    COUNT(*) FILTER (WHERE t.status = 'completed') as completed,
    COUNT(*) FILTER (WHERE t.status = 'cancelled') as cancelled
FROM tasks t
JOIN projects p ON t.project_id = p.id
GROUP BY p.owner_id;
