/*
  # Team Project Collaboration Feature

  1. New Tables
    - `projects` - Team projects with metadata
    - `project_members` - Project membership with roles
    - `project_invitations` - Pending invitations to join projects
    - `project_prompts` - Prompts associated with projects
    - `prompt_comments` - Threaded comments on prompts

  2. Security
    - Enable RLS on all new tables
    - Role-based access policies
    - Secure invitation system

  3. Functions
    - Project invitation handling
    - Member management
    - Comment threading
*/

-- Create projects table
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

-- Create project members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at timestamptz DEFAULT now(),
  invited_by uuid REFERENCES auth.users(id),
  UNIQUE(project_id, user_id)
);

-- Create project invitations table
CREATE TABLE IF NOT EXISTS project_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('editor', 'viewer')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, email)
);

-- Create project prompts table (links prompts to projects)
CREATE TABLE IF NOT EXISTS project_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  position integer DEFAULT 0,
  UNIQUE(project_id, prompt_id)
);

-- Create prompt comments table
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

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_comments ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Project owners can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Project members policies
CREATE POLICY "Users can view project members for their projects"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Project invitations policies
CREATE POLICY "Users can view invitations for their projects"
  ON project_invitations FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project owners and editors can create invitations"
  ON project_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Project prompts policies
CREATE POLICY "Users can view project prompts for their projects"
  ON project_prompts FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project editors can manage prompts"
  ON project_prompts FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

-- Prompt comments policies
CREATE POLICY "Users can view comments for accessible prompts"
  ON prompt_comments FOR SELECT
  TO authenticated
  USING (
    (project_id IS NULL AND prompt_id IN (
      SELECT id FROM prompts WHERE access = 'public' OR user_id = auth.uid()
    )) OR
    (project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create comments on accessible prompts"
  ON prompt_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      (project_id IS NULL AND prompt_id IN (
        SELECT id FROM prompts WHERE access = 'public' OR user_id = auth.uid()
      )) OR
      (project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can update their own comments"
  ON prompt_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS projects_owner_id_idx ON projects(owner_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS project_members_project_id_idx ON project_members(project_id);
CREATE INDEX IF NOT EXISTS project_members_user_id_idx ON project_members(user_id);
CREATE INDEX IF NOT EXISTS project_members_role_idx ON project_members(role);

CREATE INDEX IF NOT EXISTS project_invitations_project_id_idx ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS project_invitations_email_idx ON project_invitations(email);
CREATE INDEX IF NOT EXISTS project_invitations_token_idx ON project_invitations(token);
CREATE INDEX IF NOT EXISTS project_invitations_expires_at_idx ON project_invitations(expires_at);

CREATE INDEX IF NOT EXISTS project_prompts_project_id_idx ON project_prompts(project_id);
CREATE INDEX IF NOT EXISTS project_prompts_prompt_id_idx ON project_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS project_prompts_position_idx ON project_prompts(project_id, position);

CREATE INDEX IF NOT EXISTS prompt_comments_prompt_id_idx ON prompt_comments(prompt_id);
CREATE INDEX IF NOT EXISTS prompt_comments_project_id_idx ON prompt_comments(project_id);
CREATE INDEX IF NOT EXISTS prompt_comments_parent_id_idx ON prompt_comments(parent_id);
CREATE INDEX IF NOT EXISTS prompt_comments_created_at_idx ON prompt_comments(created_at DESC);

-- Function to handle project invitation acceptance
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

-- Trigger to automatically add project owner as member
CREATE OR REPLACE FUNCTION add_project_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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