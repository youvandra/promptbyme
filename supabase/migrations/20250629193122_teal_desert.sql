/*
  # Remove Password Protection Feature from Prompts

  1. Changes
    - Drop password_hash column from prompts table
    - Drop is_password_protected column from prompts table
    - Update RLS policies to remove password protection checks

  2. Security
    - Maintain basic public/private access control
    - Remove password protection feature completely
    - Ensure proper dependency handling when dropping columns
*/

-- First drop the policy that depends on the column
DROP POLICY IF EXISTS "Public prompts are viewable by everyone" ON prompts;

-- Now drop the columns
ALTER TABLE prompts DROP COLUMN IF EXISTS password_hash;
ALTER TABLE prompts DROP COLUMN IF EXISTS is_password_protected;

-- Create new policy that simply checks if access is public
CREATE POLICY "Public prompts are viewable by everyone"
  ON prompts
  FOR SELECT
  TO public
  USING (access = 'public');