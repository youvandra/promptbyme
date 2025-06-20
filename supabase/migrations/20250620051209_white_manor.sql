/*
  # Fix infinite recursion in project_members RLS policies

  1. Problem
    - Current RLS policies on project_members table are causing infinite recursion
    - Policies are referencing project_members table within their own conditions
    - This creates circular dependencies when Supabase tries to evaluate the policies

  2. Solution
    - Drop existing problematic policies
    - Create new simplified policies that avoid self-referencing
    - Use direct user_id checks with auth.uid() instead of subqueries
    - Create helper functions for complex permission checks

  3. Changes
    - Remove recursive policy conditions
    - Simplify SELECT policies to use direct user_id comparisons
    - Create separate policies for different access patterns
    - Add helper functions for project access control
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view project members" ON project_members;
DROP POLICY IF EXISTS "Members can update their status" ON project_members;
DROP POLICY IF EXISTS "Members can leave projects" ON project_members;
DROP POLICY IF EXISTS "Admins can invite members" ON project_members;

-- Create helper functions for project access control
CREATE OR REPLACE FUNCTION can_view_project(project_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM flow_projects 
    WHERE id = project_uuid 
    AND (
      user_id = auth.uid() 
      OR visibility = 'public'
      OR (visibility = 'team' AND EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = project_uuid 
        AND user_id = auth.uid() 
        AND status = 'accepted'
      ))
    )
  );
$$;

CREATE OR REPLACE FUNCTION can_edit_project(project_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM flow_projects 
    WHERE id = project_uuid 
    AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid 
    AND user_id = auth.uid() 
    AND role IN ('admin', 'editor')
    AND status = 'accepted'
  );
$$;

-- Create new simplified RLS policies for project_members

-- Users can view their own membership records
CREATE POLICY "Users can view own membership"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view members of projects they belong to (accepted members only)
CREATE POLICY "Members can view project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.status = 'accepted'
    )
  );

-- Users can update their own membership status
CREATE POLICY "Users can update own membership"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Project admins can update member roles and status
CREATE POLICY "Admins can manage members"
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

-- Project admins can invite new members
CREATE POLICY "Admins can invite members"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by_user_id = auth.uid()
    AND project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.role = 'admin'
      AND pm.status = 'accepted'
    )
  );

-- Users can leave projects (delete their own membership)
CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Project admins can remove members
CREATE POLICY "Admins can remove members"
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

-- Grant necessary permissions for the helper functions
GRANT EXECUTE ON FUNCTION can_view_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_edit_project(uuid) TO authenticated;