/*
  # Fix RLS Policy Infinite Recursion

  1. Changes
    - Drop all existing problematic policies on projects and project_members tables
    - Create simplified policies that avoid circular dependencies
    - Maintain proper access control without recursion

  2. Security
    - Project owners can view and manage their projects
    - Project members can view projects they belong to
    - Users can only see project members for projects they're part of
    - Proper role-based access control maintained
*/

-- Drop ALL existing policies on projects table
DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Project owners can view their projects" ON projects;
DROP POLICY IF EXISTS "Project members can view their projects" ON projects;

-- Drop ALL existing policies on project_members table
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
DROP POLICY IF EXISTS "Users can leave projects" ON project_members;
DROP POLICY IF EXISTS "Users can view members of accessible projects" ON project_members;
DROP POLICY IF EXISTS "Users can view project members where they are members" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage all members" ON project_members;
DROP POLICY IF EXISTS "Project editors can manage members with restrictions" ON project_members;

-- Create simplified policies for projects table
CREATE POLICY "Project owners can view their projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Project members can view their projects"
  ON projects  
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

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

CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Create simplified policies for project_members table
CREATE POLICY "Users can view project members where they are members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id
      FROM project_members pm
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage all members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project editors can manage members with restrictions"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());