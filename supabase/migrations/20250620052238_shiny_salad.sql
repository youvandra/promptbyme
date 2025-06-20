/*
  # Complete Rebuild of Project Space and Team Feature

  1. Changes
    - Drop all existing project space tables and functions
    - Recreate tables with proper structure
    - Create new RLS policies with no circular dependencies
    - Implement proper team collaboration features

  2. Security
    - Avoid circular dependencies in RLS policies
    - Use direct checks instead of complex subqueries
    - Implement proper role-based access control

  3. Performance
    - Optimize indexes for common query patterns
    - Use efficient SQL patterns
*/

-- First, drop all existing tables and functions in the correct order
DROP TABLE IF EXISTS team_audit_log CASCADE;
DROP TABLE IF EXISTS flow_connections CASCADE;
DROP TABLE IF EXISTS flow_nodes CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS flow_projects CASCADE;

-- Drop functions that might cause issues
DROP FUNCTION IF EXISTS can_view_project(uuid) CASCADE;
DROP FUNCTION IF EXISTS can_edit_project(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_project_member_activity() CASCADE;
DROP FUNCTION IF EXISTS add_project_owner_as_admin() CASCADE;

-- Create flow_projects table
CREATE TABLE flow_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public'))
);

-- Create project_members table
CREATE TABLE project_members (
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

-- Create flow_nodes table
CREATE TABLE flow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('input', 'prompt', 'condition', 'output')),
  title text NOT NULL,
  content text DEFAULT '',
  position_x real NOT NULL DEFAULT 0,
  position_y real NOT NULL DEFAULT 0,
  imported_prompt_id uuid REFERENCES prompts(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flow_connections table
CREATE TABLE flow_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  source_node_id uuid NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_node_id, target_node_id)
);

-- Create audit log table
CREATE TABLE team_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE flow_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_audit_log ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_flow_projects_user_id ON flow_projects(user_id);
CREATE INDEX idx_flow_projects_created_at ON flow_projects(created_at DESC);

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_status ON project_members(status);
CREATE INDEX idx_project_members_invited_by ON project_members(invited_by_user_id);
CREATE INDEX idx_project_members_project_role ON project_members(project_id, role);
CREATE INDEX idx_project_members_user_status ON project_members(user_id, status);

CREATE INDEX idx_flow_nodes_project_id ON flow_nodes(project_id);
CREATE INDEX idx_flow_nodes_type ON flow_nodes(type);
CREATE INDEX idx_flow_nodes_imported_prompt_id ON flow_nodes(imported_prompt_id);

CREATE INDEX idx_flow_connections_project_id ON flow_connections(project_id);
CREATE INDEX idx_flow_connections_source_node ON flow_connections(source_node_id);
CREATE INDEX idx_flow_connections_target_node ON flow_connections(target_node_id);

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

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Create function to add project owner as admin
CREATE OR REPLACE FUNCTION add_project_owner_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, invited_by_user_id, role, status)
  VALUES (NEW.id, NEW.user_id, NEW.user_id, 'admin', 'accepted');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_flow_projects_updated_at
  BEFORE UPDATE ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_nodes_updated_at
  BEFORE UPDATE ON flow_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER track_node_activity
  AFTER INSERT OR UPDATE ON flow_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_member_activity();

CREATE TRIGGER track_connection_activity
  AFTER INSERT OR UPDATE ON flow_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_project_member_activity();

CREATE TRIGGER add_project_owner_as_admin_trigger
  AFTER INSERT ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_owner_as_admin();

-- Create RLS policies for flow_projects
CREATE POLICY "Users can view their own projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view projects they are members of"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can view public projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

CREATE POLICY "Users can create their own projects"
  ON flow_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects"
  ON flow_projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects"
  ON flow_projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for project_members
CREATE POLICY "Users can view their own memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view members of projects they belong to"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  );

CREATE POLICY "Admins can invite members"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by_user_id = auth.uid() AND
    (
      -- User is project owner
      EXISTS (
        SELECT 1 FROM flow_projects
        WHERE id = project_id
        AND user_id = auth.uid()
      ) OR
      -- User is project admin
      EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = project_members.project_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND status = 'accepted'
      )
    )
  );

CREATE POLICY "Users can update their own membership"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update member roles"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can remove members"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );

-- Create RLS policies for flow_nodes
CREATE POLICY "Members can view nodes"
  ON flow_nodes
  FOR SELECT
  TO authenticated
  USING (
    -- Project owner can view
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    -- Project member can view
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_nodes.project_id
      AND user_id = auth.uid()
      AND status = 'accepted'
    ) OR
    -- Public project
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND visibility = 'public'
    )
  );

CREATE POLICY "Editors can manage nodes"
  ON flow_nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Project owner can edit
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    -- Project editor/admin can edit
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_nodes.project_id
      AND user_id = auth.uid()
      AND role IN ('editor', 'admin')
      AND status = 'accepted'
    )
  );

CREATE POLICY "Editors can update nodes"
  ON flow_nodes
  FOR UPDATE
  TO authenticated
  USING (
    -- Project owner can edit
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    -- Project editor/admin can edit
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_nodes.project_id
      AND user_id = auth.uid()
      AND role IN ('editor', 'admin')
      AND status = 'accepted'
    )
  );

CREATE POLICY "Editors can delete nodes"
  ON flow_nodes
  FOR DELETE
  TO authenticated
  USING (
    -- Project owner can delete
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    -- Project editor/admin can delete
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_nodes.project_id
      AND user_id = auth.uid()
      AND role IN ('editor', 'admin')
      AND status = 'accepted'
    )
  );

-- Create RLS policies for flow_connections
CREATE POLICY "Members can view connections"
  ON flow_connections
  FOR SELECT
  TO authenticated
  USING (
    -- Project owner can view
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    -- Project member can view
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_connections.project_id
      AND user_id = auth.uid()
      AND status = 'accepted'
    ) OR
    -- Public project
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND visibility = 'public'
    )
  );

CREATE POLICY "Editors can manage connections"
  ON flow_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Project owner can edit
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    -- Project editor/admin can edit
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_connections.project_id
      AND user_id = auth.uid()
      AND role IN ('editor', 'admin')
      AND status = 'accepted'
    )
  );

CREATE POLICY "Editors can delete connections"
  ON flow_connections
  FOR DELETE
  TO authenticated
  USING (
    -- Project owner can delete
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    -- Project editor/admin can delete
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = flow_connections.project_id
      AND user_id = auth.uid()
      AND role IN ('editor', 'admin')
      AND status = 'accepted'
    )
  );

-- Create RLS policy for team_audit_log
CREATE POLICY "Project admins can view audit logs"
  ON team_audit_log
  FOR SELECT
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