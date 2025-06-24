/*
  # Add UPDATE policy for flow_nodes table

  1. Changes
    - Add a dedicated UPDATE policy for flow_nodes table
    - Allow project owners and members with editor/admin roles to update nodes
    - This fixes the issue where node positions don't persist after repositioning

  2. Security
    - Only project owners and members with appropriate roles can update nodes
    - Maintains existing security model
    - Uses auth.uid() for proper authentication
*/

-- Drop existing UPDATE policy if it exists to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Project members can update nodes" ON flow_nodes;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if policy doesn't exist
END $$;

-- Create UPDATE policy for flow_nodes
CREATE POLICY "Project members can update nodes"
  ON flow_nodes
  FOR UPDATE
  TO authenticated
  USING (
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
  )
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