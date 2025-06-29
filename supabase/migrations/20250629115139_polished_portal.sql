/*
  # Add key_type to api_keys table

  1. Changes
    - Add key_type column to api_keys table with default value 'ai_provider_key'
    - Add check constraint to ensure key_type is either 'pbm_api_key' or 'ai_provider_key'
    
  2. Purpose
    - Allow differentiation between API keys used for promptby.me API authentication
      and keys used for external AI providers
*/

-- Add key_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_keys' AND column_name = 'key_type'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN key_type text NOT NULL DEFAULT 'ai_provider_key';
    
    -- Add check constraint
    ALTER TABLE api_keys ADD CONSTRAINT api_keys_key_type_check 
      CHECK (key_type IN ('pbm_api_key', 'ai_provider_key'));
      
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS api_keys_key_type_idx ON api_keys(key_type);
  END IF;
END $$;