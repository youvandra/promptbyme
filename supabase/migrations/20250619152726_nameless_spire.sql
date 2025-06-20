/*
  # Fix Project Members Policies

  1. Security
    - Drop existing policies safely
    - Create new policies with proper permissions
    - Ensure RLS is enabled

  2. Policies
    - Users can view members of projects they belong to
    - Only admins can invite new members
    - Users can manage their own membership
    - Admins can manage all memberships
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "project_members_select" ON project_members;
  DROP POLICY IF EXISTS "project_members_insert" ON project_members;
  DROP POLICY IF EXISTS "project_members_update" ON project_members;
  DROP POLICY IF EXISTS "project_members_delete" ON project_members;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policy for viewing project members
-- Users can view members of projects they are part of
CREATE POLICY "project_members_select" ON project_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.status = 'accepted'
    )
    OR user_id = auth.uid()
  );

-- Policy for inviting members
-- Only project admins can invite new members
CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
      AND pm.status = 'accepted'
    )
    AND invited_by_user_id = auth.uid()
  );

-- Policy for updating memberships
-- Users can update their own status, admins can update roles
CREATE POLICY "project_members_update" ON project_members
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
      AND pm.status = 'accepted'
    )
  );

-- Policy for removing members
-- Users can remove themselves, admins can remove others
CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
      AND pm.status = 'accepted'
    )
  );