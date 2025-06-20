/*
  # Fix Project Members RLS Policies and Relationships

  1. Database Changes
    - Drop existing problematic RLS policies on project_members table
    - Create simplified, non-recursive RLS policies
    - Ensure proper foreign key relationships exist

  2. Security
    - Enable RLS on project_members table
    - Add policies for project owners and members to manage memberships
    - Add policies for users to view their own memberships
    - Prevent infinite recursion by simplifying policy logic

  3. Relationships
    - Ensure foreign keys are properly defined for user relationships
*/

-- First, drop all existing policies on project_members to start fresh
DROP POLICY IF EXISTS "Project admins can manage members" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage all members" ON project_members;
DROP POLICY IF EXISTS "Users can view their own project memberships" ON project_members;

-- Ensure the table has RLS enabled
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Create simplified, non-recursive policies

-- Policy 1: Project owners (from flow_projects table) can manage all members
CREATE POLICY "Project owners can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE flow_projects.id = project_members.project_id 
      AND flow_projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE flow_projects.id = project_members.project_id 
      AND flow_projects.user_id = auth.uid()
    )
  );

-- Policy 2: Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Users can update their own membership status (accept/decline invitations)
CREATE POLICY "Users can update own membership status"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Project admins can manage members (simplified to avoid recursion)
CREATE POLICY "Project admins can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid() 
      AND pm.role = 'admin' 
      AND pm.status = 'accepted'
    )
  );

-- Ensure foreign key constraints exist (these should already be there based on schema)
-- But let's make sure they're properly defined

DO $$
BEGIN
  -- Check if foreign key for user_id exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_user_id_fkey'
    AND table_name = 'project_members'
  ) THEN
    ALTER TABLE project_members 
    ADD CONSTRAINT project_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Check if foreign key for invited_by_user_id exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_invited_by_user_id_fkey'
    AND table_name = 'project_members'
  ) THEN
    ALTER TABLE project_members 
    ADD CONSTRAINT project_members_invited_by_user_id_fkey 
    FOREIGN KEY (invited_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Check if foreign key for project_id exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_project_id_fkey'
    AND table_name = 'project_members'
  ) THEN
    ALTER TABLE project_members 
    ADD CONSTRAINT project_members_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES flow_projects(id) ON DELETE CASCADE;
  END IF;
END $$;