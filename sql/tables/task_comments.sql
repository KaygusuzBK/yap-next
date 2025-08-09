-- Task comments table (matches tasks.sql definition)
create table if not exists public.task_comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.project_tasks(id) on delete cascade not null,
  content text not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index if not exists idx_task_comments_task on public.task_comments(task_id);
create index if not exists idx_task_comments_created_by on public.task_comments(created_by);
create index if not exists idx_task_comments_created_at on public.task_comments(created_at);

-- RLS
alter table public.task_comments enable row level security;

-- Helper visibility: user must be a member/owner of the task's project
-- Members table: public.project_members(project_id, user_id)
-- Projects: public.projects(id, owner_id)

do $$ begin
  create policy task_comments_select on public.task_comments
    for select using (
      exists (
        select 1
        from public.project_tasks t
        join public.projects p on p.id = t.project_id
        left join public.project_members pm on pm.project_id = t.project_id and pm.user_id = auth.uid()
        where t.id = task_id and (p.owner_id = auth.uid() or pm.user_id = auth.uid())
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy task_comments_insert on public.task_comments
    for insert with check (
      created_by = auth.uid() and
      exists (
        select 1
        from public.project_tasks t
        join public.projects p on p.id = t.project_id
        left join public.project_members pm on pm.project_id = t.project_id and pm.user_id = auth.uid()
        where t.id = task_id and (p.owner_id = auth.uid() or pm.user_id = auth.uid())
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy task_comments_delete on public.task_comments
    for delete using (
      created_by = auth.uid()
    );
exception when duplicate_object then null; end $$;


