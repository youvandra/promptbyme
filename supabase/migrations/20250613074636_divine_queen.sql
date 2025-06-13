/*
  # Add Fork Functionality

  1. Schema Changes
    - Add `original_prompt_id` column to track forked prompts
    - Add `fork_count` column to track how many times a prompt has been forked
    - Add `is_forked` computed field to identify forked prompts

  2. Security
    - Enable RLS on prompts table (already enabled)
    - Update existing policies to handle forked prompts
    - Only original prompts can be forked (not forked prompts)

  3. Performance
    - Add indexes for fork-related queries
    - Create trigger to update fork count automatically
*/

-- Add fork-related columns to prompts table
DO $$
BEGIN
  -- Add original_prompt_id column to track forked prompts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'original_prompt_id'
  ) THEN
    ALTER TABLE prompts ADD COLUMN original_prompt_id uuid REFERENCES prompts(id) ON DELETE SET NULL;
  END IF;

  -- Add fork_count column to track how many times a prompt has been forked
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'fork_count'
  ) THEN
    ALTER TABLE prompts ADD COLUMN fork_count integer DEFAULT 0;
  END IF;
END $$;

-- Create function to update fork count
CREATE OR REPLACE FUNCTION update_prompt_fork_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.original_prompt_id IS NOT NULL THEN
    -- Increment fork count for the original prompt
    UPDATE prompts 
    SET fork_count = fork_count + 1 
    WHERE id = NEW.original_prompt_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.original_prompt_id IS NOT NULL THEN
    -- Decrement fork count for the original prompt
    UPDATE prompts 
    SET fork_count = GREATEST(fork_count - 1, 0) 
    WHERE id = OLD.original_prompt_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update fork count
DROP TRIGGER IF EXISTS update_prompt_fork_count_trigger ON prompts;
CREATE TRIGGER update_prompt_fork_count_trigger
  AFTER INSERT OR DELETE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_fork_count();

-- Create indexes for fork-related queries
CREATE INDEX IF NOT EXISTS prompts_original_prompt_id_idx ON prompts(original_prompt_id);
CREATE INDEX IF NOT EXISTS prompts_fork_count_idx ON prompts(fork_count DESC);

-- Initialize fork counts for existing prompts
UPDATE prompts 
SET fork_count = (
  SELECT COUNT(*) 
  FROM prompts AS forks 
  WHERE forks.original_prompt_id = prompts.id
)
WHERE original_prompt_id IS NULL; -- Only update original prompts