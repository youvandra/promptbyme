/*
  # Fix Prompt Node Import - Make Optional

  1. Changes
    - Make imported_prompt_id optional for prompt nodes
    - Allow prompt nodes to exist without imported prompts
    - Users can create empty prompt nodes or import from gallery

  2. Security
    - Maintain existing RLS policies
    - No changes to permissions needed
*/

-- The imported_prompt_id column is already nullable, but let's ensure it's properly set up
-- and add any missing constraints or indexes

-- Ensure the column allows NULL values (it should already)
ALTER TABLE flow_nodes ALTER COLUMN imported_prompt_id DROP NOT NULL;

-- Add a comment to clarify the optional nature
COMMENT ON COLUMN flow_nodes.imported_prompt_id IS 'Optional reference to imported prompt from gallery. NULL for manually created prompt nodes.';

-- Ensure we have proper indexing for performance
CREATE INDEX IF NOT EXISTS flow_nodes_imported_prompt_id_idx ON flow_nodes(imported_prompt_id) WHERE imported_prompt_id IS NOT NULL;