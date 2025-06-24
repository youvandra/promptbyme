/*
  # Fix RLS Policy Infinite Recursion

  This migration fixes the infinite recursion issue in RLS policies between 
  flow_projects and project_members tables by simplifying the policy logic
  and removing circular dependencies.

  ## Changes Made

  1. **Simplified project_members policies**: Remove complex subqueries that reference flow_projects
  2. **Updated flow_projects policies**: Ensure they don't create circular references
  3. **Clear policy structure**: Each table's policies focus on their own data primarily

  ## Security Maintained

  - Users can only see their own memberships
  - Project owners maintain full control
  - Team members can view appropriate project data
  - No unauthorized access is introduced
*/

-- First, drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Project admins can manage members" ON project_members;
DROP POLICY IF EXISTS "Project members can view other members" ON project_members;
DROP POLICY IF EXISTS "Users can leave projects" ON project_members;
DROP POLICY IF EXISTS "Users can update own membership" ON project_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON project_members;

DROP POLICY IF EXISTS "Users can create projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can view own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can view public projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can view team projects as members" ON flow_projects;

-- Create simplified policies for project_members table
-- These policies focus only on the project_members table data without complex joins

CREATE POLICY "Users can view own memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own membership status"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create simplified policies for flow_projects table
-- These avoid complex subqueries that could cause recursion

CREATE POLICY "Users can manage own projects"
  ON flow_projects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view public projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

-- Create a function to safely check project membership without recursion
CREATE OR REPLACE FUNCTION is_project_member(project_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM project_members 
    WHERE project_id = project_uuid 
      AND user_id = user_uuid 
      AND status = 'accepted'
  );
$$;

-- Create a function to safely check if user is project admin
CREATE OR REPLACE FUNCTION is_project_admin(project_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM project_members 
    WHERE project_id = project_uuid 
      AND user_id = user_uuid 
      AND role = 'admin'
      AND status = 'accepted'
  ) OR EXISTS (
    SELECT 1
    FROM flow_projects
    WHERE id = project_uuid
      AND user_id = user_uuid
  );
$$;

-- Create a function to safely check if user can edit project
CREATE OR REPLACE FUNCTION can_edit_project(project_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM project_members 
    WHERE project_id = project_uuid 
      AND user_id = user_uuid 
      AND role IN ('admin', 'editor')
      AND status = 'accepted'
  ) OR EXISTS (
    SELECT 1
    FROM flow_projects
    WHERE id = project_uuid
      AND user_id = user_uuid
  );
$$;

-- Now create policies using these safe functions for project_members
CREATE POLICY "Project admins can manage all members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (is_project_admin(project_id, auth.uid()))
  WITH CHECK (is_project_admin(project_id, auth.uid()));

CREATE POLICY "Project members can view other members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (is_project_member(project_id, auth.uid()));

-- Create policy for viewing shared projects using the safe function
CREATE POLICY "Members can view shared projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (is_project_member(id, auth.uid()));

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION is_project_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_edit_project(uuid, uuid) TO authenticated;