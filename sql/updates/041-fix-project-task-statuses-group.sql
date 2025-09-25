-- Fix project_task_statuses table to include 'group' column
-- This resolves the PGRST204 error about missing 'group' column

-- First, check if the table exists and what columns it has
DO $$ 
BEGIN
  -- If the table doesn't exist, create it with the correct structure
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_task_statuses') THEN
    CREATE TABLE public.project_task_statuses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
      key text NOT NULL,
      label text NOT NULL,
      "group" text NOT NULL CHECK ("group" IN ('todo','in_progress','review','completed')),
      position integer NOT NULL DEFAULT 0,
      is_default boolean NOT NULL DEFAULT false,
      color text DEFAULT '#64748b',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(project_id, key)
    );
  ELSE
    -- Table exists, add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_task_statuses' AND column_name = 'group') THEN
      ALTER TABLE public.project_task_statuses ADD COLUMN "group" text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_task_statuses' AND column_name = 'key') THEN
      ALTER TABLE public.project_task_statuses ADD COLUMN key text;
    END IF;
    
    IF NOT EXISTS EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_task_statuses' AND column_name = 'label') THEN
      ALTER TABLE public.project_task_statuses ADD COLUMN label text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_task_statuses' AND column_name = 'position') THEN
      ALTER TABLE public.project_task_statuses ADD COLUMN position integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_task_statuses' AND column_name = 'is_default') THEN
      ALTER TABLE public.project_task_statuses ADD COLUMN is_default boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_task_statuses' AND column_name = 'color') THEN
      ALTER TABLE public.project_task_statuses ADD COLUMN color text DEFAULT '#64748b';
    END IF;
  END IF;
END $$;

-- Update existing data to have proper group values
UPDATE public.project_task_statuses 
SET "group" = CASE 
  WHEN name = 'Yapılacak' OR label = 'Yapılacak' THEN 'todo'
  WHEN name = 'Devam Ediyor' OR label = 'Devam Ediyor' THEN 'in_progress'
  WHEN name = 'İncelemede' OR label = 'İncelemede' THEN 'review'
  WHEN name = 'Tamamlandı' OR label = 'Tamamlandı' THEN 'completed'
  ELSE 'todo'
END
WHERE "group" IS NULL;

-- Update key column if it's null
UPDATE public.project_task_statuses 
SET key = CASE 
  WHEN "group" = 'todo' THEN 'todo'
  WHEN "group" = 'in_progress' THEN 'in_progress'
  WHEN "group" = 'review' THEN 'review'
  WHEN "group" = 'completed' THEN 'completed'
  ELSE 'todo'
END
WHERE key IS NULL;

-- Update label column if it's null
UPDATE public.project_task_statuses 
SET label = CASE 
  WHEN "group" = 'todo' THEN 'Yapılacak'
  WHEN "group" = 'in_progress' THEN 'Devam Ediyor'
  WHEN "group" = 'review' THEN 'İncelemede'
  WHEN "group" = 'completed' THEN 'Tamamlandı'
  ELSE 'Yapılacak'
END
WHERE label IS NULL;

-- Add constraints
ALTER TABLE public.project_task_statuses 
ADD CONSTRAINT IF NOT EXISTS project_task_statuses_group_check 
CHECK ("group" IN ('todo','in_progress','review','completed'));

-- Add unique constraint
ALTER TABLE public.project_task_statuses 
ADD CONSTRAINT IF NOT EXISTS project_task_statuses_project_key_unique 
UNIQUE (project_id, key);

-- Ensure only one default per group per project
CREATE UNIQUE INDEX IF NOT EXISTS project_task_statuses_default_per_group
ON public.project_task_statuses (project_id, "group")
WHERE is_default;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_project_task_statuses_updated_at ON public.project_task_statuses;
CREATE TRIGGER update_project_task_statuses_updated_at
  BEFORE UPDATE ON public.project_task_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default statuses for existing projects if they don't exist
INSERT INTO public.project_task_statuses (project_id, key, label, "group", position, is_default, color)
SELECT p.id, s.key, s.label, s."group", s.position, true, s.color
FROM public.projects p
CROSS JOIN (VALUES
  ('todo', 'Yapılacak', 'todo', 0, '#6b7280'),
  ('in_progress', 'Devam Ediyor', 'in_progress', 1, '#3b82f6'),
  ('review', 'İncelemede', 'review', 2, '#f59e0b'),
  ('completed', 'Tamamlandı', 'completed', 3, '#10b981')
) AS s(key, label, "group", position, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_task_statuses pts
  WHERE pts.project_id = p.id AND pts.key = s.key
);
