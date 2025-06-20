/*
  # Project Space Database Schema

  1. New Tables
    - `flow_projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `flow_nodes`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to flow_projects)
      - `type` (text: 'prompt', 'condition', 'output')
      - `title` (text)
      - `content` (text)
      - `position_x` (integer)
      - `position_y` (integer)
      - `metadata` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `flow_connections`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to flow_projects)
      - `source_node_id` (uuid, foreign key to flow_nodes)
      - `target_node_id` (uuid, foreign key to flow_nodes)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own projects
    - Add policies for reading/writing nodes and connections
*/

-- Create flow_projects table
CREATE TABLE IF NOT EXISTS flow_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flow_nodes table
CREATE TABLE IF NOT EXISTS flow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('prompt', 'condition', 'output')),
  title text NOT NULL,
  content text DEFAULT '',
  position_x integer NOT NULL DEFAULT 0,
  position_y integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flow_connections table
CREATE TABLE IF NOT EXISTS flow_connections (
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

-- Create policies for flow_projects
CREATE POLICY "Users can create their own projects"
  ON flow_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON flow_projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON flow_projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for flow_nodes
CREATE POLICY "Users can create nodes in their own projects"
  ON flow_nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view nodes in their own projects"
  ON flow_nodes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update nodes in their own projects"
  ON flow_nodes
  FOR UPDATE
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

CREATE POLICY "Users can delete nodes in their own projects"
  ON flow_nodes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- Create policies for flow_connections
CREATE POLICY "Users can create connections in their own projects"
  ON flow_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view connections in their own projects"
  ON flow_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete connections in their own projects"
  ON flow_connections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS flow_projects_user_id_idx ON flow_projects(user_id);
CREATE INDEX IF NOT EXISTS flow_projects_created_at_idx ON flow_projects(created_at DESC);

CREATE INDEX IF NOT EXISTS flow_nodes_project_id_idx ON flow_nodes(project_id);
CREATE INDEX IF NOT EXISTS flow_nodes_type_idx ON flow_nodes(type);

CREATE INDEX IF NOT EXISTS flow_connections_project_id_idx ON flow_connections(project_id);
CREATE INDEX IF NOT EXISTS flow_connections_source_node_idx ON flow_connections(source_node_id);
CREATE INDEX IF NOT EXISTS flow_connections_target_node_idx ON flow_connections(target_node_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_flow_projects_updated_at
  BEFORE UPDATE ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_nodes_updated_at
  BEFORE UPDATE ON flow_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();