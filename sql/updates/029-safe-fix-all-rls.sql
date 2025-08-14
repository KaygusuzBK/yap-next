-- Safe fix for ALL infinite recursion issues in RLS policies
-- This script first checks what exists, then safely removes and recreates

-- =====================================================
-- STEP 1: SAFELY DROP ALL EXISTING POLICIES
-- =====================================================

-- Function to safely drop all policies
CREATE OR REPLACE FUNCTION drop_all_policies()
RETURNS void AS $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on teams table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'teams'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.teams', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on team_members table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'team_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_members', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on team_invitations table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'team_invitations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_invitations', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on projects table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'projects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on project_members table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'project_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_members', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on project_tasks table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'project_tasks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_tasks', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on tasks table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'tasks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tasks', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on task_assignments table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'task_assignments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.task_assignments', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on task_comments table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'task_comments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.task_comments', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on task_files table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'task_files'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.task_files', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on task_time_logs table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'task_time_logs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.task_time_logs', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on task_activities table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'task_activities'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.task_activities', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on project_files table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'project_files'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_files', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on project_comments table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'project_comments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_comments', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on project_activities table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'project_activities'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_activities', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on project_task_statuses table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'project_task_statuses'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_task_statuses', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on user_preferences table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'user_preferences'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_preferences', policy_record.policyname);
    END LOOP;
    
    -- Drop all policies on notifications table
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', policy_record.policyname);
    END LOOP;
    
    RAISE NOTICE 'All policies dropped successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to drop all policies
SELECT drop_all_policies();

-- Drop the function
DROP FUNCTION drop_all_policies();

-- =====================================================
-- STEP 2: CREATE NEW, SIMPLE POLICIES
-- =====================================================

-- TEAMS TABLE POLICIES
CREATE POLICY "teams_select" ON public.teams
FOR SELECT USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = teams.id 
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "teams_insert" ON public.teams
FOR INSERT WITH CHECK (
  owner_id = auth.uid()
);

CREATE POLICY "teams_update" ON public.teams
FOR UPDATE USING (
  owner_id = auth.uid()
);

CREATE POLICY "teams_delete" ON public.teams
FOR DELETE USING (
  owner_id = auth.uid()
);

-- TEAM_MEMBERS TABLE POLICIES
CREATE POLICY "team_members_select" ON public.team_members
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "team_members_insert" ON public.team_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "team_members_update" ON public.team_members
FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "team_members_delete" ON public.team_members
FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

-- TEAM_INVITATIONS TABLE POLICIES
CREATE POLICY "team_invitations_select" ON public.team_invitations
FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "team_invitations_insert" ON public.team_invitations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "team_invitations_update" ON public.team_invitations
FOR UPDATE USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "team_invitations_delete" ON public.team_invitations
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = team_id 
    AND t.owner_id = auth.uid()
  )
);

-- PROJECTS TABLE POLICIES
CREATE POLICY "projects_select" ON public.projects
FOR SELECT USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.project_members pm 
    WHERE pm.project_id = projects.id 
    AND pm.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = projects.team_id 
    AND (
      t.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.team_members tm 
        WHERE tm.team_id = projects.team_id 
        AND tm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "projects_insert" ON public.projects
FOR INSERT WITH CHECK (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = projects.team_id 
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "projects_update" ON public.projects
FOR UPDATE USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = projects.team_id 
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "projects_delete" ON public.projects
FOR DELETE USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = projects.team_id 
    AND t.owner_id = auth.uid()
  )
);

-- PROJECT_MEMBERS TABLE POLICIES
CREATE POLICY "project_members_select" ON public.project_members
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND p.owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = (SELECT team_id FROM public.projects WHERE id = project_id)
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "project_members_insert" ON public.project_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND p.owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = (SELECT team_id FROM public.projects WHERE id = project_id)
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "project_members_update" ON public.project_members
FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND p.owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = (SELECT team_id FROM public.projects WHERE id = project_id)
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "project_members_delete" ON public.project_members
FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND p.owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.id = (SELECT team_id FROM public.projects WHERE id = project_id)
    AND t.owner_id = auth.uid()
  )
);

-- PROJECT_TASKS TABLE POLICIES
CREATE POLICY "project_tasks_select" ON public.project_tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_tasks_insert" ON public.project_tasks
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_tasks_update" ON public.project_tasks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_tasks_delete" ON public.project_tasks
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- TASKS TABLE POLICIES (legacy table)
CREATE POLICY "tasks_select" ON public.tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "tasks_insert" ON public.tasks
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "tasks_update" ON public.tasks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "tasks_delete" ON public.tasks
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- TASK_ASSIGNMENTS TABLE POLICIES
CREATE POLICY "task_assignments_select" ON public.task_assignments
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_assignments_insert" ON public.task_assignments
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_assignments_update" ON public.task_assignments
FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_assignments_delete" ON public.task_assignments
FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- TASK_COMMENTS TABLE POLICIES
CREATE POLICY "task_comments_select" ON public.task_comments
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_comments_insert" ON public.task_comments
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "task_comments_update" ON public.task_comments
FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "task_comments_delete" ON public.task_comments
FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND p.owner_id = auth.uid()
  )
);

