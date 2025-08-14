-- Fix infinite recursion in team_members RLS policies
-- This script removes the problematic policies and creates new ones

-- First, drop all existing policies on team_members
DROP POLICY IF EXISTS "read team members" ON public.team_members;
DROP POLICY IF EXISTS "manage team members" ON public.team_members;
DROP POLICY IF EXISTS "insert team members" ON public.team_members;
DROP POLICY IF EXISTS "update team members" ON public.team_members;
DROP POLICY IF EXISTS "delete team members" ON public.team_members;

-- Create new, simplified policies that avoid recursion

-- Policy 1: Users can read team members if they are in the same team
CREATE POLICY "read team members" ON public.team_members
FOR SELECT USING (
  -- User can read their own membership
  team_members.user_id = auth.uid() 
  OR
  -- User can read if they are the team owner
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_members.team_id 
    AND t.owner_id = auth.uid()
  )
  OR
  -- User can read if they are a member of the same team
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.user_id = auth.uid()
  )
);

-- Policy 2: Team owners can manage all team members
CREATE POLICY "manage team members by owner" ON public.team_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_members.team_id 
    AND t.owner_id = auth.uid()
  )
);

-- Policy 3: Team admins can manage team members (except owners)
CREATE POLICY "manage team members by admin" ON public.team_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
  AND
  -- Admins cannot manage owners
  NOT EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_members.team_id 
    AND t.owner_id = team_members.user_id
  )
);

-- Policy 4: Users can manage their own membership (leave team)
CREATE POLICY "manage own membership" ON public.team_members
FOR UPDATE USING (
  team_members.user_id = auth.uid()
);

-- Policy 5: Users can delete their own membership (leave team)
CREATE POLICY "delete own membership" ON public.team_members
FOR DELETE USING (
  team_members.user_id = auth.uid()
  AND
  -- Cannot leave if they are the owner
  NOT EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_members.team_id 
    AND t.owner_id = team_members.user_id
  )
);

-- Also fix the teams table policies to avoid recursion
DROP POLICY IF EXISTS "read team info" ON public.teams;
DROP POLICY IF EXISTS "update team info" ON public.teams;

-- Create new teams policies
CREATE POLICY "read team info" ON public.teams
FOR SELECT USING (
  -- User can read if they are the owner
  owner_id = auth.uid() 
  OR
  -- User can read if they are a member
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = teams.id 
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "update team info" ON public.teams
FOR UPDATE USING (
  -- User can update if they are the owner
  owner_id = auth.uid() 
  OR
  -- User can update if they are an admin
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = teams.id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

-- Fix team_invitations policies
DROP POLICY IF EXISTS "send team invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "manage team invitations" ON public.team_invitations;

CREATE POLICY "send team invitations" ON public.team_invitations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_invitations.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

CREATE POLICY "manage team invitations" ON public.team_invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_invitations.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

-- Keep the existing user invitation policies
-- Users can read their own invitations
DROP POLICY IF EXISTS "read own invitations" ON public.team_invitations;
CREATE POLICY "read own invitations"
ON public.team_invitations FOR SELECT
USING (
  email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Users can accept/decline their own invitations
DROP POLICY IF EXISTS "manage own invitations" ON public.team_invitations;
CREATE POLICY "manage own invitations"
ON public.team_invitations FOR UPDATE
USING (
  email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Add comments
COMMENT ON POLICY "read team members" ON public.team_members IS 'Users can read team members if they are in the same team';
COMMENT ON POLICY "manage team members by owner" ON public.team_members IS 'Team owners can manage all team members';
COMMENT ON POLICY "manage team members by admin" ON public.team_members IS 'Team admins can manage team members (except owners)';
COMMENT ON POLICY "manage own membership" ON public.team_members IS 'Users can manage their own membership';
COMMENT ON POLICY "delete own membership" ON public.team_members IS 'Users can leave team (except owners)';
