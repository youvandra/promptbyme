/*
  # Fix infinite recursion in flow_projects RLS policy

  1. Problem
    - The "Users can view team projects they are members of" policy is causing infinite recursion
    - The policy references flow_projects table within its own policy evaluation

  2. Solution
    - Drop the problematic policy
    - Create a simplified policy that avoids circular references
    - Ensure the policy logic is direct and doesn't create recursive lookups

  3. Changes
    - Remove existing team project visibility policy
    - Add new simplified team project visibility policy
*/

-- Drop the problematic policy that's causing infinite recursion
DROP POLICY IF EXISTS "Users can view team projects they are members of" ON flow_projects;

-- Create a new, simplified policy for team project visibility
-- This policy directly checks project_members without referencing flow_projects
CREATE POLICY "Users can view team projects they are members of"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'team' AND 
    EXISTS (
      SELECT 1 
      FROM project_members pm 
      WHERE pm.project_id = flow_projects.id 
        AND pm.user_id = auth.uid() 
        AND pm.status = 'accepted'
    )
  );