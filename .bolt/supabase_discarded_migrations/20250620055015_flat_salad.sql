/*
  # Complete Removal of Team Features and Audit Log

  1. Changes
    - Drop all team-related tables (team_audit_log, project_members)
    - Drop all team-related functions and triggers
    - Remove team-related columns from existing tables
    - Clean up all RLS policies that reference team features

  2. Security
    - Recreate simplified RLS policies for single-user ownership
    - Ensure proper access control for flow_projects, flow_nodes, and flow_connections
*/

-- Drop all team-related policies first
DROP POLICY IF EXISTS "Project admins can view audit logs" ON team_audit_log;

-- Drop team-related tables
DROP TABLE IF EXISTS team_audit_log CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;

-- Drop team-related views
DROP VIEW IF EXISTS project_members_view CASCADE;

-- Drop team-related functions
DROP FUNCTION IF EXISTS add_project_owner_as_admin() CASCADE;
DROP FUNCTION IF EXISTS update_project_member_activity() CASCADE;
DROP FUNCTION IF EXISTS can_view_project(uuid) CASCADE;
DROP FUNCTION IF EXISTS can_edit_project(uuid) CASCADE;

-- Drop team-related triggers
DROP TRIGGER IF EXISTS add_project_owner_as_admin_trigger ON flow_projects CASCADE;
DROP TRIGGER IF EXISTS track_node_activity ON flow_nodes CASCADE;
DROP TRIGGER IF EXISTS track_connection_activity ON flow_connections CASCADE;

-- Clean up flow_projects table
ALTER TABLE flow_projects DROP COLUMN IF EXISTS visibility;

-- Ensure RLS is enabled on all tables
ALTER TABLE flow_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_connections ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('flow_projects', 'flow_nodes', 'flow_connections')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END
$$;

-- Create simplified RLS policies for flow_projects
CREATE POLICY "user_own_projects"
  ON flow_projects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create simplified RLS policies for flow_nodes
CREATE POLICY "user_own_nodes"
  ON flow_nodes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = flow_nodes.project_id
      AND flow_projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = flow_nodes.project_id
      AND flow_projects.user_id = auth.uid()
    )
  );

-- Create simplified RLS policies for flow_connections
CREATE POLICY "user_own_connections"
  ON flow_connections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = flow_connections.project_id
      AND flow_projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = flow_connections.project_id
      AND flow_projects.user_id = auth.uid()
    )
  );

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_flow_projects_user_id ON flow_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_nodes_project_id ON flow_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_flow_connections_project_id ON flow_connections(project_id);

-- Add documentation
COMMENT ON TABLE flow_projects IS 'Project space projects - single user ownership only';
COMMENT ON TABLE flow_nodes IS 'Flow nodes belonging to projects - owner access only';
COMMENT ON TABLE flow_connections IS 'Connections between flow nodes - owner access only';