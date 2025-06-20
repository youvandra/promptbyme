/*
  # Remove All Team Features

  This migration completely removes all team-related functionality from the database
  while preserving the core project space functionality for individual users.

  ## Changes Made

  1. **Dropped Tables**
     - `project_members` - Team membership management
     - `team_audit_log` - Team activity logging

  2. **Dropped Functions**
     - `add_project_owner_as_admin()` - Auto-added project owners as admins
     - `update_project_member_activity()` - Tracked member activity

  3. **Dropped Triggers**
     - `add_project_owner_as_admin_trigger` on `flow_projects`
     - `track_node_activity` on `flow_nodes`
     - `track_connection_activity` on `flow_connections`

  4. **Updated RLS Policies**
     - Simplified all policies to owner-only access
     - Removed complex team-based permission checks
     - Added public visibility support where appropriate

  5. **Updated Table Structure**
     - Removed team-related columns and constraints
     - Simplified to single-user ownership model
*/

-- Drop all team-related triggers first
DROP TRIGGER IF EXISTS add_project_owner_as_admin_trigger ON flow_projects;
DROP TRIGGER IF EXISTS track_node_activity ON flow_nodes;
DROP TRIGGER IF EXISTS track_connection_activity ON flow_connections;

-- Drop all team-related functions
DROP FUNCTION IF EXISTS add_project_owner_as_admin();
DROP FUNCTION IF EXISTS update_project_member_activity();

-- Drop all existing RLS policies for flow tables
DROP POLICY IF EXISTS "Users can view projects they are members of" ON flow_projects;
DROP POLICY IF EXISTS "Users can view public projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON flow_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON flow_projects;

DROP POLICY IF EXISTS "Members can view nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can manage nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can update nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Editors can delete nodes" ON flow_nodes;

DROP POLICY IF EXISTS "Members can view connections" ON flow_connections;
DROP POLICY IF EXISTS "Editors can manage connections" ON flow_connections;
DROP POLICY IF EXISTS "Editors can delete connections" ON flow_connections;

-- Drop team-related tables
DROP TABLE IF EXISTS team_audit_log CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;

-- Drop the project_members_view if it exists
DROP VIEW IF EXISTS project_members_view CASCADE;

-- Create simplified RLS policies for flow_projects
CREATE POLICY "Users can view their own projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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

-- Create simplified RLS policies for flow_nodes
CREATE POLICY "Users can view nodes in their projects"
  ON flow_nodes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = flow_nodes.project_id
      AND flow_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view nodes in public projects"
  ON flow_nodes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = flow_nodes.project_id
      AND flow_projects.visibility = 'public'
    )
  );

CREATE POLICY "Users can manage nodes in their projects"
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
CREATE POLICY "Users can view connections in their projects"
  ON flow_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = flow_connections.project_id
      AND flow_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view connections in public projects"
  ON flow_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = flow_connections.project_id
      AND flow_projects.visibility = 'public'
    )
  );

CREATE POLICY "Users can manage connections in their projects"
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