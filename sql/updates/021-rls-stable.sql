-- RLS stable set (idempotent, non-recursive)
-- Applies safe policies for core tables used by the app

-- 0) Cleanup conflicting/legacy policies and disable legacy tasks RLS
do $$
declare r record;
begin
  for r in (
    select tablename, policyname
    from pg_policies
    where schemaname='public'
      and tablename in (
        'teams','team_members','projects','project_members','project_tasks',
        'project_files','project_comments','team_invitations'
      )
  ) loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Optional: legacy tasks table not used by app
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='tasks') then
    execute 'alter table public.tasks disable row level security';
  end if;
end $$;

-- 1) TEAMS
alter table public.teams enable row level security;

create policy teams_select_owner
  on public.teams for select using (owner_id = auth.uid());

create policy teams_select_member
  on public.teams for select using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = public.teams.id and tm.user_id = auth.uid()
    )
);

create policy teams_insert
  on public.teams for insert with check (owner_id = auth.uid());

create policy teams_update
  on public.teams for update using (owner_id = auth.uid());

create policy teams_delete
  on public.teams for delete using (owner_id = auth.uid());

-- 2) TEAM_MEMBERS
alter table public.team_members enable row level security;

create policy tm_select
  on public.team_members for select using (
    user_id = auth.uid()
    or exists (select 1 from public.teams t
               where t.id = team_members.team_id and t.owner_id = auth.uid())
);

create policy tm_insert
  on public.team_members for insert with check (
    exists (select 1 from public.teams t
            where t.id = team_members.team_id and t.owner_id = auth.uid())
);

create policy tm_update
  on public.team_members for update using (
    user_id = auth.uid()
    or exists (select 1 from public.teams t
               where t.id = team_members.team_id and t.owner_id = auth.uid())
) with check (
    user_id = auth.uid()
    or exists (select 1 from public.teams t
               where t.id = team_members.team_id and t.owner_id = auth.uid())
);

create policy tm_delete
  on public.team_members for delete using (
    exists (select 1 from public.teams t
            where t.id = team_members.team_id and t.owner_id = auth.uid())
);

-- 3) PROJECTS (owner_id)
alter table public.projects enable row level security;

create policy prj_select
  on public.projects for select using (
    owner_id = auth.uid()
    or exists (select 1 from public.project_members pm
               where pm.project_id = public.projects.id and pm.user_id = auth.uid())
    or exists (select 1 from public.teams t
               where t.id = public.projects.team_id and t.owner_id = auth.uid())
);

create policy prj_insert
  on public.projects for insert with check (owner_id = auth.uid());

create policy prj_update
  on public.projects for update using (
    owner_id = auth.uid()
    or exists (select 1 from public.teams t
               where t.id = public.projects.team_id and t.owner_id = auth.uid())
);

create policy prj_delete
  on public.projects for delete using (
    owner_id = auth.uid()
    or exists (select 1 from public.teams t
               where t.id = public.projects.team_id and t.owner_id = auth.uid())
);

-- 4) PROJECT_MEMBERS
alter table public.project_members enable row level security;

create policy pm_select
  on public.project_members for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.projects p
      join public.teams t on t.id = p.team_id
      where p.id = public.project_members.project_id
        and (public.project_members.user_id = auth.uid() or t.owner_id = auth.uid())
    )
);

create policy pm_insert
  on public.project_members for insert with check (
    exists (
      select 1 from public.projects p
      join public.teams t on t.id = p.team_id
      where p.id = public.project_members.project_id
        and t.owner_id = auth.uid()
    )
);

create policy pm_update
  on public.project_members for update using (
    exists (
      select 1 from public.projects p
      join public.teams t on t.id = p.team_id
      where p.id = public.project_members.project_id
        and t.owner_id = auth.uid()
    )
);

create policy pm_delete
  on public.project_members for delete using (
    exists (
      select 1 from public.projects p
      join public.teams t on t.id = p.team_id
      where p.id = public.project_members.project_id
        and t.owner_id = auth.uid()
    )
);

-- 5) PROJECT_TASKS (created_by)
alter table public.project_tasks enable row level security;

create policy tasks_select
  on public.project_tasks for select using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = public.project_tasks.project_id
        and pm.user_id = auth.uid()
    )
);

create policy tasks_insert
  on public.project_tasks for insert with check (created_by = auth.uid());

create policy tasks_update
  on public.project_tasks for update using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
);

create policy tasks_delete
  on public.project_tasks for delete using (created_by = auth.uid());

-- 6) FILES / COMMENTS (üye veya owner)
alter table public.project_files enable row level security;
create policy project_files_rw
  on public.project_files
  for all
  using (
    exists(
      select 1 from public.projects p
      join public.project_members pm on pm.project_id = p.id and pm.user_id = auth.uid()
      where p.id = public.project_files.project_id
    )
    or exists (select 1 from public.teams t
               join public.projects p on p.team_id = t.id
               where p.id = public.project_files.project_id and t.owner_id = auth.uid())
  )
  with check (true);

alter table public.project_comments enable row level security;
create policy project_comments_rw
  on public.project_comments
  for all
  using (
    exists(
      select 1 from public.projects p
      join public.project_members pm on pm.project_id = p.id and pm.user_id = auth.uid()
      where p.id = public.project_comments.project_id
    )
    or exists (select 1 from public.teams t
               join public.projects p on p.team_id = t.id
               where p.id = public.project_comments.project_id and t.owner_id = auth.uid())
  )
  with check (true);

-- 7) TEAM_INVITATIONS (owner veya davet edilen)
alter table public.team_invitations enable row level security;
drop policy if exists ti_select on public.team_invitations;
drop policy if exists ti_insert on public.team_invitations;
drop policy if exists ti_update on public.team_invitations;
drop policy if exists ti_delete on public.team_invitations;

create policy ti_select on public.team_invitations
  for select using (
    exists (select 1 from public.teams t where t.id = team_invitations.team_id and t.owner_id = auth.uid())
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email',''))
  );

create policy ti_insert on public.team_invitations
  for insert with check (
    exists (select 1 from public.teams t where t.id = team_invitations.team_id and t.owner_id = auth.uid())
  );

create policy ti_update on public.team_invitations
  for update using (
    exists (select 1 from public.teams t where t.id = team_invitations.team_id and t.owner_id = auth.uid())
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email',''))
  );

create policy ti_delete on public.team_invitations
  for delete using (
    exists (select 1 from public.teams t where t.id = team_invitations.team_id and t.owner_id = auth.uid())
  );


