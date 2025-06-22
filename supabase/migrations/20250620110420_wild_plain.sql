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

-- Check if policy exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'team_audit_log' 
    AND policyname = 'Project admins can view audit logs'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Project admins can view audit logs"
        ON team_audit_log
        FOR SELECT
        TO authenticated
        USING ((EXISTS ( SELECT 1
         FROM flow_projects
        WHERE ((flow_projects.id = team_audit_log.project_id) AND (flow_projects.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
         FROM project_members pm
        WHERE ((pm.project_id = team_audit_log.project_id) AND (pm.user_id = auth.uid()) AND (pm.role = 'admin'::text) AND (pm.status = 'accepted'::text)))));
    $policy$;
  END IF;
END $$;

-- Create indexes for team_audit_log
CREATE INDEX IF NOT EXISTS idx_team_audit_log_project_id ON team_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_team_audit_log_created_at ON team_audit_log(created_at DESC);

-- Fix project_members policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Project owners have full access" ON project_members;
  DROP POLICY IF EXISTS "Users can view own memberships" ON project_members;
  DROP POLICY IF EXISTS "Users can update own membership status" ON project_members;
  DROP POLICY IF EXISTS "Project admins can manage members" ON project_members;
  DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
  DROP POLICY IF EXISTS "Members can view project members" ON project_members;
  DROP POLICY IF EXISTS "Admins can invite members" ON project_members;
  DROP POLICY IF EXISTS "Members can update their status" ON project_members;
  DROP POLICY IF EXISTS "Members can leave projects" ON project_members;
  DROP POLICY IF EXISTS "Admins can update member roles" ON project_members;
  DROP POLICY IF EXISTS "Admins can remove members" ON project_members;
  DROP POLICY IF EXISTS "Project admins can manage all member operations" ON project_members;
  
  -- Ignore errors if policies don't exist
  EXCEPTION WHEN undefined_object THEN NULL;
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

-- Drop existing log_team_action function if it exists
DROP FUNCTION IF EXISTS log_team_action(uuid, text, jsonb);

-- Create function to log team actions
CREATE OR REPLACE FUNCTION log_team_action(project_uuid uuid, action_name text, details_json jsonb DEFAULT '{}')
RETURNS void AS $$
BEGIN
  INSERT INTO team_audit_log (project_id, user_id, action, details)
  VALUES (project_uuid, auth.uid(), action_name, details_json);
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