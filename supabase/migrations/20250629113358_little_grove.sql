/*
  # Add key_type to api_keys table

  1. New Columns
    - `key_type` (text): Differentiates between API keys used for promptby.me API authentication ('pbm_api_key') and those for external AI providers ('ai_provider_key')
  
  2. Security
    - Maintains existing RLS policies
*/

-- Add key_type column to api_keys table
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_type text NOT NULL DEFAULT 'ai_provider_key';

-- Add check constraint to ensure key_type is valid
ALTER TABLE api_keys ADD CONSTRAINT api_keys_key_type_check 
  CHECK (key_type IN ('pbm_api_key', 'ai_provider_key'));

-- Create index on key_type for faster lookups
CREATE INDEX IF NOT EXISTS api_keys_key_type_idx ON api_keys(key_type);