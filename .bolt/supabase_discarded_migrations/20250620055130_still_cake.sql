/*
  # Complete Removal of Project Space Feature

  This migration completely removes all project space functionality from the database:
  
  1. Database Cleanup
     - Drop all project space tables (flow_projects, flow_nodes, flow_connections)
     - Drop all related functions and triggers
     - Remove all RLS policies
     - Clean up all indexes
  
  2. Security
     - Remove all access policies related to project space
     - Clean up any remaining references
*/

-- Drop all project space tables in the correct order (respecting foreign keys)
DROP TABLE IF EXISTS flow_connections CASCADE;
DROP TABLE IF EXISTS flow_nodes CASCADE;
DROP TABLE IF EXISTS flow_projects CASCADE;

-- Drop any remaining team-related tables that might still exist
DROP TABLE IF EXISTS team_audit_log CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;

-- Drop any views related to project space
DROP VIEW IF EXISTS project_members_view CASCADE;

-- Drop all functions related to project space
DROP FUNCTION IF EXISTS add_project_owner_as_admin() CASCADE;
DROP FUNCTION IF EXISTS update_project_member_activity() CASCADE;
DROP FUNCTION IF EXISTS can_view_project(uuid) CASCADE;
DROP FUNCTION IF EXISTS can_edit_project(uuid) CASCADE;

-- Drop all triggers related to project space
DROP TRIGGER IF EXISTS add_project_owner_as_admin_trigger ON flow_projects CASCADE;
DROP TRIGGER IF EXISTS track_node_activity ON flow_nodes CASCADE;
DROP TRIGGER IF EXISTS track_connection_activity ON flow_connections CASCADE;
DROP TRIGGER IF EXISTS update_flow_projects_updated_at ON flow_projects CASCADE;
DROP TRIGGER IF EXISTS update_flow_nodes_updated_at ON flow_nodes CASCADE;
DROP TRIGGER IF EXISTS update_project_members_updated_at ON project_members CASCADE;

-- Drop all indexes related to project space
DROP INDEX IF EXISTS idx_flow_projects_user_id;
DROP INDEX IF EXISTS idx_flow_projects_visibility;
DROP INDEX IF EXISTS idx_flow_projects_updated_at;
DROP INDEX IF EXISTS idx_flow_nodes_project_id;
DROP INDEX IF EXISTS idx_flow_nodes_type;
DROP INDEX IF EXISTS idx_flow_nodes_updated_at;
DROP INDEX IF EXISTS idx_flow_connections_project_id;
DROP INDEX IF EXISTS idx_flow_connections_source_node;
DROP INDEX IF EXISTS idx_flow_connections_target_node;
DROP INDEX IF EXISTS idx_project_members_project_id;
DROP INDEX IF EXISTS idx_project_members_user_id;
DROP INDEX IF EXISTS idx_project_members_status;
DROP INDEX IF EXISTS idx_project_members_project_role;
DROP INDEX IF EXISTS idx_project_members_user_status;
DROP INDEX IF EXISTS idx_project_members_invited_by;
DROP INDEX IF EXISTS flow_projects_user_id_idx;
DROP INDEX IF EXISTS flow_projects_created_at_idx;
DROP INDEX IF EXISTS flow_nodes_project_id_idx;
DROP INDEX IF EXISTS flow_nodes_type_idx;
DROP INDEX IF EXISTS flow_nodes_imported_prompt_id_idx;
DROP INDEX IF EXISTS flow_connections_project_id_idx;
DROP INDEX IF EXISTS flow_connections_source_node_idx;
DROP INDEX IF EXISTS flow_connections_target_node_idx;

-- Drop all RLS policies related to project space using dynamic SQL
-- This ensures we catch all policies regardless of case sensitivity
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('flow_projects', 'flow_nodes', 'flow_connections', 'team_audit_log', 'project_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END
$$;

-- Clean up any remaining references to project space in other tables
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_imported_to_flow_node_fkey;
ALTER TABLE prompts DROP COLUMN IF EXISTS imported_to_flow_node;

-- Verify all project space tables are removed
DO $$
BEGIN
  ASSERT NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('flow_projects', 'flow_nodes', 'flow_connections', 'team_audit_log', 'project_members')
  ), 'Some project space tables still exist';
END
$$;