/*
  # Create Prompt Media Storage Bucket

  1. Storage
    - Create `prompt-media` bucket for storing prompt-related media files
    - Enable public access for viewing media files
    - Set up RLS policies for secure access

  2. Security
    - Users can upload their own media files
    - Users can update/delete their own media files
    - Public read access for all media files
*/

-- Create the prompt-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-media', 'prompt-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view media files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-media');

-- Allow authenticated users to upload their own media files
CREATE POLICY "Users can upload their own media files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prompt-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own media files
CREATE POLICY "Users can update their own media files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prompt-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own media files
CREATE POLICY "Users can delete their own media files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prompt-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);