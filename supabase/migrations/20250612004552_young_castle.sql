/*
  # Create prompts table for AI prompt sharing

  1. New Tables
    - `prompts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, optional prompt title)
      - `content` (text, the actual prompt content)
      - `access` (text, 'public' or 'private')
      - `created_at` (timestamp)
      - `tags` (text array, optional tags)

  2. Security
    - Enable RLS on `prompts` table
    - Add policies for public/private access
    - Users can only modify their own prompts
*/

CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  access text NOT NULL DEFAULT 'private' CHECK (access IN ('public', 'private')),
  created_at timestamptz DEFAULT now(),
  tags text[] DEFAULT '{}'
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Policy for reading public prompts (anyone can see)
CREATE POLICY "Public prompts are viewable by everyone"
  ON prompts
  FOR SELECT
  USING (access = 'public');

-- Policy for reading private prompts (only owner)
CREATE POLICY "Private prompts are viewable by owner only"
  ON prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND access = 'private');

-- Policy for inserting prompts (authenticated users only)
CREATE POLICY "Users can insert their own prompts"
  ON prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating prompts (only owner)
CREATE POLICY "Users can update their own prompts"
  ON prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for deleting prompts (only owner)
CREATE POLICY "Users can delete their own prompts"
  ON prompts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS prompts_user_id_idx ON prompts(user_id);
CREATE INDEX IF NOT EXISTS prompts_access_idx ON prompts(access);
CREATE INDEX IF NOT EXISTS prompts_created_at_idx ON prompts(created_at DESC);