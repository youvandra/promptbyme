/*
  # Add views counter to prompts table

  1. Schema Changes
    - Add `views` column to `prompts` table with default value of 0
    - Create index for better performance on views column

  2. Security
    - Add policy to allow anonymous users to increment view count for public prompts
    - Ensure view counter can be updated without authentication for public prompts
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

-- Policy to allow incrementing view count for public prompts
CREATE POLICY IF NOT EXISTS "Anyone can increment views for public prompts"
  ON prompts
  FOR UPDATE
  USING (access = 'public')
  WITH CHECK (access = 'public');