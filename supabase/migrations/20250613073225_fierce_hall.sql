/*
  # Add likes feature for prompts

  1. New Tables
    - `likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `prompt_id` (uuid, references prompts)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `likes` table
    - Add policies for authenticated users to manage their likes
    - Add policy to view like counts for public prompts

  3. Indexes
    - Add indexes for performance on user_id, prompt_id, and composite queries
*/

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Create policies for likes
CREATE POLICY "Users can view all likes for public prompts"
  ON likes
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = likes.prompt_id 
      AND prompts.access = 'public'
    )
  );

CREATE POLICY "Authenticated users can insert their own likes"
  ON likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);
CREATE INDEX IF NOT EXISTS likes_prompt_id_idx ON likes(prompt_id);
CREATE INDEX IF NOT EXISTS likes_user_prompt_idx ON likes(user_id, prompt_id);
CREATE INDEX IF NOT EXISTS likes_created_at_idx ON likes(created_at DESC);

-- Add like_count column to prompts table for denormalized counting
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE prompts ADD COLUMN like_count integer DEFAULT 0;
  END IF;
END $$;

-- Create function to update like count
CREATE OR REPLACE FUNCTION update_prompt_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE prompts 
    SET like_count = like_count + 1 
    WHERE id = NEW.prompt_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE prompts 
    SET like_count = GREATEST(like_count - 1, 0) 
    WHERE id = OLD.prompt_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update like count
DROP TRIGGER IF EXISTS update_prompt_like_count_trigger ON likes;
CREATE TRIGGER update_prompt_like_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_like_count();

-- Initialize like counts for existing prompts
UPDATE prompts 
SET like_count = (
  SELECT COUNT(*) 
  FROM likes 
  WHERE likes.prompt_id = prompts.id
);