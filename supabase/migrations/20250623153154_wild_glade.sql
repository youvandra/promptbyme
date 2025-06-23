/*
  # Add RLS Policy for Viewing Shared Projects

  1. New Policies
    - Add policy to allow users to view projects where they are members
    - This fixes the issue where users can't see shared projects they've accepted

  2. Security
    - Only allows viewing projects where the user is an accepted member
    - Maintains existing policies for project owners and public projects
    - Properly scoped to prevent unauthorized access

  3. Changes
    - Drops existing policy if it exists to avoid conflicts
    - Creates new policy with proper conditions
*/

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can view projects they are members of" ON flow_projects;

-- Create policy to allow users to view projects where they are members
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