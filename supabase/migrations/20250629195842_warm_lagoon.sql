/*
  # Add Team Audit Log for Project Activity Tracking

  1. New Tables
    - `team_audit_log` - Stores project activity logs
      - `id` (uuid, primary key)
      - `project_id` (uuid, references flow_projects)
      - `user_id` (uuid, references auth.users)
      - `action` (text)
      - `details` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on team_audit_log
    - Add policy for project owners and admins to view logs
    - Create function to securely log project actions
*/

-- Create team_audit_log table
CREATE TABLE IF NOT EXISTS team_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE team_audit_log IS 'Audit log for team actions and changes';

-- Enable RLS on team_audit_log
ALTER TABLE team_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing audit logs
CREATE POLICY "Project owners and admins can view audit logs"
  ON team_audit_log
  FOR SELECT
  TO authenticated
  USING (
    -- Project owner can view logs
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE flow_projects.id = team_audit_log.project_id 
      AND flow_projects.user_id = auth.uid()
    )
    OR
    -- Project admin can view logs
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = team_audit_log.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
      AND pm.status = 'accepted'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_audit_log_project_id ON team_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_team_audit_log_created_at ON team_audit_log(created_at DESC);

-- Create function to log project actions
CREATE OR REPLACE FUNCTION log_project_action(project_uuid uuid, action_text text, details_json jsonb DEFAULT '{}')
RETURNS void AS $$
BEGIN
  INSERT INTO team_audit_log (project_id, user_id, action, details)
  VALUES (project_uuid, auth.uid(), action_text, details_json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_project_action(uuid, text, jsonb) TO authenticated;