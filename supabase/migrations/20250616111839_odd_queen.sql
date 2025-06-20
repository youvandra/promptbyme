/*
  # Remove unused database tables

  This migration removes tables that are not being used in the current application.
  
  ## Tables to Remove
  - `prompt_comments` - commenting feature not implemented
  - `project_prompts` - project management not implemented  
  - `project_invitations` - project invitations not implemented
  - `project_members` - project membership not implemented
  - `projects` - project management not implemented
  
  ## Tables to Keep
  - `users` - user profiles (actively used)
  - `prompts` - prompt storage (actively used)
  - `likes` - prompt likes (actively used)
*/

-- Remove tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS prompt_comments CASCADE;
DROP TABLE IF EXISTS project_prompts CASCADE;
DROP TABLE IF EXISTS project_invitations CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Remove unused functions
DROP FUNCTION IF EXISTS accept_project_invitation(text) CASCADE;
DROP FUNCTION IF EXISTS transfer_project_ownership(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_project_role(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS add_project_owner_as_member() CASCADE;