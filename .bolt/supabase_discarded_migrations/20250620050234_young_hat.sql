/*
  # Project Space Team Collaboration Feature

  1. New Schema
    - Add `visibility` column to flow_projects table
    - Create project_members table for team collaboration
    - Add last_active tracking for team members
    - Add helper functions for permission checks

  2. Security
    - Enable RLS on all tables
    - Create policies for proper access control
    - Ensure team members have appropriate permissions

  3. Performance
    - Add indexes for common query patterns
    - Optimize for real-time collaboration
*/

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
  last_active timestamptz,
  
  -- Ensure one membership per user per project
  UNIQUE(project_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);
CREATE INDEX IF NOT EXISTS idx_project_members_invited_by ON project_members(invited_by_user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_role ON project_members(project_id, role);
CREATE INDEX IF NOT EXISTS idx_project_members_user_status ON project_members(user_id, status);

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

-- Create helper functions for permission checks
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

-- Create function to update member activity
CREATE OR REPLACE FUNCTION update_project_member_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE project_members
  SET last_active = now()
  WHERE project_id = NEW.project_id AND user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update member activity
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

-- Create function to add project owner as admin
CREATE OR REPLACE FUNCTION add_project_owner_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, invited_by_user_id, role, status)
  VALUES (NEW.id, NEW.user_id, NEW.user_id, 'admin', 'accepted');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add project owner as admin
DROP TRIGGER IF EXISTS add_project_owner_as_admin_trigger ON flow_projects;
CREATE TRIGGER add_project_owner_as_admin_trigger
  AFTER INSERT ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_owner_as_admin();

-- Create audit log table for team operations
CREATE TABLE IF NOT EXISTS team_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE team_audit_log ENABLE ROW LEVEL SECURITY;

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

-- Update RLS policies for flow_nodes to use helper functions
DROP POLICY IF EXISTS "Users can manage nodes in their own projects" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can manage nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can update nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Members can view nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can delete nodes" ON flow_nodes;

-- Editors and admins can create nodes
CREATE POLICY "Editors can manage nodes"
  ON flow_nodes FOR INSERT
  TO authenticated
  WITH CHECK (can_edit_project(project_id));

-- Editors and admins can update nodes
CREATE POLICY "Editors can update nodes"
  ON flow_nodes FOR UPDATE
  TO authenticated
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

-- All members can view nodes
CREATE POLICY "Members can view nodes"
  ON flow_nodes FOR SELECT
  TO authenticated
  USING (can_view_project(project_id));

-- Only editors and admins can delete nodes
CREATE POLICY "Editors can delete nodes"
  ON flow_nodes FOR DELETE
  TO authenticated
  USING (can_edit_project(project_id));

-- Update RLS policies for flow_connections to use helper functions
DROP POLICY IF EXISTS "Users can manage connections in their own projects" ON flow_connections;
DROP POLICY IF EXISTS "Editors can manage connections" ON flow_connections;
DROP POLICY IF EXISTS "Members can view connections" ON flow_connections;
DROP POLICY IF EXISTS "Editors can delete connections" ON flow_connections;

-- Editors and admins can create connections
CREATE POLICY "Editors can manage connections"
  ON flow_connections FOR INSERT
  TO authenticated
  WITH CHECK (can_edit_project(project_id));

-- All members can view connections
CREATE POLICY "Members can view connections"
  ON flow_connections FOR SELECT
  TO authenticated
  USING (can_view_project(project_id));

-- Only editors and admins can delete connections
CREATE POLICY "Editors can delete connections"
  ON flow_connections FOR DELETE
  TO authenticated
  USING (can_edit_project(project_id));

-- Project members policies
CREATE POLICY "Members can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    -- User can see members if they are a member themselves
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.status = 'accepted'
    )
    OR
    -- Users can see their own invitations
    user_id = auth.uid()
  );

-- Only admins can invite new members
CREATE POLICY "Admins can invite members"
  ON project_members FOR INSERT
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

-- Users can update their own status, admins can update roles
CREATE POLICY "Members can update their status"
  ON project_members FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own status
    (user_id = auth.uid())
    OR
    -- Admins can update any member
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
      AND pm.status = 'accepted'
    )
  );

-- Users can leave projects, admins can remove members
CREATE POLICY "Members can leave projects"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    -- Users can remove themselves
    (user_id = auth.uid())
    OR
    -- Admins can remove others
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
      AND pm.status = 'accepted'
    )
  );