-- RLS tightening + helpful indexes for team members & invitations

-- Indexes
create index if not exists team_members_team_id_idx on public.team_members(team_id);
create index if not exists team_invitations_team_id_idx on public.team_invitations(team_id);
create index if not exists team_invitations_email_idx on public.team_invitations(email);

-- Helper expression for auth email
-- We will read the email from JWT claim (works on Supabase)
-- usage: (auth.jwt() ->> 'email')

-- team_members policies
do $$ begin
  -- Read: allow owner of the team or the member themself
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='read team members') then
    drop policy "read team members" on public.team_members;
  end if;
  create policy "read team members" on public.team_members
    for select using (
      user_id = auth.uid() or
      team_id in (select id from public.teams where owner_id = auth.uid())
    );

  -- Insert: invited user inserts their own row when accepting invite
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='insert team members') then
    drop policy "insert team members" on public.team_members;
  end if;
  create policy "insert team members" on public.team_members
    for insert with check (
      user_id = auth.uid()
    );

  -- Update: owners can update team member rows (e.g., change role)
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='update team members') then
    drop policy "update team members" on public.team_members;
  end if;
  create policy "update team members" on public.team_members
    for update using (
      team_id in (select id from public.teams where owner_id = auth.uid())
    ) with check (
      team_id in (select id from public.teams where owner_id = auth.uid())
    );

  -- Delete: allow owner or the member to leave team themself
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_members' and policyname='delete team members') then
    drop policy "delete team members" on public.team_members;
  end if;
  create policy "delete team members" on public.team_members
    for delete using (
      user_id = auth.uid() or
      team_id in (select id from public.teams where owner_id = auth.uid())
    );
end $$;

-- team_invitations policies
do $$ begin
  -- Read: owner of the team OR invitation for my email
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_invitations' and policyname='read team invitations') then
    drop policy "read team invitations" on public.team_invitations;
  end if;
  create policy "read team invitations" on public.team_invitations
    for select using (
      team_id in (select id from public.teams where owner_id = auth.uid())
      or (coalesce(auth.jwt() ->> 'email','') = email)
    );

  -- Insert: only owner can create invitations
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_invitations' and policyname='insert team invitations') then
    drop policy "insert team invitations" on public.team_invitations;
  end if;
  create policy "insert team invitations" on public.team_invitations
    for insert with check (
      team_id in (select id from public.teams where owner_id = auth.uid())
    );

  -- Update: owner or invited user (by email) can update (for accept flow)
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_invitations' and policyname='update team invitations') then
    drop policy "update team invitations" on public.team_invitations;
  end if;
  create policy "update team invitations" on public.team_invitations
    for update using (
      team_id in (select id from public.teams where owner_id = auth.uid())
      or (coalesce(auth.jwt() ->> 'email','') = email)
    ) with check (
      team_id in (select id from public.teams where owner_id = auth.uid())
      or (coalesce(auth.jwt() ->> 'email','') = email)
    );

  -- Delete: only owner can delete invitations
  if exists (select 1 from pg_policies where schemaname='public' and tablename='team_invitations' and policyname='delete team invitations') then
    drop policy "delete team invitations" on public.team_invitations;
  end if;
  create policy "delete team invitations" on public.team_invitations
    for delete using (
      team_id in (select id from public.teams where owner_id = auth.uid())
    );
end $$;


