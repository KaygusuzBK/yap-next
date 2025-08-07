-- =====================================================
-- PROJECT ACTIVITIES TABLE
-- =====================================================
-- Proje aktiviteleri, kullanıcı, tip, açıklama ve meta veri.
CREATE TABLE IF NOT EXISTS project_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
