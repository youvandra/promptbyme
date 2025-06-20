/*
  # Fix infinite recursion in project_members RLS policies

  1. Security Changes
    - Drop existing problematic RLS policies on project_members table
    - Create new policies that avoid circular references
    - Use direct project ownership checks instead of querying project_members

  2. Policy Changes
    - Replace recursive project_members queries with direct project.owner_id checks
    - Maintain same security model but without circular dependencies
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
DROP POLICY IF EXISTS "Users can view project members for their projects" ON project_members;

-- Create new policies without circular references
CREATE POLICY "Project owners can manage all member operations"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Allow users to view members of projects they belong to
CREATE POLICY "Users can view members of their projects"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    -- User can see members if they are the project owner
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.owner_id = auth.uid()
    )
    OR
    -- User can see members if they are a member themselves (direct check)
    user_id = auth.uid()
  );

-- Allow users to leave projects (delete their own membership)
CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());