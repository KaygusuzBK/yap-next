-- Supabase Compatibility Fix
-- Mevcut Supabase tablolarına uygun güncelleme
-- Takım yönetimi özelliklerini mevcut verilerle uyumlu hale getir

-- ========================================
-- TEAMS TABLOSU GÜNCELLEMELERİ
-- ========================================

-- description alanını ekle (eğer yoksa)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN description text;
  END IF;
END $$;

-- avatar_url alanını ekle (eğer yoksa)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN avatar_url text;
  END IF;
END $$;

-- ========================================
-- TEAM_MEMBERS TABLOSU GÜNCELLEMELERİ
-- ========================================

-- avatar_url alanını ekle (eğer yoksa)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'team_members' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.team_members ADD COLUMN avatar_url text;
  END IF;
END $$;

-- ========================================
-- PROJECT_TASK_STATUSES TABLOSU
-- ========================================

-- Bu tablo Supabase'de mevcut ama SQL dosyalarımızda yok
-- Mevcut yapıyı koruyarak ekleyelim
CREATE TABLE IF NOT EXISTS public.project_task_statuses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  order_index integer DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- USER_PREFERENCES TABLOSU
-- ========================================

-- Bu tablo Supabase'de mevcut ama SQL dosyalarımızda yok
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language text DEFAULT 'tr',
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- ========================================
-- TASKS TABLOSU (ESKİ TABLO)
-- ========================================

-- Bu tablo Supabase'de mevcut ama kullanılmıyor
-- project_tasks ile değiştirildi
-- Sadece yapısını koruyalım, veri taşıma yapmayalım
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo',
  priority text DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- İNDEKSLER
-- ========================================

-- project_task_statuses için indeksler
CREATE INDEX IF NOT EXISTS idx_project_task_statuses_project_id ON public.project_task_statuses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_task_statuses_order ON public.project_task_statuses(order_index);

-- user_preferences için indeksler
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- ========================================
-- RLS POLİTİKALARI
-- ========================================

-- project_task_statuses için RLS
ALTER TABLE public.project_task_statuses ENABLE ROW LEVEL SECURITY;

-- Proje üyeleri durumları görebilir
CREATE POLICY "read project task statuses" ON public.project_task_statuses
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    ) OR
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    )
  );

-- Proje sahibi ve admin'ler durum ekleyebilir
CREATE POLICY "manage project task statuses" ON public.project_task_statuses
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_id = auth.uid()
    ) OR
    project_id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- user_preferences için RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi tercihlerini görebilir
CREATE POLICY "read own preferences" ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid());

-- Kullanıcı sadece kendi tercihlerini güncelleyebilir
CREATE POLICY "update own preferences" ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Kullanıcı sadece kendi tercihlerini ekleyebilir
CREATE POLICY "insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ========================================
-- TRIGGER'LAR
-- ========================================

-- project_task_statuses için updated_at trigger
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları ekle
DROP TRIGGER IF EXISTS set_timestamp_project_task_statuses ON public.project_task_statuses;
CREATE TRIGGER set_timestamp_project_task_statuses
  BEFORE UPDATE ON public.project_task_statuses
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_user_preferences ON public.user_preferences;
CREATE TRIGGER set_timestamp_user_preferences
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- ========================================
-- VARSayılan VERİLER
-- ========================================

-- Varsayılan görev durumları (eğer yoksa)
INSERT INTO public.project_task_statuses (project_id, name, color, order_index, is_default)
SELECT 
  p.id,
  'Yapılacak',
  '#6b7280',
  1,
  true
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_task_statuses pts 
  WHERE pts.project_id = p.id AND pts.name = 'Yapılacak'
);

INSERT INTO public.project_task_statuses (project_id, name, color, order_index, is_default)
SELECT 
  p.id,
  'Devam Ediyor',
  '#3b82f6',
  2,
  false
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_task_statuses pts 
  WHERE pts.project_id = p.id AND pts.name = 'Devam Ediyor'
);

INSERT INTO public.project_task_statuses (project_id, name, color, order_index, is_default)
SELECT 
  p.id,
  'İncelemede',
  '#f59e0b',
  3,
  false
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_task_statuses pts 
  WHERE pts.project_id = p.id AND pts.name = 'İncelemede'
);

INSERT INTO public.project_task_statuses (project_id, name, color, order_index, is_default)
SELECT 
  p.id,
  'Tamamlandı',
  '#10b981',
  4,
  false
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_task_statuses pts 
  WHERE pts.project_id = p.id AND pts.name = 'Tamamlandı'
);

-- ========================================
-- VERİTABANI YORUMLARI
-- ========================================

COMMENT ON TABLE public.project_task_statuses IS 'Proje bazlı görev durumları ve renkleri';
COMMENT ON COLUMN public.project_task_statuses.name IS 'Durum adı (Yapılacak, Devam Ediyor, vb.)';
COMMENT ON COLUMN public.project_task_statuses.color IS 'Durum rengi (hex format)';
COMMENT ON COLUMN public.project_task_statuses.order_index IS 'Sıralama indeksi';
COMMENT ON COLUMN public.project_task_statuses.is_default IS 'Varsayılan durum mu?';

COMMENT ON TABLE public.user_preferences IS 'Kullanıcı tercihleri ve ayarları';
COMMENT ON COLUMN public.user_preferences.theme IS 'Tema tercihi (light, dark, system)';
COMMENT ON COLUMN public.user_preferences.language IS 'Dil tercihi';
COMMENT ON COLUMN public.user_preferences.notifications_enabled IS 'Bildirimler aktif mi?';
COMMENT ON COLUMN public.user_preferences.email_notifications IS 'E-posta bildirimleri aktif mi?';

-- ========================================
-- SONUÇ
-- ========================================

-- Bu güncelleme ile:
-- 1. Mevcut Supabase tabloları korundu
-- 2. Eksik alanlar eklendi
-- 3. Takım yönetimi özellikleri uyumlu hale getirildi
-- 4. Varsayılan görev durumları eklendi
-- 5. Kullanıcı tercihleri sistemi eklendi
