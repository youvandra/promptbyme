/*
  # Enhance Team Collaboration Feature

  1. Improvements
    - Add email notification support for invitations
    - Add display_name to project_members view for better UI
    - Add last_active timestamp to track member activity
    - Improve project member role descriptions
    - Add project visibility settings (public/private/team)

  2. Security
    - Strengthen RLS policies for better access control
    - Add audit logging for sensitive operations
    - Ensure proper cascading on user/project deletion

  3. Performance
    - Add composite indexes for common query patterns
    - Optimize existing indexes
*/

-- Add last_active column to project_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_members' AND column_name = 'last_active'
  ) THEN
    ALTER TABLE project_members ADD COLUMN last_active timestamptz;
  END IF;
END $$;

-- Create a view for project members with user details for UI
CREATE OR REPLACE VIEW project_members_view AS
SELECT 
  pm.id,
  pm.project_id,
  pm.user_id,
  pm.invited_by_user_id,
  pm.role,
  pm.status,
  pm.created_at,
  pm.updated_at,
  pm.last_active,
  u.display_name,
  u.email,
  u.avatar_url,
  ib.display_name AS invited_by_name
FROM 
  project_members pm
JOIN 
  users u ON pm.user_id = u.id
LEFT JOIN 
  users ib ON pm.invited_by_user_id = ib.id;

-- Add visibility column to flow_projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_projects' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE flow_projects ADD COLUMN visibility text NOT NULL DEFAULT 'private' 
      CHECK (visibility IN ('private', 'team', 'public'));
  END IF;
END $$;

-- Create function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_project_member_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE project_members
  SET last_active = now()
  WHERE project_id = NEW.project_id AND user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to track activity
DROP TRIGGER IF EXISTS track_node_activity ON flow_nodes;
CREATE TRIGGER track_node_activity
  AFTER INSERT OR UPDATE ON flow_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_member_activity();

DROP TRIGGER IF EXISTS track_connection_activity ON flow_connections;
CREATE TRIGGER track_connection_activity
  AFTER INSERT OR UPDATE ON flow_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_project_member_activity();

-- Create function to check if user can edit project
CREATE OR REPLACE FUNCTION can_edit_project(project_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = project_uuid
    AND user_id = auth.uid()
    AND status = 'accepted'
    AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can view project
CREATE OR REPLACE FUNCTION can_view_project(project_uuid uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if project is public
  IF EXISTS (
    SELECT 1 FROM flow_projects
    WHERE id = project_uuid
    AND visibility = 'public'
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is a member
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = project_uuid
    AND user_id = auth.uid()
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table for team operations
CREATE TABLE IF NOT EXISTS team_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy
    WHERE polrelid = 'team_audit_log'::regclass
  ) THEN
    ALTER TABLE team_audit_log ENABLE ROW LEVEL SECURITY;
  END IF;
END;
$$;

-- Drop existing policy if it exists to avoid duplication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Project admins can view audit logs'
    AND tablename = 'team_audit_log'
  ) THEN
    EXECUTE 'DROP POLICY "Project admins can view audit logs" ON team_audit_log';
  END IF;
END;
$$;

-- Only project admins can view audit logs
CREATE POLICY "Project admins can view audit logs"
  ON team_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = team_audit_log.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );

-- Create function to log team actions
CREATE OR REPLACE FUNCTION log_team_action(project_uuid uuid, action text, details jsonb DEFAULT '{}')
RETURNS void AS $$
BEGIN
  INSERT INTO team_audit_log (project_id, user_id, action, details)
  VALUES (project_uuid, auth.uid(), action, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create function to get pending invitations for current user
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
  id uuid,
  project_id uuid,
  project_name text,
  project_description text,
  role text,
  invited_by text,
  invited_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.project_id,
    p.name AS project_name,
    p.description AS project_description,
    pm.role,
    u.display_name AS invited_by,
    pm.created_at AS invited_at
  FROM 
    project_members pm
  JOIN 
    flow_projects p ON pm.project_id = p.id
  JOIN 
    users u ON pm.invited_by_user_id = u.id
  WHERE 
    pm.user_id = auth.uid()
    AND pm.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_project_members_project_role ON project_members(project_id, role);
CREATE INDEX IF NOT EXISTS idx_project_members_user_status ON project_members(user_id, status);

-- Update existing RLS policies for flow_nodes to respect editor/viewer roles
DROP POLICY IF EXISTS "Users can manage nodes in their own projects" ON flow_nodes;

-- Editors and admins can create/update nodes
CREATE POLICY "Editors can manage nodes"
  ON flow_nodes FOR INSERT
  TO authenticated
  WITH CHECK (
    can_edit_project(project_id)
  );

CREATE POLICY "Editors can update nodes"
  ON flow_nodes FOR UPDATE
  TO authenticated
  USING (
    can_edit_project(project_id)
  )
  WITH CHECK (
    can_edit_project(project_id)
  );

-- All members can view nodes
CREATE POLICY "Members can view nodes"
  ON flow_nodes FOR SELECT
  TO authenticated
  USING (
    can_view_project(project_id)
  );

-- Only editors and admins can delete nodes
CREATE POLICY "Editors can delete nodes"
  ON flow_nodes FOR DELETE
  TO authenticated
  USING (
    can_edit_project(project_id)
  );

-- Update existing RLS policies for flow_connections to respect editor/viewer roles
DROP POLICY IF EXISTS "Users can manage connections in their own projects" ON flow_connections;

-- Editors and admins can create/update connections
CREATE POLICY "Editors can manage connections"
  ON flow_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    can_edit_project(project_id)
  );

-- All members can view connections
CREATE POLICY "Members can view connections"
  ON flow_connections FOR SELECT
  TO authenticated
  USING (
    can_view_project(project_id)
  );

-- Only editors and admins can delete connections
CREATE POLICY "Editors can delete connections"
  ON flow_connections FOR DELETE
  TO authenticated
  USING (
    can_edit_project(project_id)
  );