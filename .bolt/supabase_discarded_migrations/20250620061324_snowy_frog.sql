/*
  # Create team_audit_log table

  1. New Tables
    - `team_audit_log`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to flow_projects)
      - `user_id` (uuid, foreign key to auth.users)
      - `action` (text, the action performed)
      - `details` (jsonb, additional details about the action)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `team_audit_log` table
    - Add policy for project admins to view audit logs
    - Add policy for system to insert audit logs

  3. Indexes
    - Add indexes for common query patterns
*/

-- Create team_audit_log table
CREATE TABLE IF NOT EXISTS team_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_audit_log ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_audit_log_project_id ON team_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_team_audit_log_user_id ON team_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_team_audit_log_action ON team_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_team_audit_log_created_at ON team_audit_log(created_at DESC);

-- RLS Policies

-- Project admins can view audit logs
CREATE POLICY "Project admins can view audit logs"
  ON team_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = team_audit_log.project_id
      AND flow_projects.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = team_audit_log.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'admin'
      AND project_members.status = 'accepted'
    )
  );

-- System can insert audit logs (authenticated users can log their own actions)
CREATE POLICY "System can insert audit logs"
  ON team_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create function to log team actions
CREATE OR REPLACE FUNCTION log_team_action(project_uuid uuid, action text, details jsonb DEFAULT '{}')
RETURNS void AS $$
BEGIN
  INSERT INTO team_audit_log (project_id, user_id, action, details)
  VALUES (project_uuid, auth.uid(), action, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;