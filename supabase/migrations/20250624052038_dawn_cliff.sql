/*
  # Add UPDATE policy for flow_connections

  1. Changes
    - Add UPDATE policy for flow_connections table
    - Allow project owners to update connections
    - Allow project members with 'editor' or 'admin' roles to update connections
    - Viewers can only view connections (already implemented)

  2. Security
    - Maintain proper access control for connection updates
    - Only allow authorized users to modify connections
    - Ensure consistent permission model across operations
*/

-- Drop existing UPDATE policy if it exists to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Project members can update connections" ON flow_connections;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if policy doesn't exist
END $$;

-- Create UPDATE policy for flow_connections
CREATE POLICY "Project members can update connections"
  ON flow_connections
  FOR UPDATE
  TO authenticated
  USING (
    -- User is the project owner
    (auth.uid() = (
      SELECT flow_projects.user_id
      FROM flow_projects
      WHERE flow_projects.id = flow_connections.project_id
    ))
    OR
    -- User is a project member with editor or admin role and accepted status
    (EXISTS (
      SELECT 1
      FROM project_members pm
      WHERE pm.project_id = flow_connections.project_id
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
      WHERE flow_projects.id = flow_connections.project_id
    ))
    OR
    -- User is a project member with editor or admin role and accepted status
    (EXISTS (
      SELECT 1
      FROM project_members pm
      WHERE pm.project_id = flow_connections.project_id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
        AND pm.role IN ('admin', 'editor')
    ))
  );