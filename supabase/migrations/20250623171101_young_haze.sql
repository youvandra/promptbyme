/*
  # Fix flow_nodes policies

  1. Changes
    - Drop existing INSERT policies on flow_nodes table
    - Also drop the "Project members can manage nodes" policy
    - Create new INSERT policy that allows:
      - Project owners to insert nodes in their projects
      - Project members with editor/admin roles to insert nodes
    - Use auth.uid() for proper authentication

  2. Security
    - Maintain proper access control for node creation
    - Only allow authorized users to create nodes
    - Ensure consistent permission model across operations
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert nodes in their projects" ON flow_nodes;
DROP POLICY IF EXISTS "Project members can insert nodes" ON flow_nodes;
DROP POLICY IF EXISTS "Project members can manage nodes" ON flow_nodes;

-- Create comprehensive INSERT policy for flow_nodes
CREATE POLICY "Project members can insert nodes"
  ON flow_nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is the project owner
    (auth.uid() = (
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
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
        AND pm.role IN ('admin', 'editor')
    ))
  );