/*
  # Remove unused database tables

  This migration removes all unused tables from the database schema.
  
  ## Tables Being Removed (not used in application):
  - `prompt_comments` - commenting feature not implemented
  - `project_prompts` - project management not implemented  
  - `project_invitations` - project invitations not implemented
  - `project_members` - project membership not implemented
  - `projects` - project management not implemented
  
  ## Tables Being Kept (actively used):
  - `users` - user profiles and settings
  - `prompts` - AI prompts storage
  - `likes` - user likes on prompts
  
  ## Benefits:
  - Simplified database schema
  - Better performance
  - Reduced complexity
  - Cleaner codebase alignment
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

-- Remove unused functions related to projects
DROP FUNCTION IF EXISTS accept_project_invitation(text) CASCADE;
DROP FUNCTION IF EXISTS transfer_project_ownership(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_project_role(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS add_project_owner_as_member() CASCADE;

-- Verify core tables still exist and are properly configured
DO $$
BEGIN
  -- Check that essential tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'Critical error: users table missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prompts' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'Critical error: prompts table missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'Critical error: likes table missing';
  END IF;
  
  -- Log successful cleanup
  RAISE NOTICE 'Database cleanup completed successfully';
  RAISE NOTICE 'Remaining tables: users, prompts, likes';
END $$;

-- Ensure RLS is enabled on remaining tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Verify essential indexes exist for performance
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

-- Ensure essential functions exist for core functionality
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

CREATE OR REPLACE FUNCTION update_prompt_fork_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.original_prompt_id IS NOT NULL THEN
    UPDATE prompts 
    SET fork_count = fork_count + 1 
    WHERE id = NEW.original_prompt_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.original_prompt_id IS NOT NULL THEN
    UPDATE prompts 
    SET fork_count = GREATEST(fork_count - 1, 0) 
    WHERE id = OLD.original_prompt_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Ensure essential triggers exist
DROP TRIGGER IF EXISTS update_prompt_like_count_trigger ON likes;
CREATE TRIGGER update_prompt_like_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_like_count();

DROP TRIGGER IF EXISTS update_prompt_fork_count_trigger ON prompts;
CREATE TRIGGER update_prompt_fork_count_trigger
  AFTER INSERT OR DELETE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_fork_count();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();