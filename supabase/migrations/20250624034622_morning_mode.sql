/*
  # Add delete_user function

  1. New Function
    - `delete_user` - Allows users to delete their own account
    - Deletes all user data from the database
    - Deletes the user from auth.users

  2. Security
    - Function runs with SECURITY DEFINER to have proper permissions
    - Only allows users to delete their own account
    - Cascading deletes ensure all related data is removed

  3. Process
    - Delete user's prompts (cascades to prompt_versions)
    - Delete user's folders
    - Delete user's profile from users table
    - Delete user from auth.users
*/

-- Create function to allow users to delete their own account
CREATE OR REPLACE FUNCTION delete_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  result json;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  -- Check if user exists
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Delete user's data (will cascade to related tables)
  -- The order matters to avoid foreign key constraint errors
  
  -- Delete user's prompts (will cascade to prompt_versions)
  DELETE FROM prompts WHERE user_id = current_user_id;
  
  -- Delete user's folders
  DELETE FROM folders WHERE user_id = current_user_id;
  
  -- Delete user's flow projects (will cascade to nodes and connections)
  DELETE FROM flow_projects WHERE user_id = current_user_id;
  
  -- Delete user's project memberships
  DELETE FROM project_members WHERE user_id = current_user_id;
  
  -- Delete user's profile from users table
  DELETE FROM users WHERE id = current_user_id;
  
  -- Delete user from auth.users
  -- This must be done last as it will invalidate the user's session
  BEGIN
    -- Use the service_role key to delete the user from auth.users
    -- This is done through a direct call to the auth.users table
    DELETE FROM auth.users WHERE id = current_user_id;
    result := json_build_object('success', true);
  EXCEPTION WHEN OTHERS THEN
    -- If we can't delete from auth.users directly, return an error
    result := json_build_object('success', false, 'error', 'Failed to delete authentication record');
  END;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_user() IS 'Allows users to delete their own account and all associated data';