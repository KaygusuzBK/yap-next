-- Tighten team_invitations policies: only team owner or invited email can read/update/delete

do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_invitations' and policyname='read team invitations') then
    drop policy "read team invitations" on public.team_invitations;
  end if;
  create policy "read team invitations" on public.team_invitations
    for select using (
      team_id in (select id from public.teams where owner_id = auth.uid())
      or (lower(coalesce(auth.jwt() ->> 'email','')) = lower(email))
    );

  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_invitations' and policyname='update team invitations') then
    drop policy "update team invitations" on public.team_invitations;
  end if;
  create policy "update team invitations" on public.team_invitations
    for update using (
      team_id in (select id from public.teams where owner_id = auth.uid())
      or (lower(coalesce(auth.jwt() ->> 'email','')) = lower(email))
    ) with check (
      team_id in (select id from public.teams where owner_id = auth.uid())
      or (lower(coalesce(auth.jwt() ->> 'email','')) = lower(email))
    );

  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_invitations' and policyname='delete team invitations') then
    drop policy "delete team invitations" on public.team_invitations;
  end if;
  create policy "delete team invitations" on public.team_invitations
    for delete using (
      team_id in (select id from public.teams where owner_id = auth.uid())
      or (lower(coalesce(auth.jwt() ->> 'email','')) = lower(email))
    );
end $$;


