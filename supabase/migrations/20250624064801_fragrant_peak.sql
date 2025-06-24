/*
  # Fix RLS Policy Infinite Recursion

  1. Changes
     - Drop existing policies that cause recursion
     - Drop existing functions before recreating them
     - Create helper functions for membership checks
     - Create simplified policies that avoid recursion
  
  2. Security
     - Maintain same access control logic
     - Use SECURITY DEFINER functions to break recursion cycles
     - Grant proper permissions to authenticated users
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

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS is_project_member(uuid, uuid);
DROP FUNCTION IF EXISTS is_project_admin(uuid, uuid);
DROP FUNCTION IF EXISTS can_edit_project(uuid, uuid);

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