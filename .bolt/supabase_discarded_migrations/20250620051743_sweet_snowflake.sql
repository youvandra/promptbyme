-- Drop existing problematic policies that cause infinite recursion
DO $$
BEGIN
  -- Drop policies on project_members
  DROP POLICY IF EXISTS "Members can view project members" ON project_members;
  DROP POLICY IF EXISTS "Admins can invite members" ON project_members;
  DROP POLICY IF EXISTS "Members can update their status" ON project_members;
  DROP POLICY IF EXISTS "Members can leave projects" ON project_members;
  DROP POLICY IF EXISTS "Users can view own membership" ON project_members;
  DROP POLICY IF EXISTS "Admins can manage members" ON project_members;
  DROP POLICY IF EXISTS "Users can update own membership" ON project_members;
  DROP POLICY IF EXISTS "Users can leave projects" ON project_members;
  DROP POLICY IF EXISTS "Admins can remove members" ON project_members;
  
  -- Drop policies on flow_projects if they exist
  DROP POLICY IF EXISTS "Users can view accessible projects" ON flow_projects;
  DROP POLICY IF EXISTS "Project owners can view their projects" ON flow_projects;
  DROP POLICY IF EXISTS "Project members can view their projects" ON flow_projects;
  
  -- Drop helper functions that might be causing issues
  DROP FUNCTION IF EXISTS can_view_project(uuid);
  DROP FUNCTION IF EXISTS can_edit_project(uuid);
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if objects don't exist
END $$;

-- Create new helper functions with better implementation to avoid recursion
CREATE OR REPLACE FUNCTION can_view_project(project_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  project_visibility text;
  is_owner boolean;
  is_member boolean;
BEGIN
  -- Get project visibility and check if user is owner
  SELECT 
    p.visibility, 
    p.user_id = auth.uid()
  INTO 
    project_visibility, 
    is_owner
  FROM flow_projects p
  WHERE p.id = project_uuid;
  
  -- If project not found, return false
  IF project_visibility IS NULL THEN
    RETURN false;
  END IF;
  
  -- If user is owner, they can view
  IF is_owner THEN
    RETURN true;
  END IF;
  
  -- If project is public, anyone can view
  IF project_visibility = 'public' THEN
    RETURN true;
  END IF;
  
  -- Check if user is a member
  SELECT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_uuid
    AND pm.user_id = auth.uid()
    AND pm.status = 'accepted'
  ) INTO is_member;
  
  -- If project is team and user is member, or user is member of private project
  RETURN (project_visibility = 'team' AND is_member) OR (project_visibility = 'private' AND is_member);
END;
$$;

CREATE OR REPLACE FUNCTION can_edit_project(project_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  is_owner boolean;
  is_editor boolean;
BEGIN
  -- Check if user is owner
  SELECT user_id = auth.uid()
  INTO is_owner
  FROM flow_projects
  WHERE id = project_uuid;
  
  -- If user is owner, they can edit
  IF is_owner THEN
    RETURN true;
  END IF;
  
  -- Check if user is admin or editor
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = project_uuid
    AND user_id = auth.uid()
    AND role IN ('admin', 'editor')
    AND status = 'accepted'
  ) INTO is_editor;
  
  RETURN is_editor;
END;
$$;

-- Create simplified policies for flow_projects
CREATE POLICY "Users can view their own projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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

CREATE POLICY "Users can view public projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

-- Create simplified policies for project_members
CREATE POLICY "Users can view their own memberships"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view members of projects they belong to"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND status = 'accepted'
    )
  );

CREATE POLICY "Admins can invite members"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by_user_id = auth.uid() AND
    (
      -- User is project owner
      EXISTS (
        SELECT 1 FROM flow_projects
        WHERE id = project_id
        AND user_id = auth.uid()
      ) OR
      -- User is project admin
      EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = project_members.project_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND status = 'accepted'
      )
    )
  );

CREATE POLICY "Users can update their own membership"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update member roles"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can leave projects"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can remove members"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE id = project_id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = project_members.project_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'accepted'
    )
  );

-- Grant necessary permissions for the helper functions
GRANT EXECUTE ON FUNCTION can_view_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_edit_project(uuid) TO authenticated;