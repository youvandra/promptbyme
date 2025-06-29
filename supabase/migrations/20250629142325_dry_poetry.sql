/*
  # Add API Call Logs Table

  1. New Table
    - `api_call_logs` - Stores logs of API calls made through the run-prompt-api endpoint
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `timestamp` (timestamptz)
      - `endpoint` (text)
      - `method` (text)
      - `status` (integer)
      - `request_body` (jsonb)
      - `response_body` (jsonb)
      - `duration_ms` (integer)
      - `ip_address` (text, optional)
      - `user_agent` (text, optional)

  2. Security
    - Enable RLS on the table
    - Add policy for users to view only their own logs
    - Add index on user_id and timestamp for efficient queries
*/

-- Create api_call_logs table
CREATE TABLE IF NOT EXISTS api_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  endpoint text NOT NULL,
  method text NOT NULL,
  status integer NOT NULL,
  request_body jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_body jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer NOT NULL,
  ip_address text,
  user_agent text
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS api_call_logs_user_id_idx ON api_call_logs(user_id);
CREATE INDEX IF NOT EXISTS api_call_logs_timestamp_idx ON api_call_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS api_call_logs_status_idx ON api_call_logs(status);

-- Enable Row Level Security
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to view only their own logs
CREATE POLICY "Users can view their own API logs"
  ON api_call_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE api_call_logs IS 'Logs of API calls made through the run-prompt-api endpoint';