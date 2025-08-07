-- =====================================================
-- UPDATE UPDATED_AT FUNCTION & TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger örneği (projects tablosu için):
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