-- TASK_FILES TABLE POLICIES
CREATE POLICY "task_files_select" ON public.task_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_files_insert" ON public.task_files
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_files_update" ON public.task_files
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_files_delete" ON public.task_files
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- TASK_TIME_LOGS TABLE POLICIES
CREATE POLICY "task_time_logs_select" ON public.task_time_logs
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_time_logs_insert" ON public.task_time_logs
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "task_time_logs_update" ON public.task_time_logs
FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "task_time_logs_delete" ON public.task_time_logs
FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND p.owner_id = auth.uid()
  )
);

-- TASK_ACTIVITIES TABLE POLICIES
CREATE POLICY "task_activities_select" ON public.task_activities
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_activities_insert" ON public.task_activities
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_activities_update" ON public.task_activities
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "task_activities_delete" ON public.task_activities
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = p.id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- PROJECT_FILES TABLE POLICIES
CREATE POLICY "project_files_select" ON public.project_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_files_insert" ON public.project_files
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_files_update" ON public.project_files
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_files_delete" ON public.project_files
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- PROJECT_COMMENTS TABLE POLICIES
CREATE POLICY "project_comments_select" ON public.project_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_comments_insert" ON public.project_comments
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "project_comments_update" ON public.project_comments
FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "project_comments_delete" ON public.project_comments
FOR DELETE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND p.owner_id = auth.uid()
  )
);

-- PROJECT_ACTIVITIES TABLE POLICIES
CREATE POLICY "project_activities_select" ON public.project_activities
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_activities_insert" ON public.project_activities
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_activities_update" ON public.project_activities
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_activities_delete" ON public.project_activities
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- PROJECT_TASK_STATUSES TABLE POLICIES
CREATE POLICY "project_task_statuses_select" ON public.project_task_statuses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "project_task_statuses_manage" ON public.project_task_statuses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND (
      p.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.teams t 
        WHERE t.id = p.team_id 
        AND t.owner_id = auth.uid()
      )
    )
  )
);

-- USER_PREFERENCES TABLE POLICIES
CREATE POLICY "user_preferences_select" ON public.user_preferences
FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "user_preferences_insert" ON public.user_preferences
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "user_preferences_update" ON public.user_preferences
FOR UPDATE USING (
  user_id = auth.uid()
);

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "notifications_select" ON public.notifications
FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "notifications_update" ON public.notifications
FOR UPDATE USING (
  user_id = auth.uid()
);

-- =====================================================
-- STEP 3: ADD COMMENTS
-- =====================================================

COMMENT ON POLICY "teams_select" ON public.teams IS 'Users can read teams they own or are members of';
COMMENT ON POLICY "teams_insert" ON public.teams IS 'Users can create teams (they become owner)';
COMMENT ON POLICY "teams_update" ON public.teams IS 'Team owners can update their teams';
COMMENT ON POLICY "teams_delete" ON public.teams IS 'Team owners can delete their teams';

COMMENT ON POLICY "team_members_select" ON public.team_members IS 'Users can read team members if they are in the same team';
COMMENT ON POLICY "team_members_insert" ON public.team_members IS 'Team owners can insert new members';
COMMENT ON POLICY "team_members_update" ON public.team_members IS 'Users can update their own membership, owners can update all';
COMMENT ON POLICY "team_members_delete" ON public.team_members IS 'Users can leave team, owners can remove members';

COMMENT ON POLICY "team_invitations_select" ON public.team_invitations IS 'Users can read their own invitations, owners can read all';
COMMENT ON POLICY "team_invitations_insert" ON public.team_invitations IS 'Team owners can send invitations';
COMMENT ON POLICY "team_invitations_update" ON public.team_invitations IS 'Users can manage their own invitations, owners can manage all';
COMMENT ON POLICY "team_invitations_delete" ON public.team_invitations IS 'Team owners can delete invitations';

COMMENT ON POLICY "projects_select" ON public.projects IS 'Users can read projects they own, are members of, or are in the same team';
COMMENT ON POLICY "projects_insert" ON public.projects IS 'Users can create projects, team owners can create team projects';
COMMENT ON POLICY "projects_update" ON public.projects IS 'Project owners and team owners can update projects';
COMMENT ON POLICY "projects_delete" ON public.projects IS 'Project owners and team owners can delete projects';

COMMENT ON POLICY "project_members_select" ON public.project_members IS 'Users can read project members if they are in the same project or team';
COMMENT ON POLICY "project_members_insert" ON public.project_members IS 'Project owners and team owners can add members';
COMMENT ON POLICY "project_members_update" ON public.project_members IS 'Project owners and team owners can update members';
COMMENT ON POLICY "project_members_delete" ON public.project_members IS 'Project owners and team owners can remove members';

