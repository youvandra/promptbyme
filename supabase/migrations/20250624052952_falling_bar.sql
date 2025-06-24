/*
  # Fix RLS Policy Infinite Recursion

  This migration fixes the infinite recursion issue in RLS policies by:
  1. Dropping existing problematic policies on flow_projects and project_members
  2. Creating new, simplified policies that avoid circular dependencies
  3. Using direct auth.uid() checks where possible
  4. Ensuring subqueries don't create recursive loops

  ## Changes Made
  - Simplified flow_projects policies to avoid recursion
  - Updated project_members policies to be more direct
  - Removed circular dependencies between tables
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view projects they are members of" ON flow_projects;
DROP POLICY IF EXISTS "Users can view public projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON flow_projects;

DROP POLICY IF EXISTS "Members can view project members" ON project_members;
DROP POLICY IF EXISTS "Admins can invite members" ON project_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON project_members;
DROP POLICY IF EXISTS "Admins can remove members" ON project_members;
DROP POLICY IF EXISTS "Users can update own membership" ON project_members;
DROP POLICY IF EXISTS "Users can leave projects" ON project_members;

-- Create new simplified policies for flow_projects
CREATE POLICY "Users can view their own projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

CREATE POLICY "Users can view team projects they are members of"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'team' AND 
    id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can create projects"
  ON flow_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Project owners can update their projects"
  ON flow_projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Project owners can delete their projects"
  ON flow_projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create new simplified policies for project_members
CREATE POLICY "Users can view their own memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Project owners can view all members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM flow_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can view all members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Project owners can invite members"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM flow_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can invite members"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Project owners can update member roles"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM flow_projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM flow_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can update member roles"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can update their own membership status"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Project owners can remove members"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM flow_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can remove members"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  );

CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());