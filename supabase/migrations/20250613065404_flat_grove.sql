/*
  # Remove user_profiles table

  1. Changes
    - Drop user_profiles table and all its dependencies
    - Update prompts table to reference auth.users directly
    - Clean up any foreign key constraints
    - Remove any triggers or functions related to user profiles

  2. Security
    - Maintain existing RLS policies on prompts table
    - Ensure prompts still work with auth.users
*/

-- Drop the user_profiles table and all its dependencies
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Update prompts table to ensure it references auth.users correctly
-- (This should already be the case, but let's make sure)
DO $$
BEGIN
  -- Check if the foreign key constraint exists and drop it if it does
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'prompts_user_id_fkey' 
    AND table_name = 'prompts'
  ) THEN
    ALTER TABLE prompts DROP CONSTRAINT prompts_user_id_fkey;
  END IF;
  
  -- Add the correct foreign key constraint to auth.users
  ALTER TABLE prompts ADD CONSTRAINT prompts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignore if constraint already exists
END $$;

-- Drop any functions related to user profiles
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;