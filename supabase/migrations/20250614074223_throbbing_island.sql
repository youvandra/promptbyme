/*
  # Fix Profile RLS Policies

  This migration fixes Row Level Security policies to allow users to:
  1. Update their own profile data in the users table
  2. Upload and manage their avatar images in the avatars storage bucket

  ## Changes Made

  1. **Users Table Policies**
     - Ensure users can insert their own profile data
     - Ensure users can update their own profile data
     - Ensure users can select their own profile data

  2. **Storage Bucket Policies**
     - Create avatars bucket if it doesn't exist
     - Allow authenticated users to upload avatars
     - Allow users to update/overwrite their own avatars
     - Allow users to delete their own avatars
     - Allow public read access to avatars

  ## Security
  - All policies are scoped to authenticated users only
  - Users can only modify their own data (auth.uid() = user_id)
  - Public can only read avatar images, not modify them
*/

-- Ensure the avatars storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing conflicting policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;

-- Recreate users table policies with proper permissions
CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Storage policies for avatars bucket
CREATE POLICY "Allow authenticated users to upload avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow users to update their own avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow public read access to avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');