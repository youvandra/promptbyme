/*
  # Create project members and invitations system

  1. New Tables
    - `project_members`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references flow_projects)
      - `user_id` (uuid, references auth.users)
      - `role` (text, admin/editor/viewer)
      - `status` (text, pending/accepted/declined)
      - `invited_by_user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `project_members` table
    - Add policies for project members management
    - Add policies for viewing invitations

  3. Indexes
    - Add indexes for efficient querying
*/

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);
CREATE INDEX IF NOT EXISTS idx_project_members_invited_by ON project_members(invited_by_user_id);

-- RLS Policies
CREATE POLICY "Users can view their own memberships and invitations"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    invited_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE flow_projects.id = project_members.project_id 
      AND flow_projects.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.status = 'accepted'
      AND pm.role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Project owners and admins can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE flow_projects.id = project_members.project_id 
      AND flow_projects.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.status = 'accepted'
      AND pm.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE flow_projects.id = project_members.project_id 
      AND flow_projects.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.status = 'accepted'
      AND pm.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own invitation status"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_project_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_project_members_updated_at();