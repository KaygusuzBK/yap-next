-- Tasks table with RLS tied to project ownership

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'todo',
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Timestamp trigger
drop trigger if exists set_timestamp_tasks on public.tasks;
create trigger set_timestamp_tasks
before update on public.tasks
for each row execute function public.trigger_set_timestamp();

-- RLS
alter table public.tasks enable row level security;

-- Helper predicate: current user owns the parent project
-- Use policies referencing parent project ownership
drop policy if exists "read project tasks" on public.tasks;
create policy "read project tasks"
on public.tasks for select
using (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "insert project tasks" on public.tasks;
create policy "insert project tasks"
on public.tasks for insert
with check (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "update project tasks" on public.tasks;
create policy "update project tasks"
on public.tasks for update
using (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "delete project tasks" on public.tasks;
create policy "delete project tasks"
on public.tasks for delete
using (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and p.owner_id = auth.uid()
  )
);


