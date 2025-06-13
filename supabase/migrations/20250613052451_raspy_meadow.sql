/*
  # Add view counter to prompts table

  1. New Columns
    - `views` (integer, default 0) - tracks how many times a prompt has been viewed

  2. Security
    - Add policy to allow incrementing view count for public prompts
    - Create index for better performance on views column

  3. Changes
    - Adds view tracking functionality to existing prompts table
*/

-- Add views column to prompts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'views'
  ) THEN
    ALTER TABLE prompts ADD COLUMN views integer DEFAULT 0;
  END IF;
END $$;

-- Create index for views column
CREATE INDEX IF NOT EXISTS prompts_views_idx ON prompts(views DESC);

-- Drop the policy if it exists and recreate it
DROP POLICY IF EXISTS "Anyone can increment views for public prompts" ON prompts;

-- Policy to allow incrementing view count for public prompts
CREATE POLICY "Anyone can increment views for public prompts"
  ON prompts
  FOR UPDATE
  USING (access = 'public')
  WITH CHECK (access = 'public');