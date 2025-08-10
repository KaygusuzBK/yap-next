-- Hotfix: remove cross-table references in RLS to avoid recursion

-- TEAMS: keep simple owner-based rules (no subqueries)
drop policy if exists "read own teams" on public.teams;
create policy "read own teams" on public.teams
  for select using (owner_id = auth.uid());

drop policy if exists "insert own teams" on public.teams;
create policy "insert own teams" on public.teams
  for insert with check (owner_id = auth.uid());

drop policy if exists "update own teams" on public.teams;
create policy "update own teams" on public.teams
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "delete own teams" on public.teams;
create policy "delete own teams" on public.teams
  for delete using (owner_id = auth.uid());

-- TEAM MEMBERS: only self-controlled (no cross-table checks)
drop policy if exists "read team members" on public.team_members;
create policy "read team members" on public.team_members
  for select using (user_id = auth.uid());

drop policy if exists "insert team members" on public.team_members;
create policy "insert team members" on public.team_members
  for insert with check (user_id = auth.uid());

drop policy if exists "update team members" on public.team_members;
create policy "update team members" on public.team_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "delete team members" on public.team_members;
create policy "delete team members" on public.team_members
  for delete using (user_id = auth.uid());

-- TEAM INVITATIONS: allow authenticated read; insert/update/delete allowed to authenticated (handled by app)
drop policy if exists "read team invitations" on public.team_invitations;
create policy "read team invitations" on public.team_invitations
  for select using (auth.uid() is not null);

drop policy if exists "insert team invitations" on public.team_invitations;
create policy "insert team invitations" on public.team_invitations
  for insert with check (auth.uid() is not null);

drop policy if exists "update team invitations" on public.team_invitations;
create policy "update team invitations" on public.team_invitations
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "delete team invitations" on public.team_invitations;
create policy "delete team invitations" on public.team_invitations
  for delete using (auth.uid() is not null);


