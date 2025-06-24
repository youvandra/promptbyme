/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - Infinite recursion detected in policies for flow_projects table
    - Circular dependencies between policies causing stack overflow
    - Error when creating or fetching projects

  2. Solution
    - Drop all existing policies on flow_projects
    - Create new simplified policies with direct checks
    - Avoid circular references between tables
    - Use clear naming convention for policies

  3. Security
    - Maintain same access control rules
    - Project owners can manage their projects
    - Members can view projects they belong to
    - Public projects are visible to all authenticated users
*/

-- Drop all existing policies on flow_projects to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'flow_projects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON flow_projects';
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE flow_projects ENABLE ROW LEVEL SECURITY;

-- Create new, simplified policies that avoid recursion

-- 1. Project owners can do everything with their own projects
CREATE POLICY "fp_owner_all"
  ON flow_projects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Members can view projects they're members of
-- This policy checks project_members table directly without circular references
CREATE POLICY "fp_member_select"
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

-- 3. Public projects are visible to all authenticated users
CREATE POLICY "fp_public_select"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');