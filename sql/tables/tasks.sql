-- =====================================================
-- TASKS TABLE
-- =====================================================
-- Görev ana tablosu. Görev başlığı, açıklaması, durum, öncelik, atanan, proje ilişkisi ve meta veriler.
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    due_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    tags TEXT[],
    color VARCHAR(7) DEFAULT '#6b7280',
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern VARCHAR(50),
    recurring_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
