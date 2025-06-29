/*
  # Remove Password Protection Feature from Prompts

  1. Changes
    - Drop password_hash column from prompts table
    - Drop is_password_protected column from prompts table
    - Revert RLS policy for public prompts to original state

  2. Security
    - Maintain basic public/private access control
    - Remove password protection feature completely
*/

-- Drop password-related columns from prompts table
ALTER TABLE prompts DROP COLUMN IF EXISTS password_hash;
ALTER TABLE prompts DROP COLUMN IF EXISTS is_password_protected;

-- Update RLS policies for prompts table
-- Drop existing policy for public prompts
DROP POLICY IF EXISTS "Public prompts are viewable by everyone" ON prompts;

-- Create new policy that simply checks if access is public
CREATE POLICY "Public prompts are viewable by everyone"
  ON prompts
  FOR SELECT
  TO public
  USING (access = 'public');