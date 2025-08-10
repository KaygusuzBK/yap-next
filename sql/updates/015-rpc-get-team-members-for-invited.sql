-- RPC: get_team_members_for_invited - allow invited user (by email claim) to see members of that team

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
language plpgsql
security definer
set search_path = public
as $$
begin
  -- authorize: there is a pending, non-expired invitation for the caller's email to this team
  if not exists (
    select 1 from public.team_invitations ti
    where ti.team_id = p_team_id
      and lower(ti.email) = lower(coalesce(auth.jwt() ->> 'email',''))
      and ti.accepted_at is null
      and ti.expires_at > now()
  ) then
    return; -- unauthorized -> empty set
  end if;

  return query
  select tm.id, tm.team_id, tm.user_id, tm.role, tm.created_at, p.email, p.name as full_name
  from public.team_members tm
  left join public.profiles p on p.id = tm.user_id
  where tm.team_id = p_team_id
  order by tm.created_at asc;
end;
$$;

revoke all on function public.get_team_members_for_invited(uuid) from public;
grant execute on function public.get_team_members_for_invited(uuid) to authenticated, anon;


