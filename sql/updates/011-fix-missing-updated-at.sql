-- Ensure updated_at exists on team-related tables used by triggers

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='team_invitations' and column_name='updated_at'
  ) then
    alter table public.team_invitations add column updated_at timestamptz not null default now();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='team_members' and column_name='updated_at'
  ) then
    alter table public.team_members add column updated_at timestamptz not null default now();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='teams' and column_name='updated_at'
  ) then
    alter table public.teams add column updated_at timestamptz not null default now();
  end if;
end $$;

-- Recreate timestamp triggers to be safe
drop trigger if exists set_timestamp_team_invitations on public.team_invitations;
create trigger set_timestamp_team_invitations
before update on public.team_invitations
for each row execute function public.trigger_set_timestamp();

drop trigger if exists set_timestamp_team_members on public.team_members;
create trigger set_timestamp_team_members
before update on public.team_members
for each row execute function public.trigger_set_timestamp();

drop trigger if exists set_timestamp_teams on public.teams;
create trigger set_timestamp_teams
before update on public.teams
for each row execute function public.trigger_set_timestamp();


