/*
  # Add version tracking columns to prompts table

  1. New Columns
    - `current_version` (integer, default 1) - tracks the current version number of the prompt
    - `total_versions` (integer, default 1) - tracks the total number of versions for this prompt

  2. Changes
    - Add current_version column with default value 1
    - Add total_versions column with default value 1
    - Both columns are nullable to maintain compatibility

  3. Notes
    - These columns will support version tracking functionality for prompts
    - Default values ensure existing prompts get version 1
*/

-- Add current_version column to prompts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'current_version'
  ) THEN
    ALTER TABLE prompts ADD COLUMN current_version integer DEFAULT 1;
  END IF;
END $$;

-- Add total_versions column to prompts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'total_versions'
  ) THEN
    ALTER TABLE prompts ADD COLUMN total_versions integer DEFAULT 1;
  END IF;
END $$;

-- Create indexes for the new columns for better query performance
CREATE INDEX IF NOT EXISTS prompts_current_version_idx ON prompts USING btree (current_version);
CREATE INDEX IF NOT EXISTS prompts_total_versions_idx ON prompts USING btree (total_versions);