/*
  # Remove unused database tables

  This migration removes tables that are not being used in the current application:
  
  ## Tables to Remove
  1. `prompt_comments` - commenting feature not implemented
  2. `project_prompts` - project management not implemented  
  3. `project_invitations` - project invitations not implemented
  4. `project_members` - project membership not implemented
  5. `projects` - project management not implemented
  
  ## Tables to Keep
  1. `users` - user profiles (actively used)
  2. `prompts` - prompt storage (actively used)
  3. `likes` - prompt likes (actively used)
  
  ## Functions to Remove
  - `add_project_owner_as_member()` - related to projects
  - `update_prompt_fork_count()` - can be simplified or removed if not needed
  
  Note: This will also remove all related triggers, policies, and constraints.
*/

-- Remove tables in correct order (respecting foreign key dependencies)

-- 1. Remove prompt_comments table
DROP TABLE IF EXISTS prompt_comments CASCADE;

-- 2. Remove project_prompts table  
DROP TABLE IF EXISTS project_prompts CASCADE;

-- 3. Remove project_invitations table
DROP TABLE IF EXISTS project_invitations CASCADE;

-- 4. Remove project_members table
DROP TABLE IF EXISTS project_members CASCADE;

-- 5. Remove projects table
DROP TABLE IF EXISTS projects CASCADE;

-- Remove unused functions
DROP FUNCTION IF EXISTS add_project_owner_as_member() CASCADE;

-- Note: Keeping update_prompt_fork_count() and update_prompt_like_count() 
-- as they are used by the prompts and likes tables

-- Clean up any orphaned policies or triggers
-- (CASCADE should handle this, but being explicit)

-- Verify remaining tables
DO $$
BEGIN
  RAISE NOTICE 'Remaining tables after cleanup:';
  RAISE NOTICE '- users: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public');
  RAISE NOTICE '- prompts: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'prompts' AND table_schema = 'public');  
  RAISE NOTICE '- likes: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'likes' AND table_schema = 'public');
END $$;