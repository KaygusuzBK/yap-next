-- Teams, memberships, invitations

-- Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp_teams on public.teams;
create trigger set_timestamp_teams
before update on public.teams
for each row execute function public.trigger_set_timestamp();

-- Add owner as member automatically (avoid client-side recursion via policies)
drop trigger if exists on_team_created_add_owner on public.teams;
create trigger on_team_created_add_owner
after insert on public.teams
for each row execute function public.handle_new_team();

-- Team members
create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member', -- 'owner' | 'admin' | 'member'
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- Invitations (basic)
create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  status text not null default 'pending', -- pending | accepted | canceled
  token text not null,
  created_at timestamptz not null default now()
);

-- Add team_id to projects
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'team_id'
  ) then
    alter table public.projects
      add column team_id uuid references public.teams(id) on delete cascade;
  end if;
end $$;

-- Enable RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;

-- Teams policies
drop policy if exists "select team as member" on public.teams;
create policy "select team as member"
on public.teams for select
using (
  -- Avoid referencing team_members in a way that reads it (to prevent recursion)
  -- Check ownership directly OR fallback to exists with minimal dependency via owner_id
  owner_id = auth.uid()
  or exists (
    select 1 from public.team_members m
    where m.team_id = teams.id and m.user_id = auth.uid()
  )
);

drop policy if exists "insert team as owner" on public.teams;
create policy "insert team as owner"
on public.teams for insert
with check (owner_id = auth.uid());

drop policy if exists "update own team" on public.teams;
create policy "update own team"
on public.teams for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "delete own team" on public.teams;
create policy "delete own team"
on public.teams for delete
using (owner_id = auth.uid());

-- Team members policies
drop policy if exists "select team members as member" on public.team_members;
create policy "select team members as member"
on public.team_members for select
using (
  -- Avoid cycles: only allow each user to see their own membership row
  team_members.user_id = auth.uid()
);

drop policy if exists "insert team members as owner" on public.team_members;
create policy "insert team members as owner"
on public.team_members for insert
with check (
  -- Owner can add members; relies on teams.owner_id, not reading team_members
  exists (
    select 1 from public.teams t
    where t.id = team_members.team_id and t.owner_id = auth.uid()
  )
);

drop policy if exists "delete team members as owner" on public.team_members;
create policy "delete team members as owner"
on public.team_members for delete
using (
  exists (
    select 1 from public.teams t
    where t.id = team_members.team_id and t.owner_id = auth.uid()
  )
);

-- Invitations policies (owner can manage; invitee email can read their own invites)
drop policy if exists "select invites as owner or invitee" on public.team_invitations;
create policy "select invites as owner or invitee"
on public.team_invitations for select
using (
  exists (
    select 1 from public.teams t
    where t.id = team_invitations.team_id and t.owner_id = auth.uid()
  )
  or team_invitations.email = auth.email()
);

drop policy if exists "insert invites as owner" on public.team_invitations;
create policy "insert invites as owner"
on public.team_invitations for insert
with check (
  exists (
    select 1 from public.teams t
    where t.id = team_invitations.team_id and t.owner_id = auth.uid()
  )
);

drop policy if exists "delete invites as owner" on public.team_invitations;
create policy "delete invites as owner"
on public.team_invitations for delete
using (
  exists (
    select 1 from public.teams t
    where t.id = team_invitations.team_id and t.owner_id = auth.uid()
  )
);

-- Projects policies updated to team-based membership
drop policy if exists "read own projects" on public.projects;
drop policy if exists "insert own projects" on public.projects;
drop policy if exists "update own projects" on public.projects;
drop policy if exists "delete own projects" on public.projects;

drop policy if exists "select team projects" on public.projects;
create policy "select team projects"
on public.projects for select
using (
  exists (
    select 1 from public.team_members tm
    where tm.team_id = projects.team_id and tm.user_id = auth.uid()
  )
);

drop policy if exists "insert team projects as member" on public.projects;
create policy "insert team projects as member"
on public.projects for insert
with check (
  exists (
    select 1 from public.team_members tm
    where tm.team_id = projects.team_id and tm.user_id = auth.uid()
  )
);

drop policy if exists "update team projects as member" on public.projects;
create policy "update team projects as member"
on public.projects for update
using (
  exists (
    select 1 from public.team_members tm
    where tm.team_id = projects.team_id and tm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.team_members tm
    where tm.team_id = projects.team_id and tm.user_id = auth.uid()
  )
);

drop policy if exists "delete team projects as member" on public.projects;
create policy "delete team projects as member"
on public.projects for delete
using (
  exists (
    select 1 from public.team_members tm
    where tm.team_id = projects.team_id and tm.user_id = auth.uid()
  )
);


