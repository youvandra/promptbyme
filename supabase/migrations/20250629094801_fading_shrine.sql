/*
  # Add Notes and Output Sample to Prompts

  1. New Columns
    - `notes` (text) - For storing additional notes about the prompt
    - `output_sample` (text) - For storing example outputs
    - `media_urls` (text[]) - For storing URLs to uploaded media files

  2. Security
    - Maintain existing RLS policies
    - No additional policies needed as these are just new columns on existing table
*/

-- Add notes column to prompts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'notes'
  ) THEN
    ALTER TABLE prompts ADD COLUMN notes text;
  END IF;
END $$;

-- Add output_sample column to prompts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'output_sample'
  ) THEN
    ALTER TABLE prompts ADD COLUMN output_sample text;
  END IF;
END $$;

-- Add media_urls column to prompts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE prompts ADD COLUMN media_urls text[] DEFAULT '{}';
  END IF;
END $$;