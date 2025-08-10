-- RPC: get_team_members - returns full member list for a team if caller is owner or member

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
language plpgsql
security definer
set search_path = public
as $$
begin
  -- authorize: owner or member
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
end;
$$;

revoke all on function public.get_team_members(uuid) from public;
grant execute on function public.get_team_members(uuid) to authenticated, anon;


