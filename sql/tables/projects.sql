-- =====================================================
-- PROJECTS TABLE
-- =====================================================
-- Proje ana tablosu. Proje başlığı, açıklaması, durum, tarih, bütçe, sahip ve diğer meta veriler.
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE,
    budget DECIMAL(12,2),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    tags TEXT[],
    color VARCHAR(7) DEFAULT '#3b82f6',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
