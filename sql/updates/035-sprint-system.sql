-- Sprint sistemi için tablo oluşturma
-- 035-sprint-system.sql

-- Sprint tablosu
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Sprint üyeleri tablosu
CREATE TABLE IF NOT EXISTS sprint_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sprint_id, user_id)
);

-- Görevlere sprint_id ekleme
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

-- Sprint aktiviteleri tablosu
CREATE TABLE IF NOT EXISTS sprint_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprints_dates ON sprints(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_sprint_members_sprint_id ON sprint_members(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_members_user_id ON sprint_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_activities_sprint_id ON sprint_activities(sprint_id);

-- RLS politikaları
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_activities ENABLE ROW LEVEL SECURITY;

-- Sprint RLS politikaları
DROP POLICY IF EXISTS "Users can view sprints of their projects" ON sprints;
CREATE POLICY "Users can view sprints of their projects" ON sprints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = sprints.project_id 
      AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create sprints in their projects" ON sprints;
CREATE POLICY "Users can create sprints in their projects" ON sprints
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = sprints.project_id 
      AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update sprints they own or are admin" ON sprints;
CREATE POLICY "Users can update sprints they own or are admin" ON sprints
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = sprints.project_id 
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can delete sprints they own or are admin" ON sprints;
CREATE POLICY "Users can delete sprints they own or are admin" ON sprints
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = sprints.project_id 
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Sprint üyeleri RLS politikaları
DROP POLICY IF EXISTS "Users can view sprint members of their projects" ON sprint_members;
CREATE POLICY "Users can view sprint members of their projects" ON sprint_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sprints s
      JOIN project_members pm ON pm.project_id = s.project_id
      WHERE s.id = sprint_members.sprint_id
      AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sprint owners can manage members" ON sprint_members;
CREATE POLICY "Sprint owners can manage members" ON sprint_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sprints s
      WHERE s.id = sprint_members.sprint_id
      AND s.created_by = auth.uid()
    )
  );

-- Sprint aktiviteleri RLS politikaları
DROP POLICY IF EXISTS "Users can view sprint activities of their projects" ON sprint_activities;
CREATE POLICY "Users can view sprint activities of their projects" ON sprint_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sprints s
      JOIN project_members pm ON pm.project_id = s.project_id
      WHERE s.id = sprint_activities.sprint_id
      AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create sprint activities" ON sprint_activities;
CREATE POLICY "Users can create sprint activities" ON sprint_activities
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM sprints s
      JOIN project_members pm ON pm.project_id = s.project_id
      WHERE s.id = sprint_activities.sprint_id
      AND pm.user_id = auth.uid()
    )
  );

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_sprint_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sprint güncelleme trigger'ı
DROP TRIGGER IF EXISTS update_sprint_updated_at ON sprints;
CREATE TRIGGER update_sprint_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW
  EXECUTE FUNCTION update_sprint_updated_at();

-- Sprint aktivitesi oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_sprint_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sprint_activities (sprint_id, user_id, action, details)
  VALUES (
    NEW.id,
    NEW.created_by,
    'sprint_created',
    jsonb_build_object(
      'sprint_name', NEW.name,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sprint oluşturma trigger'ı
DROP TRIGGER IF EXISTS create_sprint_activity_trigger ON sprints;
CREATE TRIGGER create_sprint_activity_trigger
  AFTER INSERT ON sprints
  FOR EACH ROW
  EXECUTE FUNCTION create_sprint_activity();

-- Sprint durumu değişikliği aktivitesi
CREATE OR REPLACE FUNCTION track_sprint_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO sprint_activities (sprint_id, user_id, action, details)
    VALUES (
      NEW.id,
      NEW.created_by,
      'sprint_status_changed',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'sprint_name', NEW.name
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sprint durumu değişikliği trigger'ı
DROP TRIGGER IF EXISTS track_sprint_status_change_trigger ON sprints;
CREATE TRIGGER track_sprint_status_change_trigger
  AFTER UPDATE ON sprints
  FOR EACH ROW
  EXECUTE FUNCTION track_sprint_status_change();

-- Sprint istatistikleri view'ı
CREATE OR REPLACE VIEW sprint_stats AS
SELECT 
  s.id,
  s.name,
  s.project_id,
  s.status,
  s.start_date,
  s.end_date,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) as todo_tasks,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT t.id) > 0 
      THEN (COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)::numeric / COUNT(DISTINCT t.id)) * 100
      ELSE 0
    END::numeric, 2
  ) as completion_rate
FROM sprints s
LEFT JOIN tasks t ON t.sprint_id = s.id
GROUP BY s.id, s.name, s.project_id, s.status, s.start_date, s.end_date;

-- Sprint üyeleri view'ı
CREATE OR REPLACE VIEW sprint_members_view AS
SELECT 
  sm.*,
  s.name as sprint_name,
  s.project_id,
  p.title as project_title,
  au.email as user_email,
  au.raw_user_meta_data->>'full_name' as user_name
FROM sprint_members sm
JOIN sprints s ON s.id = sm.sprint_id
JOIN projects p ON p.id = s.project_id
JOIN auth.users au ON au.id = sm.user_id;

-- RLS view'ları için politikalar (view'lar oluşturulduktan sonra)
-- Bu politikalar view'lar oluşturulduktan sonra çalıştırılacak

-- Sprint fonksiyonları
CREATE OR REPLACE FUNCTION get_sprint_tasks(sprint_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  assignee_name TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.assignee_name,
    t.due_date,
    t.created_at
  FROM tasks t
  WHERE t.sprint_id = sprint_uuid
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sprint oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_sprint(
  p_project_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  sprint_id UUID;
BEGIN
  -- Proje yetkisi kontrolü: proje üyesi olmak yeterlidir
  IF NOT EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = p_project_id 
    AND pm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bu projede sprint oluşturma yetkiniz yok';
  END IF;

  -- Sprint oluştur
  INSERT INTO sprints (project_id, name, description, start_date, end_date, created_by)
  VALUES (p_project_id, p_name, p_description, p_start_date, p_end_date, auth.uid())
  RETURNING id INTO sprint_id;

  -- Sprint sahibini üye olarak ekle
  INSERT INTO sprint_members (sprint_id, user_id, role)
  VALUES (sprint_id, auth.uid(), 'owner');

  RETURN sprint_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sprint kapatma fonksiyonu
CREATE OR REPLACE FUNCTION close_sprint(p_sprint_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Sprint sahibi kontrolü
  IF NOT EXISTS (
    SELECT 1 FROM sprints s
    WHERE s.id = p_sprint_id
    AND s.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bu sprinti kapatma yetkiniz yok';
  END IF;

  -- Sprint'i kapat
  UPDATE sprints 
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_sprint_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sprint açma fonksiyonu
CREATE OR REPLACE FUNCTION open_sprint(p_sprint_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Sprint sahibi kontrolü
  IF NOT EXISTS (
    SELECT 1 FROM sprints s
    WHERE s.id = p_sprint_id
    AND s.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bu sprinti açma yetkiniz yok';
  END IF;

  -- Sprint'i aç
  UPDATE sprints 
  SET status = 'active', updated_at = NOW()
  WHERE id = p_sprint_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS view'ları için politikalar (view'lar oluşturulduktan sonra)
-- Bu politikalar view'lar oluşturulduktan sonra ayrı olarak çalıştırılacak
