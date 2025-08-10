-- Dynamic per-project task statuses

-- 1) Create project_task_statuses table
create table if not exists public.project_task_statuses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null,
  label text not null,
  "group" text not null check ("group" in ('todo','in_progress','review','completed')),
  position integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, key)
);

-- Ensure only one default per group per project
create unique index if not exists project_task_statuses_default_per_group
  on public.project_task_statuses (project_id, "group")
  where is_default;

-- 2) Relax project_tasks.status constraint to allow custom keys
do $$ begin
  if exists (
    select 1
    from information_schema.constraint_column_usage ccu
    join information_schema.table_constraints tc
      on tc.constraint_name = ccu.constraint_name
    where ccu.table_schema = 'public'
      and ccu.table_name = 'project_tasks'
      and ccu.column_name = 'status'
      and tc.constraint_type = 'CHECK'
  ) then
    alter table public.project_tasks drop constraint if exists project_tasks_status_check;
  end if;
end $$;

-- 3) Seed default statuses for existing projects
insert into public.project_task_statuses (project_id, key, label, "group", position, is_default)
select p.id, s.key, s.label, s."group", s.position, true
from public.projects p
cross join (values
  ('todo', 'Yapılacak', 'todo', 0),
  ('in_progress', 'Devam Ediyor', 'in_progress', 1),
  ('review', 'İncelemede', 'review', 2),
  ('completed', 'Tamamlandı', 'completed', 3)
) as s(key, label, "group", position)
where not exists (
  select 1 from public.project_task_statuses pts
  where pts.project_id = p.id and pts.key = s.key
);

-- 4) Trigger to keep updated_at fresh
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists project_task_statuses_updated_at on public.project_task_statuses;
create trigger project_task_statuses_updated_at
before update on public.project_task_statuses
for each row execute procedure public.update_updated_at_column();


