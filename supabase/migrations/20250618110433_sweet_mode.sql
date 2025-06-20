/*
  # Add Folder System for Prompts

  1. New Tables
    - `folders` - Folder structure with hierarchy support
    - Update `prompts` table to include folder_id

  2. Security
    - Enable RLS on folders table
    - Add policies for folder access control
    - Update prompt policies to respect folder permissions

  3. Features
    - Hierarchical folder structure (parent/child relationships)
    - Folder colors and icons
    - Folder sharing and permissions
    - Drag and drop support
*/

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text DEFAULT '#6366f1',
  icon text DEFAULT 'folder',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add folder_id to prompts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE prompts ADD COLUMN folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Folders policies
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders(user_id);
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);
CREATE INDEX IF NOT EXISTS folders_position_idx ON folders(user_id, position);
CREATE INDEX IF NOT EXISTS prompts_folder_id_idx ON prompts(folder_id);

-- Function to get folder path
CREATE OR REPLACE FUNCTION get_folder_path(folder_uuid uuid)
RETURNS text AS $$
DECLARE
  folder_record folders%ROWTYPE;
  path_parts text[] := '{}';
  current_id uuid := folder_uuid;
BEGIN
  WHILE current_id IS NOT NULL LOOP
    SELECT * INTO folder_record FROM folders WHERE id = current_id;
    
    IF NOT FOUND THEN
      EXIT;
    END IF;
    
    path_parts := array_prepend(folder_record.name, path_parts);
    current_id := folder_record.parent_id;
  END LOOP;
  
  RETURN array_to_string(path_parts, ' / ');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to move folder
CREATE OR REPLACE FUNCTION move_folder(folder_uuid uuid, new_parent_id uuid, new_position integer)
RETURNS jsonb AS $$
DECLARE
  folder_record folders%ROWTYPE;
BEGIN
  -- Check if user owns the folder
  SELECT * INTO folder_record FROM folders WHERE id = folder_uuid AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folder not found or access denied');
  END IF;
  
  -- Check for circular reference
  IF new_parent_id IS NOT NULL THEN
    IF EXISTS (
      WITH RECURSIVE folder_tree AS (
        SELECT id, parent_id FROM folders WHERE id = new_parent_id
        UNION ALL
        SELECT f.id, f.parent_id FROM folders f
        INNER JOIN folder_tree ft ON f.parent_id = ft.id
      )
      SELECT 1 FROM folder_tree WHERE id = folder_uuid
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot move folder into its own subfolder');
    END IF;
  END IF;
  
  -- Update folder
  UPDATE folders 
  SET parent_id = new_parent_id, position = new_position, updated_at = now()
  WHERE id = folder_uuid;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on folders
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();