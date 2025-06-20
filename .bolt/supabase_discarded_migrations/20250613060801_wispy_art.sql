/*
  # Create prompts table with proper schema

  1. New Tables
    - `prompts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text, optional)
      - `content` (text, required)
      - `access` (text, public/private)
      - `created_at` (timestamp)
      - `tags` (text array)
      - `views` (integer)

  2. Security
    - Enable RLS on `prompts` table
    - Add policies for CRUD operations based on user authentication and access level
*/

CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  content text NOT NULL,
  access text NOT NULL DEFAULT 'private' CHECK (access IN ('public', 'private')),
  created_at timestamptz DEFAULT now(),
  tags text[] DEFAULT '{}',
  views integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Policies for prompts table
CREATE POLICY "Public prompts are viewable by everyone"
  ON prompts
  FOR SELECT
  TO public
  USING (access = 'public');

CREATE POLICY "Private prompts are viewable by owner only"
  ON prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND access = 'private');

CREATE POLICY "Users can insert their own prompts"
  ON prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
  ON prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
  ON prompts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can increment views for public prompts"
  ON prompts
  FOR UPDATE
  TO public
  USING (access = 'public')
  WITH CHECK (access = 'public');

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS prompts_user_id_idx ON prompts(user_id);
CREATE INDEX IF NOT EXISTS prompts_access_idx ON prompts(access);
CREATE INDEX IF NOT EXISTS prompts_created_at_idx ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS prompts_views_idx ON prompts(views DESC);