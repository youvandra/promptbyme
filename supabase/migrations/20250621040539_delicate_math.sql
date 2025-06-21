/*
  # Fix flow_nodes INSERT policy

  1. Security Changes
    - Drop existing restrictive INSERT policy on flow_nodes table
    - Create new INSERT policy that allows:
      - Project owners to create nodes in their projects
      - Project members with 'admin' or 'editor' roles to create nodes
    - Ensure proper access control for node creation

  2. Policy Logic
    - Check if user is the project owner (user_id matches in flow_projects)
    - OR check if user is a project member with admin/editor role and accepted status
    - This allows collaborative editing while maintaining security
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can manage nodes in their projects" ON flow_nodes;

-- Create comprehensive policy for all operations on flow_nodes
CREATE POLICY "Project members can manage nodes"
  ON flow_nodes
  FOR ALL
  TO authenticated
  USING (
    -- User is project owner
    auth.uid() = (
      SELECT user_id 
      FROM flow_projects 
      WHERE id = flow_nodes.project_id
    )
    OR
    -- User is project member with admin or editor role
    EXISTS (
      SELECT 1 
      FROM project_members pm 
      WHERE pm.project_id = flow_nodes.project_id 
        AND pm.user_id = auth.uid() 
        AND pm.status = 'accepted' 
        AND pm.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    -- Same check for INSERT/UPDATE operations
    auth.uid() = (
      SELECT user_id 
      FROM flow_projects 
      WHERE id = flow_nodes.project_id
    )
    OR
    EXISTS (
      SELECT 1 
      FROM project_members pm 
      WHERE pm.project_id = flow_nodes.project_id 
        AND pm.user_id = auth.uid() 
        AND pm.status = 'accepted' 
        AND pm.role IN ('admin', 'editor')
    )
  );

-- Create separate SELECT policy for viewers
CREATE POLICY "Project members can view nodes"
  ON flow_nodes
  FOR SELECT
  TO authenticated
  USING (
    -- User is project owner
    auth.uid() = (
      SELECT user_id 
      FROM flow_projects 
      WHERE id = flow_nodes.project_id
    )
    OR
    -- User is project member (any role including viewer)
    EXISTS (
      SELECT 1 
      FROM project_members pm 
      WHERE pm.project_id = flow_nodes.project_id 
        AND pm.user_id = auth.uid() 
        AND pm.status = 'accepted'
    )
    OR
    -- Project is public
    EXISTS (
      SELECT 1 
      FROM flow_projects fp 
      WHERE fp.id = flow_nodes.project_id 
        AND fp.visibility = 'public'
    )
  );