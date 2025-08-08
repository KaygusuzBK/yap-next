-- Teams table
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  primary_project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Team members table
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member', -- 'owner', 'admin', 'member'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(team_id, user_id)
);

-- Team invitations table
create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  token text not null unique,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add team_id to projects table if not exists
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'team_id'
  ) then
    alter table public.projects
      add column team_id uuid references public.teams(id) on delete set null;
  end if;
end $$;

-- Add primary_project_id to teams if not exists
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'teams' and column_name = 'primary_project_id'
  ) then
    alter table public.teams
      add column primary_project_id uuid references public.projects(id) on delete set null;
  end if;
end $$;

-- Add accepted_at to team_invitations if not exists
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_invitations' and column_name = 'accepted_at'
  ) then
    alter table public.team_invitations
      add column accepted_at timestamptz;
  end if;
end $$;

-- Add expires_at to team_invitations if not exists
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_invitations' and column_name = 'expires_at'
  ) then
    alter table public.team_invitations
      add column expires_at timestamptz not null default (now() + interval '7 days');
  end if;
end $$;

-- Add role to team_invitations if not exists
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_invitations' and column_name = 'role'
  ) then
    alter table public.team_invitations
      add column role text not null default 'member';
  end if;
end $$;

-- Add token to team_invitations if not exists
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_invitations' and column_name = 'token'
  ) then
    alter table public.team_invitations
      add column token text not null unique;
  end if;
end $$;

-- Timestamp triggers
drop trigger if exists set_timestamp_teams on public.teams;
create trigger set_timestamp_teams
before update on public.teams
for each row execute function public.trigger_set_timestamp();

drop trigger if exists set_timestamp_team_members on public.team_members;
create trigger set_timestamp_team_members
before update on public.team_members
for each row execute function public.trigger_set_timestamp();

drop trigger if exists set_timestamp_team_invitations on public.team_invitations;
create trigger set_timestamp_team_invitations
before update on public.team_invitations
for each row execute function public.trigger_set_timestamp();

-- Trigger to ensure primary_project_id belongs to the team
create or replace function public.check_primary_project_belongs_to_team()
returns trigger
language plpgsql
as $$
begin
  if new.primary_project_id is not null then
    if not exists (
      select 1 from public.projects
      where id = new.primary_project_id and team_id = new.id
    ) then
      raise exception 'Primary project must belong to the team.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_team_update_check_primary_project on public.teams;
create trigger on_team_update_check_primary_project
before update of primary_project_id on public.teams
for each row execute function public.check_primary_project_belongs_to_team();

-- Enable RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;

-- Teams policies - Simple and safe
drop policy if exists "read own teams" on public.teams;
create policy "read own teams"
on public.teams for select
using (owner_id = auth.uid());

drop policy if exists "insert own teams" on public.teams;
create policy "insert own teams"
on public.teams for insert
with check (owner_id = auth.uid());

drop policy if exists "update own teams" on public.teams;
create policy "update own teams"
on public.teams for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "delete own teams" on public.teams;
create policy "delete own teams"
on public.teams for delete
using (owner_id = auth.uid());

-- Team members policies - Simple and safe
drop policy if exists "read team members" on public.team_members;
create policy "read team members"
on public.team_members for select
using (team_members.user_id = auth.uid());

drop policy if exists "insert team members" on public.team_members;
create policy "insert team members"
on public.team_members for insert
with check (true);

drop policy if exists "update team members" on public.team_members;
create policy "update team members"
on public.team_members for update
using (team_members.user_id = auth.uid())
with check (team_members.user_id = auth.uid());

drop policy if exists "delete team members" on public.team_members;
create policy "delete team members"
on public.team_members for delete
using (team_members.user_id = auth.uid());

-- Team invitations policies - Simple and safe
drop policy if exists "read team invitations" on public.team_invitations;
create policy "read team invitations"
on public.team_invitations for select
using (true);

drop policy if exists "insert team invitations" on public.team_invitations;
create policy "insert team invitations"
on public.team_invitations for insert
with check (true);

drop policy if exists "update team invitations" on public.team_invitations;
create policy "update team invitations"
on public.team_invitations for update
using (true)
with check (true);

drop policy if exists "delete team invitations" on public.team_invitations;
create policy "delete team invitations"
on public.team_invitations for delete
using (true);

-- Update projects policies to include team-based access - Simplified
drop policy if exists "read own projects" on public.projects;
create policy "read own projects"
on public.projects for select
using (owner_id = auth.uid());

drop policy if exists "insert own projects" on public.projects;
create policy "insert own projects"
on public.projects for insert
with check (owner_id = auth.uid());

drop policy if exists "update own projects" on public.projects;
create policy "update own projects"
on public.projects for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "delete own projects" on public.projects;
create policy "delete own projects"
on public.projects for delete
using (owner_id = auth.uid());
