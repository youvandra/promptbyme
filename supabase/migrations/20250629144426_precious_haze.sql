/*
  # Remove team_audit_log table and related function

  1. Changes
    - Drop team_audit_log table
    - Drop log_team_action function
    - Remove any references to team audit logging

  2. Reason
    - The team audit log functionality is not being used in the frontend
    - Simplifying the database schema by removing unused components
*/

-- Drop the team_audit_log table if it exists
DROP TABLE IF EXISTS team_audit_log CASCADE;

-- Drop the log_team_action function if it exists
DROP FUNCTION IF EXISTS log_team_action(uuid, text, jsonb) CASCADE;

-- Drop any policies related to team_audit_log
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'team_audit_log'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON team_audit_log';
    END LOOP;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Ignore if table doesn't exist
END $$;