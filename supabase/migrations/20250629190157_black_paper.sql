/*
  # Add Password Protection to Prompts

  1. New Columns
    - `password_hash` (text, nullable) - Stores the hashed password for protected prompts
    - `is_password_protected` (boolean, default false) - Indicates if a prompt requires a password

  2. Security
    - Update RLS policies to handle password-protected prompts
    - Only owners can see their own password-protected prompts without verification
    - Public prompts that are password-protected require verification
*/

-- Add password_hash column to prompts table
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS password_hash text;

-- Add is_password_protected column to prompts table
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS is_password_protected boolean DEFAULT false;

-- Update RLS policies for prompts table
-- Drop existing policy for public prompts
DROP POLICY IF EXISTS "Public prompts are viewable by everyone" ON prompts;

-- Create new policy that excludes password-protected prompts for public viewing
CREATE POLICY "Public prompts are viewable by everyone"
  ON prompts
  FOR SELECT
  TO public
  USING (access = 'public' AND (is_password_protected = false OR is_password_protected IS NULL));

-- Private prompts policy remains unchanged as it's already restricted to owners