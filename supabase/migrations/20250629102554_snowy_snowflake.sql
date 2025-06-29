/*
  # Add Prompt Media Storage Bucket and Policies

  1. Storage
    - Create prompt-media bucket for storing prompt-related files
    - Set bucket to public for viewing
    - Configure proper security policies

  2. Security
    - Allow public viewing of media files
    - Restrict uploads to authenticated users
    - Users can only manage their own files
    - Use folder structure based on user ID
*/

-- Create the prompt-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-media', 'prompt-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "prompt_media_public_select" ON storage.objects;
  DROP POLICY IF EXISTS "prompt_media_user_insert" ON storage.objects;
  DROP POLICY IF EXISTS "prompt_media_user_update" ON storage.objects;
  DROP POLICY IF EXISTS "prompt_media_user_delete" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if policies don't exist
END $$;

-- Allow public access to view media files
CREATE POLICY "prompt_media_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-media');

-- Allow authenticated users to upload their own media files
CREATE POLICY "prompt_media_user_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prompt-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own media files
CREATE POLICY "prompt_media_user_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prompt-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own media files
CREATE POLICY "prompt_media_user_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prompt-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);