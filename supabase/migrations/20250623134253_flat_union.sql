/*
  # Fix flow_nodes INSERT policy

  1. Security Updates
    - Drop existing INSERT policy if it exists
    - Create new INSERT policy that allows:
      - Project owners to insert nodes
      - Project members with editor/admin roles to insert nodes
    - Ensure policy matches the existing SELECT and ALL policies logic

  2. Changes
    - Add proper INSERT policy for flow_nodes table
    - Allow authenticated users to insert nodes in projects they own or have editor/admin access to
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert nodes in their projects" ON flow_nodes;
DROP POLICY IF EXISTS "Project members can insert nodes" ON flow_nodes;

-- Create comprehensive INSERT policy for flow_nodes
CREATE POLICY "Project members can insert nodes"
  ON flow_nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is the project owner
    (uid() = (
      SELECT flow_projects.user_id
      FROM flow_projects
      WHERE flow_projects.id = flow_nodes.project_id
    ))
    OR
    -- User is a project member with editor or admin role and accepted status
    (EXISTS (
      SELECT 1
      FROM project_members pm
      WHERE pm.project_id = flow_nodes.project_id
        AND pm.user_id = uid()
        AND pm.status = 'accepted'
        AND pm.role IN ('admin', 'editor')
    ))
  );