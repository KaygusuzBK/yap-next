-- Hard reset team_members RLS to avoid recursion and allow safe ops

alter table public.team_members enable row level security;

-- Drop all existing policies on team_members
do $$ begin
  perform 1 from pg_policies where schemaname='public' and tablename='team_members';
  -- Drop known policy names if they exist
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='read team members') then
    drop policy "read team members" on public.team_members;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='insert team members') then
    drop policy "insert team members" on public.team_members;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='update team members') then
    drop policy "update team members" on public.team_members;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='delete team members') then
    drop policy "delete team members" on public.team_members;
  end if;
end $$;

-- Minimal, non-recursive policies
create policy "read team members" on public.team_members
  for select using (
    user_id = auth.uid()
  );

create policy "insert team members" on public.team_members
  for insert with check (
    user_id = auth.uid()
  );

create policy "update team members" on public.team_members
  for update using (
    team_id in (select id from public.teams where owner_id = auth.uid())
  ) with check (
    team_id in (select id from public.teams where owner_id = auth.uid())
  );

create policy "delete team members" on public.team_members
  for delete using (
    user_id = auth.uid() or
    team_id in (select id from public.teams where owner_id = auth.uid())
  );


