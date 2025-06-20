/*
  # Create Project Management Tables

  1. New Tables
    - `project_members`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to flow_projects)
      - `user_id` (uuid, foreign key to auth.users)
      - `role` (text: viewer, editor, admin)
      - `status` (text: pending, accepted, declined)
      - `invited_by_user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `team_audit_log`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to flow_projects)
      - `user_id` (uuid, foreign key to auth.users)
      - `action` (text)
      - `details` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Users can view their own memberships
    - Project owners/admins can manage members

  3. Indexes
    - Optimized indexes for common queries
    - Unique constraints to prevent duplicates
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES flow_projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (project_id, user_id) -- A user can only be a member of a project once
);

-- Create team_audit_log table
CREATE TABLE IF NOT EXISTS team_audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES flow_projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on team_audit_log
ALTER TABLE team_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_members
CREATE POLICY "Users can view their own project memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Project owners can manage all members"
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

CREATE POLICY "Project admins can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  );

-- Create RLS policies for team_audit_log
CREATE POLICY "Project admins can view audit logs"
  ON team_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = team_audit_log.project_id 
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = team_audit_log.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);
CREATE INDEX IF NOT EXISTS idx_team_audit_log_project_id ON team_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_team_audit_log_created_at ON team_audit_log(created_at DESC);

-- Create function to automatically add project owner as admin
CREATE OR REPLACE FUNCTION add_project_owner_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role, status, invited_by_user_id)
  VALUES (NEW.id, NEW.user_id, 'admin', 'accepted', NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add project owner as admin
DROP TRIGGER IF EXISTS add_project_owner_as_admin_trigger ON flow_projects;
CREATE TRIGGER add_project_owner_as_admin_trigger
  AFTER INSERT ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_owner_as_admin();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for project_members updated_at
DROP TRIGGER IF EXISTS update_project_members_updated_at ON project_members;
CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE project_members IS 'Members of flow projects with roles and invitation status';
COMMENT ON TABLE team_audit_log IS 'Audit log for team actions and changes';
COMMENT ON COLUMN project_members.role IS 'Member role: viewer (read-only), editor (can edit), admin (full access)';
COMMENT ON COLUMN project_members.status IS 'Invitation status: pending, accepted, declined';