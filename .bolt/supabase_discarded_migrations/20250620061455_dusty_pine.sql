/*
  # Fix team_audit_log table missing error

  1. New Tables
    - `team_audit_log`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to flow_projects)
      - `user_id` (uuid, foreign key to auth.users)
      - `action` (text)
      - `details` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `team_audit_log` table
    - Add policy for project admins to view logs
    - Add policy for users to insert their own actions

  3. Functions
    - Create helper function `log_team_action()` for easy logging
*/

-- Create team_audit_log table if it doesn't exist
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

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Project admins can view audit logs" ON team_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON team_audit_log;

-- Project owners and admins can view audit logs
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

-- Authenticated users can insert their own audit logs
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
EXCEPTION
  WHEN OTHERS THEN
    -- Silently ignore errors to prevent breaking the main functionality
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;