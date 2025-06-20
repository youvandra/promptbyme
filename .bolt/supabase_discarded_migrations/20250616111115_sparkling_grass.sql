-- ============================================================================
-- ENSURE ALL TABLES EXIST WITH PROPER STRUCTURE
-- ============================================================================

-- Ensure projects table exists with all required columns
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

-- Ensure project_members table exists
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at timestamptz DEFAULT now(),
  invited_by uuid REFERENCES auth.users(id),
  UNIQUE(project_id, user_id)
);

-- Ensure project_invitations table exists
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

-- Ensure project_prompts table exists
CREATE TABLE IF NOT EXISTS project_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  position integer DEFAULT 0,
  UNIQUE(project_id, prompt_id)
);

-- Ensure prompt_comments table exists
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
  is_deleted boolean DEFAULT false
);

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP ALL EXISTING POLICIES TO START FRESH
-- ============================================================================

-- Projects policies
DROP POLICY IF EXISTS "Project owners can view their projects" ON projects;
DROP POLICY IF EXISTS "Project members can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;

-- Project members policies
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Users can view members of accessible projects" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
DROP POLICY IF EXISTS "Project editors can invite members" ON project_members;
DROP POLICY IF EXISTS "Users can leave projects" ON project_members;

-- Project invitations policies
DROP POLICY IF EXISTS "Users can view project invitations" ON project_invitations;
DROP POLICY IF EXISTS "Project managers can create invitations" ON project_invitations;
DROP POLICY IF EXISTS "Project managers can delete invitations" ON project_invitations;

-- Project prompts policies
DROP POLICY IF EXISTS "Users can view project prompts" ON project_prompts;
DROP POLICY IF EXISTS "Project editors can manage prompts" ON project_prompts;

-- Prompt comments policies
DROP POLICY IF EXISTS "Users can view prompt comments" ON prompt_comments;
DROP POLICY IF EXISTS "Users can create prompt comments" ON prompt_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON prompt_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON prompt_comments;

-- ============================================================================
-- CREATE COMPREHENSIVE RLS POLICIES
-- ============================================================================

-- PROJECTS TABLE POLICIES
-- Users can view projects they own
CREATE POLICY "Project owners can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Users can view projects they are members of
CREATE POLICY "Project members can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create projects
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Project owners can update their projects
CREATE POLICY "Project owners can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Project owners can delete their projects
CREATE POLICY "Project owners can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- PROJECT MEMBERS TABLE POLICIES
-- Users can view members of projects they belong to
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id
      FROM project_members pm
      WHERE pm.user_id = auth.uid()
    )
  );

-- Project owners can manage all member operations
CREATE POLICY "Project owners can manage members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND p.owner_id = auth.uid()
    )
  );

-- Project editors can invite new members
CREATE POLICY "Project editors can invite members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
  );

-- Users can leave projects (remove their own membership)
CREATE POLICY "Users can leave projects"
  ON project_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- PROJECT INVITATIONS TABLE POLICIES
-- Users can view invitations for projects they can manage
CREATE POLICY "Users can view project invitations"
  ON project_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
  );

-- Project owners and editors can create invitations
CREATE POLICY "Project managers can create invitations"
  ON project_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
  );

-- Project owners and editors can delete invitations
CREATE POLICY "Project managers can delete invitations"
  ON project_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_id 
      AND p.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
  );

-- PROJECT PROMPTS TABLE POLICIES
-- Users can view project prompts for accessible projects
CREATE POLICY "Users can view project prompts"
  ON project_prompts FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT pm.project_id
      FROM project_members pm
      WHERE pm.user_id = auth.uid()
    )
  );

-- Project editors and owners can manage prompts
CREATE POLICY "Project editors can manage prompts"
  ON project_prompts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'editor')
    )
  );

-- PROMPT COMMENTS TABLE POLICIES
-- Users can view comments for accessible prompts
CREATE POLICY "Users can view prompt comments"
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
      SELECT pm.project_id
      FROM project_members pm
      WHERE pm.user_id = auth.uid()
    ))
  );

-- Users can create comments on accessible prompts
CREATE POLICY "Users can create prompt comments"
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
        SELECT pm.project_id
        FROM project_members pm
        WHERE pm.user_id = auth.uid()
      ))
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON prompt_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
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

-- Function to get user's project role (single signature to avoid conflicts)
CREATE OR REPLACE FUNCTION get_user_project_role(project_uuid uuid, user_uuid uuid)
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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically add project owner as member
DROP TRIGGER IF EXISTS add_project_owner_trigger ON projects;
CREATE TRIGGER add_project_owner_trigger
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_owner_as_member();

-- Trigger to update updated_at on projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on comments
DROP TRIGGER IF EXISTS update_prompt_comments_updated_at ON prompt_comments;
CREATE TRIGGER update_prompt_comments_updated_at
  BEFORE UPDATE ON prompt_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPREHENSIVE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(is_archived);

-- Project members indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_project ON project_members(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Project invitations indexes
CREATE INDEX IF NOT EXISTS idx_project_invitations_project ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations(email);
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations(token);
CREATE INDEX IF NOT EXISTS idx_project_invitations_expires ON project_invitations(expires_at);

-- Project prompts indexes
CREATE INDEX IF NOT EXISTS idx_project_prompts_project ON project_prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_prompts_prompt ON project_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_project_prompts_position ON project_prompts(project_id, position);

-- Prompt comments indexes
CREATE INDEX IF NOT EXISTS idx_prompt_comments_prompt ON prompt_comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_project ON prompt_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_parent ON prompt_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_created ON prompt_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_comments_user ON prompt_comments(user_id);

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_members TO authenticated;
GRANT ALL ON project_invitations TO authenticated;
GRANT ALL ON project_prompts TO authenticated;
GRANT ALL ON prompt_comments TO authenticated;

-- Grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION accept_project_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_project_ownership(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_project_role(uuid, uuid) TO authenticated;

-- ============================================================================
-- VERIFY DATA INTEGRITY
-- ============================================================================

-- Ensure all existing projects have their owners as members
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, p.owner_id, 'owner'
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_members pm 
  WHERE pm.project_id = p.id AND pm.user_id = p.owner_id
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Clean up expired invitations
DELETE FROM project_invitations 
WHERE expires_at < now() AND accepted_at IS NULL;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Verify all tables have RLS enabled
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('projects', 'project_members', 'project_invitations', 'project_prompts', 'prompt_comments')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = table_name
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
    ) THEN
      RAISE EXCEPTION 'RLS not enabled on table: %', table_name;
    END IF;
  END LOOP;
END $$;