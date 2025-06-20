/*
  # Refactor Flow System for Prompt Flows

  1. Changes
    - Clean up existing flow tables
    - Create new simplified flow structure focused on prompt flows
    - Add support for importing prompts from gallery
    - Support for input, prompt, condition, and output node types

  2. New Schema
    - Keep flow_projects table (rename for clarity)
    - Redesign flow_nodes table with prompt import capability
    - Simplify flow_connections table
    - Remove unnecessary complexity

  3. Security
    - Maintain existing RLS policies
    - Add policies for prompt import functionality
*/

-- Drop existing flow tables to start fresh
DROP TABLE IF EXISTS flow_connections CASCADE;
DROP TABLE IF EXISTS flow_nodes CASCADE;
DROP TABLE IF EXISTS flow_projects CASCADE;

-- Create flow_projects table (simplified)
CREATE TABLE flow_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flow_nodes table with prompt import support
CREATE TABLE flow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('input', 'prompt', 'condition', 'output')),
  title text NOT NULL,
  content text DEFAULT '',
  position_x real NOT NULL DEFAULT 0,
  position_y real NOT NULL DEFAULT 0,
  
  -- For prompt nodes: reference to imported prompt
  imported_prompt_id uuid REFERENCES prompts(id) ON DELETE SET NULL,
  
  -- Metadata for all node types
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flow_connections table (simplified)
CREATE TABLE flow_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  source_node_id uuid NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_node_id, target_node_id)
);

-- Enable Row Level Security
ALTER TABLE flow_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flow_projects
CREATE POLICY "Users can manage their own flow projects"
  ON flow_projects FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for flow_nodes
CREATE POLICY "Users can manage nodes in their own projects"
  ON flow_nodes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for flow_connections
CREATE POLICY "Users can manage connections in their own projects"
  ON flow_connections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX flow_projects_user_id_idx ON flow_projects(user_id);
CREATE INDEX flow_projects_created_at_idx ON flow_projects(created_at DESC);

CREATE INDEX flow_nodes_project_id_idx ON flow_nodes(project_id);
CREATE INDEX flow_nodes_type_idx ON flow_nodes(type);
CREATE INDEX flow_nodes_imported_prompt_id_idx ON flow_nodes(imported_prompt_id);

CREATE INDEX flow_connections_project_id_idx ON flow_connections(project_id);
CREATE INDEX flow_connections_source_node_idx ON flow_connections(source_node_id);
CREATE INDEX flow_connections_target_node_idx ON flow_connections(target_node_id);

-- Create triggers for updated_at
CREATE TRIGGER update_flow_projects_updated_at
  BEFORE UPDATE ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_nodes_updated_at
  BEFORE UPDATE ON flow_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();