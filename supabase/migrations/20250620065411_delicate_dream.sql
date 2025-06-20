/*
  # Create prompt_versions table

  1. New Tables
    - `prompt_versions`
      - `id` (uuid, primary key)
      - `prompt_id` (uuid, foreign key to prompts table)
      - `version_number` (integer, version number for the prompt)
      - `title` (text, version title)
      - `content` (text, version content)
      - `commit_message` (text, optional commit message)
      - `created_by` (uuid, foreign key to auth.users)
      - `is_current` (boolean, indicates if this is the current version)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `prompt_versions` table
    - Add policies for authenticated users to manage versions of their own prompts
    - Add policies for public access to versions of public prompts

  3. Indexes
    - Index on prompt_id for efficient version lookups
    - Index on version_number for ordering
    - Index on is_current for finding current versions
*/

CREATE TABLE IF NOT EXISTS prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  title text,
  content text NOT NULL,
  commit_message text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS prompt_versions_prompt_id_idx ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS prompt_versions_version_number_idx ON prompt_versions(prompt_id, version_number);
CREATE INDEX IF NOT EXISTS prompt_versions_is_current_idx ON prompt_versions(prompt_id, is_current);
CREATE INDEX IF NOT EXISTS prompt_versions_created_at_idx ON prompt_versions(created_at DESC);

-- Enable RLS
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

-- Policies for prompt versions
CREATE POLICY "Users can view versions of their own prompts"
  ON prompt_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_versions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view versions of public prompts"
  ON prompt_versions
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_versions.prompt_id 
      AND prompts.access = 'public'
    )
  );

CREATE POLICY "Users can create versions for their own prompts"
  ON prompt_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_versions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update versions of their own prompts"
  ON prompt_versions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_versions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_versions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete versions of their own prompts"
  ON prompt_versions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = prompt_versions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );

-- Function to ensure only one current version per prompt
CREATE OR REPLACE FUNCTION ensure_single_current_version()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a version as current, unset all other versions for this prompt
  IF NEW.is_current = true THEN
    UPDATE prompt_versions 
    SET is_current = false 
    WHERE prompt_id = NEW.prompt_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one current version per prompt
CREATE TRIGGER ensure_single_current_version_trigger
  BEFORE INSERT OR UPDATE ON prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_current_version();