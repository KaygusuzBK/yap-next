-- Add color column for project task statuses
alter table if exists public.project_task_statuses
  add column if not exists color text not null default '#64748b';


