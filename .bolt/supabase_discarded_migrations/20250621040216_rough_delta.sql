/*
  # Fix project member policies and add team audit functionality

  1. New Tables
    - `team_audit_log`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to flow_projects)
      - `user_id` (uuid, foreign key to auth.users)
      - `action` (text)
      - `details` (jsonb)
      - `created_at` (timestamptz)

  2. New Functions
    - `is_project_admin` - Check if user is project admin
    - `log_team_action` - Log team actions to audit table
    - `get_project_member_count` - Get accurate member count including owner

  3. Security
    - Enable RLS on team_audit_log
    - Fix project_members policies to avoid conflicts
    - Add proper access controls for audit logs

  4. Changes
    - Recreate all project_members policies to ensure consistency
    - Add audit logging functionality
    - Improve member counting logic
*/

-- Create is_project_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION is_project_admin(project_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  -- Check if user is the project owner
  IF EXISTS (
    SELECT 1 FROM flow_projects 
    WHERE id = project_uuid AND user_id = user_uuid
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is an admin member
  RETURN EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid 
    AND user_id = user_uuid 
    AND role = 'admin'
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create team_audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE team_audit_log IS 'Audit log for team actions and changes';

-- Enable RLS on team_audit_log
ALTER TABLE team_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on project_members to avoid conflicts
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

-- Drop all existing policies on team_audit_log to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'team_audit_log'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON team_audit_log';
    END LOOP;
END $$;

-- Create new policies for project_members
CREATE POLICY "Project admins can manage all member operations"
  ON project_members
  FOR ALL
  TO authenticated
  USING (is_project_admin(project_id))
  WITH CHECK (is_project_admin(project_id));

CREATE POLICY "Users can view own memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own membership"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policy for team_audit_log
CREATE POLICY "Project admins can view audit logs"
  ON team_audit_log
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM flow_projects
  WHERE ((flow_projects.id = team_audit_log.project_id) AND (flow_projects.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM project_members pm
  WHERE ((pm.project_id = team_audit_log.project_id) AND (pm.user_id = auth.uid()) AND (pm.role = 'admin'::text) AND (pm.status = 'accepted'::text)))));

-- Create indexes for team_audit_log
CREATE INDEX IF NOT EXISTS idx_team_audit_log_project_id ON team_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_team_audit_log_created_at ON team_audit_log(created_at DESC);

-- Create function to log team actions
CREATE OR REPLACE FUNCTION log_team_action(project_uuid uuid, action_text text, details_json jsonb DEFAULT '{}')
RETURNS void AS $$
BEGIN
  INSERT INTO team_audit_log (project_id, user_id, action, details)
  VALUES (project_uuid, auth.uid(), action_text, details_json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_project_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION log_team_action(uuid, text, jsonb) TO authenticated;

-- Create function to get project member count (including owner)
CREATE OR REPLACE FUNCTION get_project_member_count(project_uuid uuid)
RETURNS integer AS $$
DECLARE
  member_count integer;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM project_members
  WHERE project_id = project_uuid
  AND status = 'accepted';
  
  -- Check if owner is already counted in members
  IF NOT EXISTS (
    SELECT 1 FROM project_members pm
    JOIN flow_projects fp ON pm.project_id = fp.id
    WHERE fp.id = project_uuid
    AND fp.user_id = pm.user_id
    AND pm.status = 'accepted'
  ) THEN
    -- Add 1 for the owner if not already counted
    member_count := member_count + 1;
  END IF;
  
  RETURN member_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_project_member_count(uuid) TO authenticated;