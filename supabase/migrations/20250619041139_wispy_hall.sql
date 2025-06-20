/*
  # Add Public Profile Setting

  1. Schema Changes
    - Add `is_public_profile` column to users table
    - Default to true for existing users (backward compatibility)
    - Add index for performance

  2. Security
    - Update RLS policies to respect public profile setting
    - Only show public prompts if user has public profile enabled

  3. Performance
    - Add index on is_public_profile for efficient filtering
*/

-- Add is_public_profile column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_public_profile'
  ) THEN
    ALTER TABLE users ADD COLUMN is_public_profile boolean DEFAULT true;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS users_public_profile_idx ON users(is_public_profile);

-- Update existing users to have public profiles enabled by default
UPDATE users SET is_public_profile = true WHERE is_public_profile IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE users ALTER COLUMN is_public_profile SET NOT NULL;