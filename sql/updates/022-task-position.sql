-- Add position column to project_tasks for per-column ordering
alter table if exists public.project_tasks
  add column if not exists position int default 0;

-- Helpful composite index for ordering within project/status
create index if not exists idx_project_tasks_project_status_position
  on public.project_tasks(project_id, status, position);


