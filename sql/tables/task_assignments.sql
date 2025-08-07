-- =====================================================
-- TASK ASSIGNMENTS TABLE
-- =====================================================
-- Görevler ile kullanıcılar arasında çoklu ilişki. Birincil atama desteği.
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT false,
    UNIQUE(task_id, user_id)
);
