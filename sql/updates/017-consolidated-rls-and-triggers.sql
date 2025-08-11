-- Consolidated RLS, triggers, and schema fixes as of latest state

-- 1) Ensure updated_at columns exist where needed
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='teams' and column_name='updated_at') then
    alter table public.teams add column updated_at timestamptz default now();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='team_members' and column_name='updated_at') then
    alter table public.team_members add column updated_at timestamptz default now();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='team_invitations' and column_name='updated_at') then
    alter table public.team_invitations add column updated_at timestamptz default now();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='slack_channel_id') then
    alter table public.projects add column slack_channel_id text;
  end if;
end $$;

-- 2) Recreate generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3) Attach updated_at triggers
do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname='trg_set_updated_at_teams'
  ) then
    create trigger trg_set_updated_at_teams before update on public.teams
    for each row execute function public.set_updated_at();
  end if;
  if not exists (
    select 1 from pg_trigger where tgname='trg_set_updated_at_team_members'
  ) then
    create trigger trg_set_updated_at_team_members before update on public.team_members
    for each row execute function public.set_updated_at();
  end if;
  if not exists (
    select 1 from pg_trigger where tgname='trg_set_updated_at_team_invitations'
  ) then
    create trigger trg_set_updated_at_team_invitations before update on public.team_invitations
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- 4) Team members minimal RLS reset (non-recursive)
alter table public.team_members enable row level security;
drop policy if exists tm_select on public.team_members;
drop policy if exists tm_insert on public.team_members;
drop policy if exists tm_update on public.team_members;
drop policy if exists tm_delete on public.team_members;

create policy tm_select on public.team_members
  for select using (
    exists(select 1 from public.teams t where t.id = team_members.team_id and (t.owner_id = auth.uid()))
    or team_members.user_id = auth.uid()
  );

create policy tm_insert on public.team_members
  for insert with check (
    exists(select 1 from public.teams t where t.id = team_members.team_id and (t.owner_id = auth.uid()))
  );

create policy tm_update on public.team_members
  for update using (
    exists(select 1 from public.teams t where t.id = team_members.team_id and (t.owner_id = auth.uid()))
    or team_members.user_id = auth.uid()
  ) with check (
    exists(select 1 from public.teams t where t.id = team_members.team_id and (t.owner_id = auth.uid()))
    or team_members.user_id = auth.uid()
  );

create policy tm_delete on public.team_members
  for delete using (
    exists(select 1 from public.teams t where t.id = team_members.team_id and (t.owner_id = auth.uid()))
    or team_members.user_id = auth.uid()
  );

-- 5) Invitations RLS (case-insensitive email match for invited users)
alter table public.team_invitations enable row level security;
drop policy if exists ti_select on public.team_invitations;
drop policy if exists ti_insert on public.team_invitations;
drop policy if exists ti_update on public.team_invitations;
drop policy if exists ti_delete on public.team_invitations;

create policy ti_select on public.team_invitations
  for select using (
    exists(select 1 from public.teams t where t.id = team_invitations.team_id and (t.owner_id = auth.uid()))
    or lower(team_invitations.email) = lower(coalesce(auth.jwt() ->> 'email',''))
  );

create policy ti_insert on public.team_invitations
  for insert with check (
    exists(select 1 from public.teams t where t.id = team_invitations.team_id and (t.owner_id = auth.uid()))
  );

create policy ti_update on public.team_invitations
  for update using (
    exists(select 1 from public.teams t where t.id = team_invitations.team_id and (t.owner_id = auth.uid()))
    or lower(team_invitations.email) = lower(coalesce(auth.jwt() ->> 'email',''))
  );

create policy ti_delete on public.team_invitations
  for delete using (
    exists(select 1 from public.teams t where t.id = team_invitations.team_id and (t.owner_id = auth.uid()))
  );

-- 6) Recreate RPCs (id = user_id fix)
create or replace function public.get_team_members(p_team_id uuid)
returns table (
  id uuid,
  team_id uuid,
  user_id uuid,
  role text,
  created_at timestamptz,
  email text,
  full_name text
)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.teams t where t.id = p_team_id and t.owner_id = auth.uid())
     and not exists (select 1 from public.team_members tm where tm.team_id = p_team_id and tm.user_id = auth.uid()) then
    return;
  end if;
  return query
  select tm.user_id as id, tm.team_id, tm.user_id, tm.role, tm.created_at, p.email, p.name as full_name
  from public.team_members tm
  left join public.profiles p on p.id = tm.user_id
  where tm.team_id = p_team_id
  order by tm.created_at asc;
end; $$;
revoke all on function public.get_team_members(uuid) from public;
grant execute on function public.get_team_members(uuid) to authenticated, anon;

create or replace function public.get_team_members_for_invited(p_team_id uuid)
returns table (
  id uuid,
  team_id uuid,
  user_id uuid,
  role text,
  created_at timestamptz,
  email text,
  full_name text
)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.team_invitations ti
    where ti.team_id = p_team_id
      and lower(ti.email) = lower(coalesce(auth.jwt() ->> 'email',''))
      and ti.accepted_at is null
      and ti.expires_at > now()
  ) then
    return;
  end if;
  return query
  select tm.user_id as id, tm.team_id, tm.user_id, tm.role, tm.created_at, p.email, p.name as full_name
  from public.team_members tm
  left join public.profiles p on p.id = tm.user_id
  where tm.team_id = p_team_id
  order by tm.created_at asc;
end; $$;
revoke all on function public.get_team_members_for_invited(uuid) from public;
grant execute on function public.get_team_members_for_invited(uuid) to authenticated, anon;


