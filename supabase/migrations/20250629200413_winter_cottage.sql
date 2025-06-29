/*
  # Fix team_audit_log and users relationship

  1. Changes
    - Add foreign key constraint between team_audit_log.user_id and public.users.id
    - This allows Supabase to properly join the tables in queries

  2. Security
    - No changes to existing RLS policies
    - Maintains data integrity with ON DELETE SET NULL
*/

-- Add foreign key constraint between team_audit_log and public.users
ALTER TABLE public.team_audit_log 
ADD CONSTRAINT team_audit_log_public_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE SET NULL;