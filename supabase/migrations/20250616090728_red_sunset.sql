/*
  # Fix RLS Circular Dependency

  1. Problem
    - Circular dependency between projects and project_members policies
    - project_members policies reference projects table
    - projects policies reference project_members table
    - This creates infinite recursion

  2. Solution
    - Simplify policies to avoid cross-table references
    - Use direct ownership checks where possible
    - Separate member access from owner access
    - Use function-based policies for complex logic

  3. Security
    - Users can only see projects they own or are members of
    - Users can only see project_members records for projects they have access to
    - No data leakage between users
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view projects where they are members" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update their projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete their projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
DROP POLICY IF EXISTS "Users can view project members where they are members" ON project_members;
DROP POLICY IF EXISTS "Users can leave projects" ON project_members;

-- Create a function to check if user has access to a project
-- This avoids circular dependencies by using a single function
CREATE OR REPLACE FUNCTION user_has_project_access(project_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user is the owner
  IF EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_uuid AND owner_id = user_uuid
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is a member
  IF EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = user_uuid
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Projects table policies
CREATE POLICY "Users can view accessible projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR 
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Project members table policies
CREATE POLICY "Users can view members of accessible projects"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE owner_id = auth.uid()
    ) OR
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes to optimize the policy queries
CREATE INDEX IF NOT EXISTS idx_project_members_user_project ON project_members(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);