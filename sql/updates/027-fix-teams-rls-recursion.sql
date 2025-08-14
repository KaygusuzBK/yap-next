-- Fix infinite recursion in teams RLS policies
-- This script removes ALL problematic policies and creates new, simple ones

-- First, drop ALL existing policies on teams table
DROP POLICY IF EXISTS "read team info" ON public.teams;
DROP POLICY IF EXISTS "update team info" ON public.teams;
DROP POLICY IF EXISTS "transfer team ownership" ON public.teams;
DROP POLICY IF EXISTS "insert teams" ON public.teams;
DROP POLICY IF EXISTS "delete teams" ON public.teams;
DROP POLICY IF EXISTS "manage teams" ON public.teams;

-- Create completely new, simple policies for teams

-- Policy 1: Users can read teams they own
CREATE POLICY "read own teams" ON public.teams
FOR SELECT USING (
  owner_id = auth.uid()
);

-- Policy 2: Users can read teams they are members of
CREATE POLICY "read member teams" ON public.teams
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = teams.id 
    AND tm.user_id = auth.uid()
  )
);

-- Policy 3: Users can create teams (they become owner)
CREATE POLICY "create teams" ON public.teams
FOR INSERT WITH CHECK (
  owner_id = auth.uid()
);

-- Policy 4: Team owners can update their teams
CREATE POLICY "update own teams" ON public.teams
FOR UPDATE USING (
  owner_id = auth.uid()
);

-- Policy 5: Team owners can delete their teams
CREATE POLICY "delete own teams" ON public.teams
FOR DELETE USING (
  owner_id = auth.uid()
);

-- Now fix team_members policies completely
DROP POLICY IF EXISTS "read team members" ON public.team_members;
DROP POLICY IF EXISTS "manage team members by owner" ON public.team_members;
DROP POLICY IF EXISTS "manage team members by admin" ON public.team_members;
DROP POLICY IF EXISTS "manage own membership" ON public.team_members;
DROP POLICY IF EXISTS "delete own membership" ON public.team_members;
DROP POLICY IF EXISTS "insert team members" ON public.team_members;
DROP POLICY IF EXISTS "update team members" ON public.team_members;
DROP POLICY IF EXISTS "delete team members" ON public.team_members;

-- Create simple team_members policies

-- Policy 1: Users can read team members if they are in the same team
CREATE POLICY "read team members" ON public.team_members
FOR SELECT USING (
  -- User can read their own membership
  user_id = auth.uid() 
  OR
  -- User can read if they are the team owner
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
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

-- Policy 2: Team owners can insert new members
CREATE POLICY "insert team members by owner" ON public.team_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

-- Policy 3: Team owners can update member roles
CREATE POLICY "update team members by owner" ON public.team_members
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

-- Policy 4: Team owners can delete members
CREATE POLICY "delete team members by owner" ON public.team_members
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

-- Policy 5: Users can leave team (delete own membership)
CREATE POLICY "leave team" ON public.team_members
FOR DELETE USING (
  user_id = auth.uid()
  AND
  -- Cannot leave if they are the owner
  NOT EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = user_id
  )
);

-- Fix team_invitations policies
DROP POLICY IF EXISTS "send team invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "manage team invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "read own invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "manage own invitations" ON public.team_invitations;

-- Create simple team_invitations policies

-- Policy 1: Team owners can send invitations
CREATE POLICY "send team invitations" ON public.team_invitations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

-- Policy 2: Team owners can manage invitations
CREATE POLICY "manage team invitations" ON public.team_invitations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

-- Policy 3: Users can read their own invitations
CREATE POLICY "read own invitations" ON public.team_invitations
FOR SELECT USING (
  email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Policy 4: Users can accept/decline their own invitations
CREATE POLICY "manage own invitations" ON public.team_invitations
FOR UPDATE USING (
  email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Add comments
COMMENT ON POLICY "read own teams" ON public.teams IS 'Users can read teams they own';
COMMENT ON POLICY "read member teams" ON public.teams IS 'Users can read teams they are members of';
COMMENT ON POLICY "create teams" ON public.teams IS 'Users can create teams (they become owner)';
COMMENT ON POLICY "update own teams" ON public.teams IS 'Team owners can update their teams';
COMMENT ON POLICY "delete own teams" ON public.teams IS 'Team owners can delete their teams';

COMMENT ON POLICY "read team members" ON public.team_members IS 'Users can read team members if they are in the same team';
COMMENT ON POLICY "insert team members by owner" ON public.team_members IS 'Team owners can insert new members';
COMMENT ON POLICY "update team members by owner" ON public.team_members IS 'Team owners can update member roles';
COMMENT ON POLICY "delete team members by owner" ON public.team_members IS 'Team owners can delete members';
COMMENT ON POLICY "leave team" ON public.team_members IS 'Users can leave team (except owners)';
