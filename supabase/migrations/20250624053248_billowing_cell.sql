/*
  # Fix Project Members RLS Policies

  1. Problem
    - Circular dependency between project_members and flow_connections policies
    - Editors can't create flow connections due to RLS policy restrictions
    - Subqueries in flow_connections policies can't access project_members data

  2. Solution
    - Drop all existing project_members policies
    - Create simplified policies with clear separation of concerns
    - Ensure all members can view other members in the same project
    - Maintain proper role-based access control

  3. Security
    - Project owners and admins can manage members
    - All project members can view other members
    - Users can manage their own memberships
    - No circular dependencies in policy definitions
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

-- Policy 1: Users can view their own memberships (including pending invitations)
CREATE POLICY "Users can view own memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can view all members in projects they belong to
-- This is critical for subqueries in other policies to work correctly
CREATE POLICY "Members can view all project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    -- User is a member of the same project (any role, accepted status)
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND status = 'accepted'
    )
    OR
    -- User is the project owner
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_members.project_id
      AND user_id = auth.uid()
    )
  );

-- Policy 3: Project owners can manage all member operations
CREATE POLICY "Project owners can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_members.project_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_members.project_id
      AND user_id = auth.uid()
    )
  );

-- Policy 4: Project admins can manage all member operations
CREATE POLICY "Project admins can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );

-- Policy 5: Users can update their own membership status (accept/decline invitations)
CREATE POLICY "Users can update own membership"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 6: Users can leave projects (delete their own membership)
CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());