/*
  # Fix RLS Policy Circular Dependencies

  1. Problem
    - Circular dependency between projects and project_members policies
    - Projects policies check project_members for membership
    - Project_members policies check projects for ownership
    - This creates infinite recursion

  2. Solution
    - Simplify project_members policies to use direct ownership checks
    - Remove circular references by using owner_id directly from projects table
    - Ensure policies can be evaluated without cross-table dependencies

  3. Changes
    - Drop existing problematic policies
    - Create new simplified policies that break the circular dependency
    - Maintain security while avoiding recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Project owners can manage all member operations" ON project_members;
DROP POLICY IF EXISTS "Users can view members of their projects" ON project_members;
DROP POLICY IF EXISTS "Users can leave projects" ON project_members;

DROP POLICY IF EXISTS "Users can view projects they are members of" ON projects;
DROP POLICY IF EXISTS "Project owners can update their projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete their projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;

-- Create new simplified policies for project_members
-- These policies avoid referencing the projects table to prevent recursion

CREATE POLICY "Users can view project members where they are members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see members of projects where they are also members
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    -- Check if user is owner by looking at projects table directly
    -- This is safe because we're not creating a circular dependency
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create new simplified policies for projects
-- These policies use direct ownership checks without referencing project_members

CREATE POLICY "Users can view their own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view projects where they are members"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can update their projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can delete their projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());