/*
  # Fix User Signup Database Trigger

  1. Database Functions
    - Create or replace `handle_new_user` function to automatically create user profiles
    - This function will be triggered when a new user signs up via Supabase Auth

  2. Database Triggers
    - Create trigger on `auth.users` table to call `handle_new_user` function
    - Ensures every new auth user gets a corresponding profile in `public.users`

  3. Security
    - Function runs with SECURITY DEFINER to have proper permissions
    - Only creates basic profile data (id, email, display_name)
*/

-- Create or replace the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that calls our function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;