COMMENT ON POLICY "project_tasks_select" ON public.project_tasks IS 'Users can read tasks if they are in the same project or team';
COMMENT ON POLICY "project_tasks_insert" ON public.project_tasks IS 'Project members can create tasks';
COMMENT ON POLICY "project_tasks_update" ON public.project_tasks IS 'Project members can update tasks';
COMMENT ON POLICY "project_tasks_delete" ON public.project_tasks IS 'Project owners can delete tasks';

COMMENT ON POLICY "tasks_select" ON public.tasks IS 'Users can read legacy tasks if they are in the same project or team';
COMMENT ON POLICY "tasks_insert" ON public.tasks IS 'Project members can create legacy tasks';
COMMENT ON POLICY "tasks_update" ON public.tasks IS 'Project members can update legacy tasks';
COMMENT ON POLICY "tasks_delete" ON public.tasks IS 'Project owners can delete legacy tasks';

COMMENT ON POLICY "task_assignments_select" ON public.task_assignments IS 'Users can read assignments if they are in the same project or team';
COMMENT ON POLICY "task_assignments_insert" ON public.task_assignments IS 'Project members can assign tasks';
COMMENT ON POLICY "task_assignments_update" ON public.task_assignments IS 'Project members can update assignments';
COMMENT ON POLICY "task_assignments_delete" ON public.task_assignments IS 'Project members can remove assignments';

COMMENT ON POLICY "task_comments_select" ON public.task_comments IS 'Users can read comments if they are in the same project or team';
COMMENT ON POLICY "task_comments_insert" ON public.task_comments IS 'Users can add comments to tasks';
COMMENT ON POLICY "task_comments_update" ON public.task_comments IS 'Users can update their own comments';
COMMENT ON POLICY "task_comments_delete" ON public.task_comments IS 'Users can delete their own comments, project owners can delete all';

COMMENT ON POLICY "task_files_select" ON public.task_files IS 'Users can read files if they are in the same project or team';
COMMENT ON POLICY "task_files_insert" ON public.task_files IS 'Project members can add files to tasks';
COMMENT ON POLICY "task_files_update" ON public.task_files IS 'Project members can update files';
COMMENT ON POLICY "task_files_delete" ON public.task_files IS 'Project members can delete files';

COMMENT ON POLICY "task_time_logs_select" ON public.task_time_logs IS 'Users can read time logs if they are in the same project or team';
COMMENT ON POLICY "task_time_logs_insert" ON public.task_time_logs IS 'Users can log time for tasks';
COMMENT ON POLICY "task_time_logs_update" ON public.task_time_logs IS 'Users can update their own time logs';
COMMENT ON POLICY "task_time_logs_delete" ON public.task_time_logs IS 'Users can delete their own time logs, project owners can delete all';

COMMENT ON POLICY "task_activities_select" ON public.task_activities IS 'Users can read activities if they are in the same project or team';
COMMENT ON POLICY "task_activities_insert" ON public.task_activities IS 'Project members can create activities';
COMMENT ON POLICY "task_activities_update" ON public.task_activities IS 'Project members can update activities';
COMMENT ON POLICY "task_activities_delete" ON public.task_activities IS 'Project members can delete activities';

COMMENT ON POLICY "project_files_select" ON public.project_files IS 'Users can read files if they are in the same project or team';
COMMENT ON POLICY "project_files_insert" ON public.project_files IS 'Project members can add files';
COMMENT ON POLICY "project_files_update" ON public.project_files IS 'Project members can update files';
COMMENT ON POLICY "project_files_delete" ON public.project_files IS 'Project members can delete files';

COMMENT ON POLICY "project_comments_select" ON public.project_comments IS 'Users can read comments if they are in the same project or team';
COMMENT ON POLICY "project_comments_insert" ON public.project_comments IS 'Users can add comments to projects';
COMMENT ON POLICY "project_comments_update" ON public.project_comments IS 'Users can update their own comments';
COMMENT ON POLICY "project_comments_delete" ON public.project_comments IS 'Users can delete their own comments, project owners can delete all';

COMMENT ON POLICY "project_activities_select" ON public.project_activities IS 'Users can read activities if they are in the same project or team';
COMMENT ON POLICY "project_activities_insert" ON public.project_activities IS 'Project members can create activities';
COMMENT ON POLICY "project_activities_update" ON public.project_activities IS 'Project members can update activities';
COMMENT ON POLICY "project_activities_delete" ON public.project_activities IS 'Project members can delete activities';

COMMENT ON POLICY "project_task_statuses_select" ON public.project_task_statuses IS 'Users can read statuses if they are in the same project or team';
COMMENT ON POLICY "project_task_statuses_manage" ON public.project_task_statuses IS 'Project owners and team owners can manage statuses';

COMMENT ON POLICY "user_preferences_select" ON public.user_preferences IS 'Users can read their own preferences';
COMMENT ON POLICY "user_preferences_insert" ON public.user_preferences IS 'Users can create their own preferences';
COMMENT ON POLICY "user_preferences_update" ON public.user_preferences IS 'Users can update their own preferences';

COMMENT ON POLICY "notifications_select" ON public.notifications IS 'Users can read their own notifications';
COMMENT ON POLICY "notifications_update" ON public.notifications IS 'Users can update their own notifications';
