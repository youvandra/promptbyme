-- Drop existing tables and functions related to team features
DROP TABLE IF EXISTS team_audit_log CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;

-- Drop existing functions related to team features
DROP FUNCTION IF EXISTS update_project_member_activity() CASCADE;
DROP FUNCTION IF EXISTS add_project_owner_as_admin() CASCADE;

-- Modify flow_projects table to remove team-related columns
ALTER TABLE flow_projects DROP COLUMN IF EXISTS visibility;

-- Update RLS policies for flow_projects to remove team-related policies
DROP POLICY IF EXISTS "Users can view projects they are members of" ON flow_projects;
DROP POLICY IF EXISTS "Users can view public projects" ON flow_projects;

-- Create simplified policies for flow_projects (owner-only)
CREATE POLICY "Users can view their own projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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

-- Update RLS policies for flow_nodes to remove team-related policies
DROP POLICY IF EXISTS "Members can view nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can manage nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can update nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can delete nodes" ON flow_nodes;

-- Create simplified policies for flow_nodes (owner-only)
CREATE POLICY "Users can view nodes in their own projects"
  ON flow_nodes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create nodes in their own projects"
  ON flow_nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update nodes in their own projects"
  ON flow_nodes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete nodes in their own projects"
  ON flow_nodes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    )
  );

-- Update RLS policies for flow_connections to remove team-related policies
DROP POLICY IF EXISTS "Members can view connections" ON flow_connections;
DROP POLICY IF EXISTS "Editors can manage connections" ON flow_connections;
DROP POLICY IF EXISTS "Editors can delete connections" ON flow_connections;

-- Create simplified policies for flow_connections (owner-only)
CREATE POLICY "Users can view connections in their own projects"
  ON flow_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create connections in their own projects"
  ON flow_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete connections in their own projects"
  ON flow_connections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    )
  );