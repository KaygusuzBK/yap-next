-- =====================================================
-- PROJECT MEMBERS TABLE
-- =====================================================
-- Proje üyeleri, roller ve izinler. Her kullanıcı-proje ilişkisi benzersizdir.
CREATE TABLE IF NOT EXISTS project_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
    permissions TEXT[],
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(project_id, user_id)
);
