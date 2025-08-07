-- =====================================================
-- PROJECT STATISTICS VIEW
-- =====================================================
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
