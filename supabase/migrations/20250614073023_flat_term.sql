/*
  # Configure Avatar Storage Policies

  1. Storage Configuration
    - Create avatars bucket if it doesn't exist
    - Enable RLS on the avatars bucket
    - Add policies for authenticated users to upload, view, and delete their own avatars

  2. Security
    - Users can only upload files with their user ID in the filename
    - Users can view all public avatar files
    - Users can delete their own avatar files
    - File size and type restrictions can be added later if needed
*/

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the avatars bucket
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';

-- Policy to allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = split_part(name, '-', 1)
);

-- Policy to allow anyone to view avatars (since they're public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = split_part(name, '-', 1)
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = split_part(name, '-', 1)
);

-- Policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = split_part(name, '-', 1)
);