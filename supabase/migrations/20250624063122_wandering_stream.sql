/*
  # Fix infinite recursion in flow_projects RLS policies

  1. Problem
    - Current RLS policies on flow_projects table are causing infinite recursion
    - This happens when policies reference other tables that in turn reference flow_projects

  2. Solution
    - Drop existing problematic policies
    - Create new, simplified policies that avoid circular references
    - Use direct auth.uid() checks instead of complex subqueries

  3. New Policies
    - Project owners can perform all operations on their projects
    - Team members can read projects they're members of
    - Public projects are readable by authenticated users
*/

-- Drop all existing policies on flow_projects to start fresh
DROP POLICY IF EXISTS "fp_owner_insert" ON flow_projects;
DROP POLICY IF EXISTS "fp_owner_select" ON flow_projects;
DROP POLICY IF EXISTS "fp_owner_update" ON flow_projects;
DROP POLICY IF EXISTS "fp_owner_delete" ON flow_projects;
DROP POLICY IF EXISTS "fp_member_select" ON flow_projects;
DROP POLICY IF EXISTS "fp_public_select" ON flow_projects;

-- Create new, simplified policies that avoid recursion

-- 1. Project owners can insert their own projects
CREATE POLICY "flow_projects_owner_insert"
  ON flow_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. Project owners can select their own projects
CREATE POLICY "flow_projects_owner_select"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Project owners can update their own projects
CREATE POLICY "flow_projects_owner_update"
  ON flow_projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Project owners can delete their own projects
CREATE POLICY "flow_projects_owner_delete"
  ON flow_projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Team members can select projects they're members of
-- This policy checks project_members table directly without referencing flow_projects
CREATE POLICY "flow_projects_member_select"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM project_members pm 
      WHERE pm.project_id = flow_projects.id 
        AND pm.user_id = auth.uid() 
        AND pm.status = 'accepted'
    )
  );

-- 6. Public projects are readable by authenticated users
CREATE POLICY "flow_projects_public_select"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');