-- =====================================================
-- USER PREFERENCES TABLE
-- =====================================================
-- Kullanıcı tercihleri, tema, dil, bildirim ve dashboard ayarları.
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'tr',
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    email_notifications JSONB DEFAULT '{"project_updates": true, "task_assignments": true, "due_date_reminders": true}',
    dashboard_layout JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
