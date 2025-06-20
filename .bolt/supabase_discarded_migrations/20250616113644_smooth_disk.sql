/*
  # Remove Team Project Features

  1. Drop Tables
    - Drop all project-related tables in correct order
    - Remove all functions, triggers, and views
    - Clean up any remaining dependencies

  2. Clean Database
    - Remove all team project functionality
    - Keep core prompt features (users, prompts, likes)
*/

-- Drop all project-related tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS prompt_comments CASCADE;
DROP TABLE IF EXISTS project_prompts CASCADE;
DROP TABLE IF EXISTS project_invitations CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Drop project-related views
DROP VIEW IF EXISTS user_accessible_projects CASCADE;

-- Drop project-related functions
DROP FUNCTION IF EXISTS accept_project_invitation(text) CASCADE;
DROP FUNCTION IF EXISTS transfer_project_ownership(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_project_role(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS can_access_project(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS add_project_owner_as_member() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_invitations() CASCADE;

-- Verify core tables still exist and are properly configured
-- These are the tables we want to keep:
-- 1. users table (for user profiles)
-- 2. prompts table (core functionality)  
-- 3. likes table (like functionality)

-- Ensure proper indexes exist for core functionality
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_display_name_idx ON users(display_name);

CREATE INDEX IF NOT EXISTS prompts_user_id_idx ON prompts(user_id);
CREATE INDEX IF NOT EXISTS prompts_access_idx ON prompts(access);
CREATE INDEX IF NOT EXISTS prompts_created_at_idx ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS prompts_views_idx ON prompts(views DESC);
CREATE INDEX IF NOT EXISTS prompts_original_prompt_id_idx ON prompts(original_prompt_id);
CREATE INDEX IF NOT EXISTS prompts_fork_count_idx ON prompts(fork_count DESC);

CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);
CREATE INDEX IF NOT EXISTS likes_prompt_id_idx ON likes(prompt_id);
CREATE INDEX IF NOT EXISTS likes_user_prompt_idx ON likes(user_id, prompt_id);
CREATE INDEX IF NOT EXISTS likes_created_at_idx ON likes(created_at DESC);

-- Ensure RLS is enabled on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;