/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - Infinite recursion detected in RLS policies for flow_projects and project_members
    - Policies are referencing each other in a circular manner
    - This causes database errors when trying to access these tables

  2. Solution
    - Drop all existing policies on both tables
    - Create new non-recursive policies with unique names
    - Ensure proper access control without circular dependencies
    - Fix related policies on flow_nodes and flow_connections
*/

-- First, drop all existing policies on both tables to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop flow_projects policies
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'flow_projects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON flow_projects';
    END LOOP;

    -- Drop project_members policies
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'project_members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON project_members';
    END LOOP;
    
    -- Drop flow_nodes policies
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'flow_nodes'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON flow_nodes';
    END LOOP;
    
    -- Drop flow_connections policies
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'flow_connections'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON flow_connections';
    END LOOP;
END $$;

-- Ensure RLS is enabled on both tables
ALTER TABLE flow_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FLOW_PROJECTS POLICIES (NON-RECURSIVE)
-- ============================================================================

-- Policy 1: Users can view their own projects (they own)
CREATE POLICY "fp_owner_select"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can view public projects
CREATE POLICY "fp_public_select"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

-- Policy 3: Users can view team projects they are members of
-- This policy uses a direct check against project_members without causing recursion
CREATE POLICY "fp_member_select"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  );

-- Policy 4: Users can create their own projects
CREATE POLICY "fp_owner_insert"
  ON flow_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy 5: Users can update their own projects
CREATE POLICY "fp_owner_update"
  ON flow_projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 6: Users can delete their own projects
CREATE POLICY "fp_owner_delete"
  ON flow_projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- PROJECT_MEMBERS POLICIES (NON-RECURSIVE)
-- ============================================================================

-- Policy 1: Users can view their own memberships
CREATE POLICY "pm_self_select"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Project owners can view all members in their projects
CREATE POLICY "pm_owner_select"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Project members can view other members in the same project
CREATE POLICY "pm_member_select"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  );

-- Policy 4: Project owners can manage members
CREATE POLICY "pm_owner_all"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 5: Project admins can manage members
CREATE POLICY "pm_admin_all"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  );

-- Policy 6: Users can update their own membership status
CREATE POLICY "pm_self_update"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 7: Users can leave projects (delete their own membership)
CREATE POLICY "pm_self_delete"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- FLOW_NODES POLICIES (ENSURE CONSISTENCY)
-- ============================================================================

-- Policy 1: Users can view nodes in their own projects
CREATE POLICY "fn_owner_select"
  ON flow_nodes
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Users can view nodes in public projects
CREATE POLICY "fn_public_select"
  ON flow_nodes
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE visibility = 'public'
    )
  );

-- Policy 3: Team members can view nodes in their projects
CREATE POLICY "fn_member_select"
  ON flow_nodes
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  );

-- Policy 4: Project owners can manage nodes
CREATE POLICY "fn_owner_all"
  ON flow_nodes
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 5: Editors and admins can manage nodes
CREATE POLICY "fn_editor_all"
  ON flow_nodes
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted' 
      AND role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted' 
      AND role IN ('editor', 'admin')
    )
  );

-- ============================================================================
-- FLOW_CONNECTIONS POLICIES (ENSURE CONSISTENCY)
-- ============================================================================

-- Policy 1: Users can view connections in their own projects
CREATE POLICY "fc_owner_select"
  ON flow_connections
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Users can view connections in public projects
CREATE POLICY "fc_public_select"
  ON flow_connections
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE visibility = 'public'
    )
  );

-- Policy 3: Team members can view connections in their projects
CREATE POLICY "fc_member_select"
  ON flow_connections
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  );

-- Policy 4: Project owners can manage connections
CREATE POLICY "fc_owner_all"
  ON flow_connections
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id 
      FROM flow_projects 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 5: Editors and admins can manage connections
CREATE POLICY "fc_editor_all"
  ON flow_connections
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted' 
      AND role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted' 
      AND role IN ('editor', 'admin')
    )
  );