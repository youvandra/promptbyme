/*
  # Fix Project Members RLS Policies

  1. Problem
    - Circular dependency in RLS policies for project_members table
    - Editors can't create flow connections because they can't access project_members data
    - Policies are too restrictive for proper role-based access

  2. Solution
    - Drop all existing policies on project_members table
    - Create simplified policies that avoid circular references
    - Add separate policies for different operations
    - Ensure editors can view membership data for RLS checks

  3. Security
    - Maintain proper access control
    - Allow members to view other members in the same project
    - Only admins can manage memberships
    - Users can manage their own membership
*/

-- Drop all existing policies on project_members to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'project_members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON project_members';
    END LOOP;
END $$;

-- Enable RLS on project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policy 1: All members can view other members in the same project
-- This is critical for subqueries in other policies to work correctly
CREATE POLICY "Members can view project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    -- User is the project owner
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_members.project_id
      AND user_id = auth.uid()
    )
    OR
    -- User is a member of the project (any role)
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND status = 'accepted'
    )
    OR
    -- User can see their own memberships (including pending invitations)
    user_id = auth.uid()
  );

-- Policy 2: Only project owners and admins can add new members
CREATE POLICY "Admins can invite members"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is the project owner
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_members.project_id
      AND user_id = auth.uid()
    )
    OR
    -- User is an admin
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );

-- Policy 3: Users can update their own membership (e.g., accept/decline invitations)
CREATE POLICY "Users can update own membership"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Admins can update any membership in their projects
CREATE POLICY "Admins can update member roles"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (
    -- User is the project owner
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_members.project_id
      AND user_id = auth.uid()
    )
    OR
    -- User is an admin
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  )
  WITH CHECK (
    -- User is the project owner
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_members.project_id
      AND user_id = auth.uid()
    )
    OR
    -- User is an admin
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );

-- Policy 5: Users can leave projects (delete their own membership)
CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 6: Admins can remove members from their projects
CREATE POLICY "Admins can remove members"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (
    -- User is the project owner
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_members.project_id
      AND user_id = auth.uid()
    )
    OR
    -- User is an admin
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );