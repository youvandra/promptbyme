/*
  # Add Project Members Table for Team Invitations

  1. New Tables
    - `project_members`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to flow_projects)
      - `user_id` (uuid, foreign key to users)
      - `invited_by_user_id` (uuid, foreign key to users)
      - `role` (text, enum: viewer, editor, admin)
      - `status` (text, enum: pending, accepted, declined)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `project_members` table
    - Add policies for team member management
    - Ensure only project admins can invite/remove members
    - Allow users to manage their own invitations

  3. Constraints
    - Unique constraint on (project_id, user_id)
    - Check constraints for role and status values
*/

-- Create project_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one membership per user per project
  UNIQUE(project_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);
CREATE INDEX IF NOT EXISTS idx_project_members_invited_by ON project_members(invited_by_user_id);

-- Enable Row Level Security
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "project_members_select" ON project_members;
  DROP POLICY IF EXISTS "project_members_insert" ON project_members;
  DROP POLICY IF EXISTS "project_members_update" ON project_members;
  DROP POLICY IF EXISTS "project_members_delete" ON project_members;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if policies don't exist
END $$;

-- Policy: Users can view project members if they are members themselves
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
    OR
    -- Users can see their own pending invitations
    user_id = auth.uid()
  );

-- Policy: Only project admins can invite new members
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

-- Policy: Users can update their own invitation status, admins can update member roles
CREATE POLICY "project_members_update" ON project_members
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can accept/decline their own invitations
    user_id = auth.uid()
    OR
    -- Project admins can update member roles and status
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
      AND pm.status = 'accepted'
    )
  );

-- Policy: Project admins can remove members, users can remove themselves
CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE
  TO authenticated
  USING (
    -- Users can leave projects themselves
    user_id = auth.uid()
    OR
    -- Project admins can remove members
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
      AND pm.status = 'accepted'
    )
  );

-- Create or replace trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_project_members_updated_at ON project_members;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_project_members_updated_at();

-- Create or replace function to add project owner as admin when project is created
CREATE OR REPLACE FUNCTION add_project_owner_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, invited_by_user_id, role, status)
  VALUES (NEW.id, NEW.user_id, NEW.user_id, 'admin', 'accepted');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS add_project_owner_as_admin_trigger ON flow_projects;

-- Create trigger to add project owner as admin
CREATE TRIGGER add_project_owner_as_admin_trigger
  AFTER INSERT ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_owner_as_admin();