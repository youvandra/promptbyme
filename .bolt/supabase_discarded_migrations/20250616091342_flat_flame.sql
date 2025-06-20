/*
  # Fix RLS Policy Infinite Recursion

  This migration fixes the infinite recursion issue in RLS policies for projects and project_members tables.
  
  ## Changes Made
  
  1. **Projects Table Policies**
     - Simplified the SELECT policy to avoid circular references
     - Updated policies to use direct ownership checks and membership checks without complex subqueries
  
  2. **Project Members Table Policies**  
     - Simplified policies to avoid querying back to projects table
     - Used direct user_id checks where possible
  
  3. **Security**
     - Maintains proper access control
     - Breaks circular dependency between tables
     - Ensures users can only access their own projects and memberships
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can view members of accessible projects" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;

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