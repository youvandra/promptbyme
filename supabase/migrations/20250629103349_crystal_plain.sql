-- Create the prompt-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-media', 'prompt-media', true)
ON CONFLICT (id) DO NOTHING;

-- First, check if each policy exists and drop it if it does
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  -- Check and drop prompt_media_public_select
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'prompt_media_public_select' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "prompt_media_public_select" ON storage.objects;
  END IF;

  -- Check and drop prompt_media_user_insert
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'prompt_media_user_insert' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "prompt_media_user_insert" ON storage.objects;
  END IF;

  -- Check and drop prompt_media_user_update
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'prompt_media_user_update' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "prompt_media_user_update" ON storage.objects;
  END IF;

  -- Check and drop prompt_media_user_delete
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'prompt_media_user_delete' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "prompt_media_user_delete" ON storage.objects;
  END IF;
END $$;

-- Now create the policies with new unique names to avoid conflicts
CREATE POLICY "prompt_media_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-media');

CREATE POLICY "prompt_media_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prompt-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "prompt_media_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prompt-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "prompt_media_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prompt-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);