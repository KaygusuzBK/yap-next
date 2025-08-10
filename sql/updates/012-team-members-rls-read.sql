-- Safe read access to team_members for team owners and members

-- Remove custom membership policy to avoid recursion; rely on RPC instead
do $$ begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='read team members'
  ) then
    drop policy "read team members" on public.team_members;
  end if;
end $$;


