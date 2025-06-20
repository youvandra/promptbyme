/*
  # Remove Likes Feature

  1. Changes
    - Drop likes table
    - Remove like_count column from prompts table
    - Drop update_prompt_like_count function and trigger
    - Clean up any related indexes

  2. Security
    - Remove RLS policies for likes table
    - Maintain existing RLS on prompts table

  3. Performance
    - Remove unused indexes
*/

-- Drop the likes table and all its dependencies
DROP TABLE IF EXISTS likes CASCADE;

-- Remove the like_count column from prompts table
ALTER TABLE prompts DROP COLUMN IF EXISTS like_count;

-- Drop the update_prompt_like_count function
DROP FUNCTION IF EXISTS update_prompt_like_count() CASCADE;

-- Clean up any related indexes (these will be dropped with the table, but listing for clarity)
-- DROP INDEX IF EXISTS likes_user_id_idx;
-- DROP INDEX IF EXISTS likes_prompt_id_idx;
-- DROP INDEX IF EXISTS likes_user_prompt_idx;
-- DROP INDEX IF EXISTS likes_created_at_idx;

-- Remove any references to like_count in existing functions or triggers
-- (None identified in the current schema)