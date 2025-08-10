-- Safe read access to team_members for team owners and members

-- Helper: security definer function to check membership without RLS recursion
create or replace function public.user_is_team_member(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.team_id = p_team_id and tm.user_id = auth.uid()
  );
$$;

-- Ensure owner can read, and any member can read all members of their team
do $$ begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='read team members'
  ) then
    drop policy "read team members" on public.team_members;
  end if;
  create policy "read team members" on public.team_members
    for select using (
      team_id in (select id from public.teams where owner_id = auth.uid())
      or public.user_is_team_member(team_id)
    );
end $$;


