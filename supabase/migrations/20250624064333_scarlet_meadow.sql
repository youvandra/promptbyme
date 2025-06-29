/*
  # Fix Infinite Recursion in RLS Policies

  1. Changes
     - Remove circular dependency between flow_projects and project_members tables
     - Drop policies that cause infinite recursion
     - Ensure project owners can still manage members through their admin role
  
  2. Security
     - Maintain proper access control
     - Rely on the add_project_owner_as_admin_trigger to grant owner access
*/

-- Drop the policies that create circular dependencies
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
DROP POLICY IF EXISTS "Project owners can view all members" ON project_members;
DROP POLICY IF EXISTS "fc_owner_all" ON flow_connections;
DROP POLICY IF EXISTS "fc_owner_select" ON flow_connections;
DROP POLICY IF EXISTS "fn_owner_all" ON flow_nodes;
DROP POLICY IF EXISTS "fn_owner_select" ON flow_nodes;

-- The project owner will still have access through the admin role
-- which is automatically assigned by the add_project_owner_as_admin_trigger