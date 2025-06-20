/*
  # Restore Complete Team Features and Project Space

  1. Tables Created/Updated
    - `project_members` - Team membership management
    - `team_audit_log` - Audit trail for team actions
    - `flow_projects` - Add visibility column
    - Views and functions for team management

  2. Security
    - RLS policies for all team-related tables
    - Role-based access control (admin, editor, viewer)
    - Audit logging for team actions

  3. Functions
    - Team management functions
    - Activity tracking
    - Permission checking
*/

-- Create project_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_active timestamptz,
  UNIQUE(project_id, user_id)
);

-- Add visibility column to flow_projects if it doesn't exist
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

-- Create team_audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_audit_log ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_role ON project_members(project_id, role);
CREATE INDEX IF NOT EXISTS idx_project_members_user_status ON project_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_team_audit_log_project_id ON team_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_team_audit_log_user_id ON team_audit_log(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_project_members_updated_at ON project_members;
CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_project_members_updated_at();

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

-- Create function to automatically add project owner as admin
CREATE OR REPLACE FUNCTION add_project_owner_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role, status, invited_by_user_id)
  VALUES (NEW.id, NEW.user_id, 'admin', 'accepted', NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add owner as admin
DROP TRIGGER IF EXISTS add_project_owner_as_admin ON flow_projects;
CREATE TRIGGER add_project_owner_as_admin
  AFTER INSERT ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_owner_as_admin();

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

-- Create function to check if user is project admin
CREATE OR REPLACE FUNCTION is_project_admin(project_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = project_uuid
    AND user_id = auth.uid()
    AND status = 'accepted'
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Create view for project members with user details
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

-- RLS Policies for project_members
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Project admins can manage members" ON project_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON project_members;

-- Users can view members of projects they belong to
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm2
      WHERE pm2.project_id = project_members.project_id
      AND pm2.user_id = auth.uid()
      AND pm2.status = 'accepted'
    )
  );

-- Users can view their own memberships (including pending invitations)
CREATE POLICY "Users can view their own memberships"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Project admins can manage members
CREATE POLICY "Project admins can manage members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm2
      WHERE pm2.project_id = project_members.project_id
      AND pm2.user_id = auth.uid()
      AND pm2.role = 'admin'
      AND pm2.status = 'accepted'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm2
      WHERE pm2.project_id = project_members.project_id
      AND pm2.user_id = auth.uid()
      AND pm2.role = 'admin'
      AND pm2.status = 'accepted'
    )
  );

-- Users can update their own membership status (accept/decline invitations)
CREATE POLICY "Users can update their own membership status"
  ON project_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for team_audit_log
DROP POLICY IF EXISTS "Project admins can view audit logs" ON team_audit_log;

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

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON team_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update RLS policies for flow_projects to include team visibility
DROP POLICY IF EXISTS "Users can view their own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON flow_projects;

-- Users can view projects they own or are members of, plus public projects
CREATE POLICY "Users can view accessible projects"
  ON flow_projects FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_projects.id
      AND user_id = auth.uid()
      AND status = 'accepted'
    )
  );

-- Users can create their own projects
CREATE POLICY "Users can create their own projects"
  ON flow_projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Project owners and admins can update projects
CREATE POLICY "Project owners and admins can update projects"
  ON flow_projects FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_projects.id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_projects.id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );

-- Project owners and admins can delete projects
CREATE POLICY "Project owners and admins can delete projects"
  ON flow_projects FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_projects.id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );

-- Update RLS policies for flow_nodes to respect team roles
DROP POLICY IF EXISTS "Users can manage nodes in their projects" ON flow_nodes;
DROP POLICY IF EXISTS "Users can view nodes in public projects" ON flow_nodes;
DROP POLICY IF EXISTS "Users can view nodes in their projects" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can manage nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can update nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Members can view nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can delete nodes" ON flow_nodes;

-- All members can view nodes
CREATE POLICY "Members can view nodes"
  ON flow_nodes FOR SELECT
  TO authenticated
  USING (can_view_project(project_id));

-- Editors and admins can create nodes
CREATE POLICY "Editors can create nodes"
  ON flow_nodes FOR INSERT
  TO authenticated
  WITH CHECK (can_edit_project(project_id));

-- Editors and admins can update nodes
CREATE POLICY "Editors can update nodes"
  ON flow_nodes FOR UPDATE
  TO authenticated
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

-- Editors and admins can delete nodes
CREATE POLICY "Editors can delete nodes"
  ON flow_nodes FOR DELETE
  TO authenticated
  USING (can_edit_project(project_id));

-- Update RLS policies for flow_connections to respect team roles
DROP POLICY IF EXISTS "Users can manage connections in their projects" ON flow_connections;
DROP POLICY IF EXISTS "Users can view connections in public projects" ON flow_connections;
DROP POLICY IF EXISTS "Users can view connections in their projects" ON flow_connections;
DROP POLICY IF EXISTS "Editors can manage connections" ON flow_connections;
DROP POLICY IF EXISTS "Members can view connections" ON flow_connections;
DROP POLICY IF EXISTS "Editors can delete connections" ON flow_connections;

-- All members can view connections
CREATE POLICY "Members can view connections"
  ON flow_connections FOR SELECT
  TO authenticated
  USING (can_view_project(project_id));

-- Editors and admins can create connections
CREATE POLICY "Editors can create connections"
  ON flow_connections FOR INSERT
  TO authenticated
  WITH CHECK (can_edit_project(project_id));

-- Editors and admins can delete connections
CREATE POLICY "Editors can delete connections"
  ON flow_connections FOR DELETE
  TO authenticated
  USING (can_edit_project(project_id));