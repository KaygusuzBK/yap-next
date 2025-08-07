-- =====================================================
-- 005 - Auto updated_at Triggers for All Tables
-- =====================================================
-- Tarih: 2025-08-07
-- Açıklama: Tüm ana tablolara otomatik updated_at güncellemesi için trigger eklenir.

-- Fonksiyon zaten mevcutsa tekrar oluşturulmaz
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PROJECTS
DROP TRIGGER IF EXISTS trg_update_projects_updated_at ON projects;
CREATE TRIGGER trg_update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- TASKS
DROP TRIGGER IF EXISTS trg_update_tasks_updated_at ON tasks;
CREATE TRIGGER trg_update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- COMMENTS
DROP TRIGGER IF EXISTS trg_update_comments_updated_at ON comments;
CREATE TRIGGER trg_update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- USER_PREFERENCES
DROP TRIGGER IF EXISTS trg_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trg_update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Diğer tablolara da benzer şekilde eklenebilir.
