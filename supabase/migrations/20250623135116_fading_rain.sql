/*
  # Add Project Visibility to flow_projects

  1. Changes
    - Add visibility column to flow_projects table if it doesn't exist
    - Set default visibility to 'private'
    - Add check constraint to ensure valid values

  2. Security
    - Update RLS policies to respect visibility settings
    - Allow viewing public projects
    - Maintain existing permissions for private projects
*/

-- Add visibility column to flow_projects if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flow_projects' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE flow_projects ADD COLUMN visibility text NOT NULL DEFAULT 'private' 
      CHECK (visibility IN ('private', 'team', 'public'));
  END IF;
END $$;

-- Create or replace policy for viewing public projects
DROP POLICY IF EXISTS "Users can view public projects" ON flow_projects;
CREATE POLICY "Users can view public projects"
  ON flow_projects
  FOR SELECT
  TO authenticated
  USING (visibility = 'public');

-- Create or replace policy for viewing nodes in public projects
DROP POLICY IF EXISTS "Users can view nodes in public projects" ON flow_nodes;
CREATE POLICY "Users can view nodes in public projects"
  ON flow_nodes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = flow_nodes.project_id
      AND flow_projects.visibility = 'public'
    )
  );

-- Create or replace policy for viewing connections in public projects
DROP POLICY IF EXISTS "Users can view connections in public projects" ON flow_connections;
CREATE POLICY "Users can view connections in public projects"
  ON flow_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flow_projects
      WHERE flow_projects.id = flow_connections.project_id
      AND flow_projects.visibility = 'public'
    )
  );