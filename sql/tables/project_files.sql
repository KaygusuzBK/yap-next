-- =====================================================
-- PROJECT FILES TABLE
-- =====================================================
-- Proje ve görev dosyaları, dosya meta verileri ve ilişkiler.
CREATE TABLE IF NOT EXISTS project_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    url TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
