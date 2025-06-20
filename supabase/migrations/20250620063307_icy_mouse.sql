/*
  # Fix Project Members RLS Policies

  1. Problem
    - Infinite recursion in RLS policies for project_members table
    - Policies were referencing the same table they protect

  2. Solution
    - Simplify policies to avoid circular references
    - Use direct foreign key relationships instead of subqueries where possible
    - Separate concerns between different types of access

  3. Security
    - Project owners can manage all members
    - Users can view and update their own memberships
    - Admins can manage members (using a safe approach)
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON project_members;
DROP POLICY IF EXISTS "Users can update own membership status" ON project_members;
DROP POLICY IF EXISTS "Project admins can manage members" ON project_members;

-- Ensure RLS is enabled
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policy 1: Project owners (from flow_projects) can do everything
CREATE POLICY "Project owners have full access"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE flow_projects.id = project_members.project_id 
      AND flow_projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE flow_projects.id = project_members.project_id 
      AND flow_projects.user_id = auth.uid()
    )
  );

-- Policy 2: Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Users can update their own membership status (for accepting/declining invitations)
CREATE POLICY "Users can update own membership status"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create a function to check if user is admin of a project (to avoid recursion)
CREATE OR REPLACE FUNCTION is_project_admin(project_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  -- Check if user is project owner first
  SELECT EXISTS (
    SELECT 1 FROM flow_projects 
    WHERE id = project_uuid AND user_id = user_uuid
  ) INTO is_admin;
  
  -- If not owner, check if they're an admin member
  IF NOT is_admin THEN
    SELECT EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = project_uuid 
      AND user_id = user_uuid 
      AND role = 'admin' 
      AND status = 'accepted'
    ) INTO is_admin;
  END IF;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy 4: Project admins can manage members (using the function to avoid recursion)
CREATE POLICY "Project admins can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (is_project_admin(project_id, auth.uid()))
  WITH CHECK (is_project_admin(project_id, auth.uid()));

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_project_admin(uuid, uuid) TO authenticated;

-- Create indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON project_members(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role_status ON project_members(role, status);