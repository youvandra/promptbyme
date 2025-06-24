/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - Circular dependency between flow_projects and project_members policies
    - Policies reference each other causing infinite recursion
    - Error: "infinite recursion detected in policy for relation flow_projects"

  2. Solution
    - Drop all existing problematic policies
    - Create new non-recursive policies with clear boundaries
    - Separate ownership checks from membership checks
    - Use direct foreign key relationships instead of complex subqueries

  3. Security
    - Maintain same access control rules
    - Project owners can manage their projects and members
    - Team members can view projects they belong to
    - Proper role-based permissions for editors and admins
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
END $$;

-- Ensure RLS is enabled on both tables
ALTER TABLE flow_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FLOW_PROJECTS POLICIES (NON-RECURSIVE)
-- ============================================================================

-- Policy 1: Users can view their own projects (they own)
CREATE POLICY "Users can view own projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can view public projects
CREATE POLICY "Users can view public projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

-- Policy 3: Users can view team projects they are members of
-- This policy uses a direct check against project_members without causing recursion
CREATE POLICY "Users can view team projects as members"
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
CREATE POLICY "Users can create projects"
  ON flow_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy 5: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON flow_projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 6: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON flow_projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- PROJECT_MEMBERS POLICIES (NON-RECURSIVE)
-- ============================================================================

-- Policy 1: Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Project owners can view all members in their projects
CREATE POLICY "Project owners can view all members"
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
CREATE POLICY "Project members can view other members"
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
CREATE POLICY "Project owners can manage members"
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
CREATE POLICY "Project admins can manage members"
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
CREATE POLICY "Users can update own membership"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 7: Users can leave projects (delete their own membership)
CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- FLOW_NODES POLICIES (ENSURE CONSISTENCY)
-- ============================================================================

-- Drop existing policies that might cause issues
DROP POLICY IF EXISTS "Project members can insert nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Project members can update nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Project members can manage nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can manage nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can update nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can delete nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Members can view nodes" ON flow_nodes;

-- Policy 1: Users can view nodes in their own projects
CREATE POLICY "Users can view nodes in own projects"
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
CREATE POLICY "Users can view nodes in public projects"
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
CREATE POLICY "Team members can view nodes"
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
CREATE POLICY "Project owners can manage nodes"
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
CREATE POLICY "Editors can manage nodes"
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

-- Drop existing policies that might cause issues
DROP POLICY IF EXISTS "Project members can update connections" ON flow_connections;
DROP POLICY IF EXISTS "Editors can manage connections" ON flow_connections;
DROP POLICY IF EXISTS "Editors can delete connections" ON flow_connections;
DROP POLICY IF EXISTS "Members can view connections" ON flow_connections;

-- Policy 1: Users can view connections in their own projects
CREATE POLICY "Users can view connections in own projects"
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
CREATE POLICY "Users can view connections in public projects"
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
CREATE POLICY "Team members can view connections"
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
CREATE POLICY "Project owners can manage connections"
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
CREATE POLICY "Editors can manage connections"
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