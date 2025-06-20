/*
  # Team Projects Collaboration Feature

  1. New Tables
    - `projects` - Project management with name, description, owner
    - `project_members` - User memberships with roles (owner, editor, viewer)
    - `project_invitations` - Email invitations with secure tokens
    - `project_prompts` - Links prompts to projects with positioning
    - `prompt_comments` - Threaded comments on prompts

  2. Security
    - RLS enabled on all tables
    - Role-based permissions (owner > editor > viewer)
    - Secure invitation system with expiring tokens
    - Project-scoped access control

  3. Performance
    - Optimized indexes for common queries
    - Efficient RLS policies
    - Automatic triggers for data consistency
*/

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false,
  settings jsonb DEFAULT '{}'::jsonb
);

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at timestamptz DEFAULT now(),
  invited_by uuid REFERENCES auth.users(id),
  UNIQUE(project_id, user_id)
);

-- Project invitations table
CREATE TABLE IF NOT EXISTS project_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('editor', 'viewer')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT (gen_random_uuid())::text,
  expires_at timestamptz NOT NULL DEFAULT (now() + '7 days'::interval),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, email)
);

-- Project prompts table (links prompts to projects)
CREATE TABLE IF NOT EXISTS project_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  position integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(project_id, prompt_id)
);

-- Prompt comments table (threaded comments)
CREATE TABLE IF NOT EXISTS prompt_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES prompt_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- PROJECTS POLICIES
CREATE POLICY "Users can view projects they own or are members of"
  ON projects FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR 
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- PROJECT MEMBERS POLICIES
CREATE POLICY "Users can view members of projects they belong to"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm 
      WHERE pm.user_id = auth.uid()
    ) OR
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage all members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Project editors can invite members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can leave projects"
  ON project_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- PROJECT INVITATIONS POLICIES
CREATE POLICY "Project managers can view invitations"
  ON project_invitations FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    ) OR
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project managers can create invitations"
  ON project_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    ) OR
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project managers can delete invitations"
  ON project_invitations FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    ) OR
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')
    )
  );

-- PROJECT PROMPTS POLICIES
CREATE POLICY "Project members can view project prompts"
  ON project_prompts FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm 
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project editors can manage prompts"
  ON project_prompts FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm
      WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')
    )
  );

-- PROMPT COMMENTS POLICIES
CREATE POLICY "Project members can view comments"
  ON prompt_comments FOR SELECT
  TO authenticated
  USING (
    -- Public prompt comments (no project_id)
    (project_id IS NULL AND prompt_id IN (
      SELECT id FROM prompts 
      WHERE access = 'public' OR user_id = auth.uid()
    )) OR
    -- Project-specific comments
    (project_id IN (
      SELECT pm.project_id FROM project_members pm 
      WHERE pm.user_id = auth.uid()
    ))
  );

CREATE POLICY "Project members can create comments"
  ON prompt_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      -- Public prompt comments
      (project_id IS NULL AND prompt_id IN (
        SELECT id FROM prompts 
        WHERE access = 'public' OR user_id = auth.uid()
      )) OR
      -- Project-specific comments
      (project_id IN (
        SELECT pm.project_id FROM project_members pm 
        WHERE pm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can update their own comments"
  ON prompt_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON prompt_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to accept project invitations
CREATE OR REPLACE FUNCTION accept_project_invitation(invitation_token text)
RETURNS jsonb AS $$
DECLARE
  invitation_record project_invitations%ROWTYPE;
  user_email text;
BEGIN
  -- Get current user email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Get invitation
  SELECT * INTO invitation_record 
  FROM project_invitations 
  WHERE token = invitation_token 
    AND email = user_email 
    AND expires_at > now() 
    AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = invitation_record.project_id 
      AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this project');
  END IF;
  
  -- Add user to project
  INSERT INTO project_members (project_id, user_id, role, invited_by)
  VALUES (invitation_record.project_id, auth.uid(), invitation_record.role, invitation_record.invited_by);
  
  -- Mark invitation as accepted
  UPDATE project_invitations 
  SET accepted_at = now() 
  WHERE id = invitation_record.id;
  
  RETURN jsonb_build_object('success', true, 'project_id', invitation_record.project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer project ownership
CREATE OR REPLACE FUNCTION transfer_project_ownership(project_uuid uuid, new_owner_id uuid)
RETURNS jsonb AS $$
DECLARE
  current_owner_id uuid;
BEGIN
  -- Check if current user is the owner
  SELECT owner_id INTO current_owner_id 
  FROM projects 
  WHERE id = project_uuid;
  
  IF current_owner_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only project owner can transfer ownership');
  END IF;
  
  -- Check if new owner is a member
  IF NOT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = new_owner_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'New owner must be a project member');
  END IF;
  
  -- Update project owner
  UPDATE projects SET owner_id = new_owner_id WHERE id = project_uuid;
  
  -- Update member roles
  UPDATE project_members 
  SET role = 'owner' 
  WHERE project_id = project_uuid AND user_id = new_owner_id;
  
  UPDATE project_members 
  SET role = 'editor' 
  WHERE project_id = project_uuid AND user_id = current_owner_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's project role
CREATE OR REPLACE FUNCTION get_user_project_role(project_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  -- Check if user is the owner
  IF EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_uuid AND owner_id = user_uuid
  ) THEN
    RETURN 'owner';
  END IF;
  
  -- Check member role
  SELECT role INTO user_role
  FROM project_members 
  WHERE project_id = project_uuid AND user_id = user_uuid;
  
  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access project
CREATE OR REPLACE FUNCTION can_access_project(project_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_uuid AND owner_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = project_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically add project owner as member
CREATE OR REPLACE FUNCTION add_project_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  DELETE FROM project_invitations 
  WHERE expires_at < now() AND accepted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically add project owner as member
CREATE TRIGGER add_project_owner_trigger
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_owner_as_member();

-- Trigger to update updated_at on projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on comments
CREATE TRIGGER update_prompt_comments_updated_at
  BEFORE UPDATE ON prompt_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(is_archived);

-- Project members indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);
CREATE INDEX IF NOT EXISTS idx_project_members_joined_at ON project_members(joined_at DESC);

-- Project invitations indexes
CREATE INDEX IF NOT EXISTS idx_project_invitations_project ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations(email);
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations(token);
CREATE INDEX IF NOT EXISTS idx_project_invitations_expires ON project_invitations(expires_at);

-- Project prompts indexes
CREATE INDEX IF NOT EXISTS idx_project_prompts_project ON project_prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_prompts_prompt ON project_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_project_prompts_position ON project_prompts(project_id, position);
CREATE INDEX IF NOT EXISTS idx_project_prompts_status ON project_prompts(status);

-- Prompt comments indexes
CREATE INDEX IF NOT EXISTS idx_prompt_comments_prompt ON prompt_comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_project ON prompt_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_parent ON prompt_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_user ON prompt_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_created ON prompt_comments(created_at DESC);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant table permissions
GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_members TO authenticated;
GRANT ALL ON project_invitations TO authenticated;
GRANT ALL ON project_prompts TO authenticated;
GRANT ALL ON prompt_comments TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION accept_project_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_project_ownership(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_project_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_project_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_project(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO authenticated;

-- Clean up any expired invitations on deployment
SELECT cleanup_expired_invitations();