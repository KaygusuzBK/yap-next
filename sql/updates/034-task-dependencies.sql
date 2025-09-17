-- Görev Bağımlılıkları Sistemi
-- 034-task-dependencies.sql

-- Görev bağımlılıkları tablosu
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'relates_to', 'duplicates')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Aynı görev kendisine bağımlı olamaz
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
  
  -- Aynı bağımlılık tekrar edemez
  CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id, dependency_type)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_type ON task_dependencies(dependency_type);

-- RLS politikaları
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Görev sahibi veya takım üyesi bağımlılık oluşturabilir
DROP POLICY IF EXISTS "Users can create task dependencies for their tasks" ON task_dependencies;
CREATE POLICY "Users can create task dependencies for their tasks" ON task_dependencies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tasks t 
      WHERE t.id = task_id 
      AND (t.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = t.project_id 
        AND pm.user_id = auth.uid()
      ))
    )
  );

-- Görev sahibi veya takım üyesi bağımlılık okuyabilir
DROP POLICY IF EXISTS "Users can read task dependencies for their tasks" ON task_dependencies;
CREATE POLICY "Users can read task dependencies for their tasks" ON task_dependencies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_tasks t 
      WHERE t.id = task_id 
      AND (t.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = t.project_id 
        AND pm.user_id = auth.uid()
      ))
    )
  );

-- Görev sahibi veya takım üyesi bağımlılık silebilir
DROP POLICY IF EXISTS "Users can delete task dependencies for their tasks" ON task_dependencies;
CREATE POLICY "Users can delete task dependencies for their tasks" ON task_dependencies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_tasks t 
      WHERE t.id = task_id 
      AND (t.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = t.project_id 
        AND pm.user_id = auth.uid()
      ))
    )
  );

-- Bağımlılık türleri için enum
DO $$ BEGIN
  CREATE TYPE dependency_type_enum AS ENUM ('blocks', 'relates_to', 'duplicates');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Görev bağımlılık durumu için view
CREATE OR REPLACE VIEW task_dependency_status AS
SELECT 
  t.id as task_id,
  t.title as task_title,
  t.status as task_status,
  t.due_date as task_due_date,
  COUNT(td.id) as total_dependencies,
  COUNT(CASE WHEN td.dependency_type = 'blocks' THEN 1 END) as blocking_dependencies,
  COUNT(CASE WHEN td.dependency_type = 'relates_to' THEN 1 END) as related_dependencies,
  COUNT(CASE WHEN td.dependency_type = 'duplicates' THEN 1 END) as duplicate_dependencies,
  -- Bağımlılık durumu
  CASE 
    WHEN COUNT(td.id) = 0 THEN 'no_dependencies'
    WHEN COUNT(CASE WHEN td.dependency_type = 'blocks' AND td2.status != 'completed' THEN 1 END) > 0 THEN 'blocked'
    WHEN COUNT(CASE WHEN td.dependency_type = 'blocks' AND td2.status = 'completed' THEN 1 END) = COUNT(CASE WHEN td.dependency_type = 'blocks' THEN 1 END) THEN 'ready'
    ELSE 'partial'
  END as dependency_status
FROM project_tasks t
LEFT JOIN task_dependencies td ON t.id = td.task_id
LEFT JOIN project_tasks td2 ON td.depends_on_task_id = td2.id
GROUP BY t.id, t.title, t.status, t.due_date;

-- Bağımlılık zinciri kontrolü için fonksiyon
CREATE OR REPLACE FUNCTION check_dependency_cycle()
RETURNS TRIGGER AS $$
DECLARE
  cycle_found BOOLEAN := FALSE;
BEGIN
  -- Döngü kontrolü
  WITH RECURSIVE dependency_chain AS (
    SELECT task_id, depends_on_task_id, 1 as depth
    FROM task_dependencies 
    WHERE task_id = NEW.task_id
    
    UNION ALL
    
    SELECT td.task_id, td.depends_on_task_id, dc.depth + 1
    FROM task_dependencies td
    JOIN dependency_chain dc ON td.task_id = dc.depends_on_task_id
    WHERE dc.depth < 10 -- Maksimum derinlik
  )
  SELECT EXISTS(
    SELECT 1 FROM dependency_chain 
    WHERE task_id = NEW.depends_on_task_id 
    AND depends_on_task_id = NEW.task_id
  ) INTO cycle_found;
  
  IF cycle_found THEN
    RAISE EXCEPTION 'Döngüsel bağımlılık oluşturulamaz: % -> %', NEW.task_id, NEW.depends_on_task_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Döngü kontrolü trigger'ı
DROP TRIGGER IF EXISTS check_dependency_cycle_trigger ON task_dependencies;
CREATE TRIGGER check_dependency_cycle_trigger
  BEFORE INSERT OR UPDATE ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION check_dependency_cycle();

-- Bağımlılık güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_task_dependency_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_task_dependency_updated_at_trigger ON task_dependencies;
CREATE TRIGGER update_task_dependency_updated_at_trigger
  BEFORE UPDATE ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION update_task_dependency_updated_at();

-- Bağımlılık istatistikleri için fonksiyon
CREATE OR REPLACE FUNCTION get_task_dependency_stats(task_uuid UUID)
RETURNS TABLE (
  total_dependencies INTEGER,
  blocking_dependencies INTEGER,
  related_dependencies INTEGER,
  duplicate_dependencies INTEGER,
  dependency_status TEXT,
  blocked_by_tasks TEXT[],
  blocks_tasks TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tds.total_dependencies::integer,
    tds.blocking_dependencies::integer,
    tds.related_dependencies::integer,
    tds.duplicate_dependencies::integer,
    tds.dependency_status,
    -- Engellenen görevler
    ARRAY(
      SELECT t2.title 
      FROM task_dependencies td 
      JOIN project_tasks t2 ON td.depends_on_task_id = t2.id 
      WHERE td.task_id = task_uuid AND td.dependency_type = 'blocks' AND t2.status != 'completed'
    ),
    -- Engellediği görevler
    ARRAY(
      SELECT t3.title 
      FROM task_dependencies td 
      JOIN project_tasks t3 ON td.task_id = t3.id 
      WHERE td.depends_on_task_id = task_uuid AND td.dependency_type = 'blocks'
    )
  FROM task_dependency_status tds
  WHERE tds.task_id = task_uuid;
END;
$$ LANGUAGE plpgsql;

-- Bağımlılık zinciri görüntüleme fonksiyonu
CREATE OR REPLACE FUNCTION get_dependency_chain(task_uuid UUID, max_depth INTEGER DEFAULT 5)
RETURNS TABLE (
  task_id UUID,
  task_title TEXT,
  task_status TEXT,
  dependency_type TEXT,
  depth INTEGER,
  path TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dependency_chain AS (
    SELECT 
      t.id as task_id,
      t.title as task_title,
      t.status as task_status,
      'root'::TEXT as dependency_type,
      0 as depth,
      ARRAY[t.title] as path
    FROM project_tasks t
    WHERE t.id = task_uuid
    
    UNION ALL
    
    SELECT 
      t.id as task_id,
      t.title as task_title,
      t.status as task_status,
      td.dependency_type,
      dc.depth + 1,
      dc.path || t.title
    FROM project_tasks t
    JOIN task_dependencies td ON t.id = td.depends_on_task_id
    JOIN dependency_chain dc ON td.task_id = dc.task_id
    WHERE dc.depth < max_depth
  )
  SELECT * FROM dependency_chain ORDER BY depth, task_title;
END;
$$ LANGUAGE plpgsql;
