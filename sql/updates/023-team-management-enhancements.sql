-- Team Management Enhancements
-- Add description and avatar_url to teams table
-- Improve RLS policies for better role-based access control

-- Add description column to teams table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN description text;
  END IF;
END $$;

-- Add avatar_url column to teams table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Add avatar_url column to team_members table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'team_members' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.team_members ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Update team_members RLS policies for better role-based access
-- Team members can read other members in the same team
DROP POLICY IF EXISTS "read team members" ON public.team_members;
CREATE POLICY "read team members"
ON public.team_members FOR SELECT
USING (
  team_members.user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
  )
);

-- Team owners and admins can manage team members
DROP POLICY IF EXISTS "manage team members" ON public.team_members;
CREATE POLICY "manage team members"
ON public.team_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id
    AND (
      t.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
      )
    )
  )
);

-- Team owners can transfer ownership
DROP POLICY IF EXISTS "transfer team ownership" ON public.teams;
CREATE POLICY "transfer team ownership"
ON public.teams FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = teams.id
    AND tm.user_id = auth.uid()
    AND tm.role = 'owner'
  )
);

-- Team members can read team information
DROP POLICY IF EXISTS "read team info" ON public.teams;
CREATE POLICY "read team info"
ON public.teams FOR SELECT
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = teams.id
    AND tm.user_id = auth.uid()
  )
);

-- Team owners and admins can update team information
DROP POLICY IF EXISTS "update team info" ON public.teams;
CREATE POLICY "update team info"
ON public.teams FOR UPDATE
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = teams.id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('owner', 'admin')
  )
);

-- Team owners and admins can send invitations
DROP POLICY IF EXISTS "send team invitations" ON public.team_invitations;
CREATE POLICY "send team invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
    AND (
      t.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
      )
    )
  )
);

-- Team owners and admins can manage invitations
DROP POLICY IF EXISTS "manage team invitations" ON public.team_invitations;
CREATE POLICY "manage team invitations"
ON public.team_invitations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_id
    AND (
      t.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
      )
    )
  )
);

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

-- Create function to get team statistics
CREATE OR REPLACE FUNCTION public.get_team_stats(p_team_id uuid)
RETURNS TABLE (
  member_count bigint,
  project_count bigint,
  active_task_count bigint,
  completed_task_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.team_members WHERE team_id = p_team_id) as member_count,
    (SELECT COUNT(*) FROM public.projects WHERE team_id = p_team_id) as project_count,
    (SELECT COUNT(*) FROM public.project_tasks pt 
     JOIN public.projects p ON pt.project_id = p.id 
     WHERE p.team_id = p_team_id AND pt.status != 'completed') as active_task_count,
    (SELECT COUNT(*) FROM public.project_tasks pt 
     JOIN public.projects p ON pt.project_id = p.id 
     WHERE p.team_id = p_team_id AND pt.status = 'completed') as completed_task_count;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_team_stats(uuid) TO authenticated;

-- Create function to check if user is team owner or admin
CREATE OR REPLACE FUNCTION public.is_team_admin(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = p_team_id
    AND (
      t.owner_id = p_user_id OR
      EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = p_team_id
        AND tm.user_id = p_user_id
        AND tm.role IN ('owner', 'admin')
      )
    )
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_team_admin(uuid, uuid) TO authenticated;

-- Create function to check if user is team owner
CREATE OR REPLACE FUNCTION public.is_team_owner(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = p_team_id AND t.owner_id = p_user_id
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_team_owner(uuid, uuid) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON public.team_members(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_email ON public.team_invitations(team_id, email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);

-- Add comments for documentation
COMMENT ON TABLE public.teams IS 'Takım bilgileri ve ayarları';
COMMENT ON COLUMN public.teams.description IS 'Takım açıklaması';
COMMENT ON COLUMN public.teams.avatar_url IS 'Takım avatar resmi URL''i';
COMMENT ON COLUMN public.team_members.role IS 'Üye rolü: owner, admin, member';
COMMENT ON COLUMN public.team_members.avatar_url IS 'Üye avatar resmi URL''i';
COMMENT ON COLUMN public.team_invitations.role IS 'Davet edilen rol: owner, admin, member';
COMMENT ON COLUMN public.team_invitations.status IS 'Davet durumu: pending, accepted, expired';

-- Update existing team_members to have owner role for team owners
UPDATE public.team_members 
SET role = 'owner' 
WHERE (team_id, user_id) IN (
  SELECT id, owner_id FROM public.teams
);

-- Ensure all team owners are also team members
INSERT INTO public.team_members (team_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_members tm
  WHERE tm.team_id = t.id AND tm.user_id = t.owner_id
);
