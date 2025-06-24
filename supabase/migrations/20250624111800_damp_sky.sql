/*
  # Prompt Flows Schema

  1. New Tables
    - `prompt_flows` - Stores flow definitions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `flow_steps` - Stores ordered steps within flows
      - `id` (uuid, primary key)
      - `flow_id` (uuid, references prompt_flows)
      - `prompt_id` (uuid, references prompts)
      - `order_index` (integer)
      - `step_title` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own flows and steps
*/

-- Create prompt_flows table if it doesn't exist
CREATE TABLE IF NOT EXISTS prompt_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flow_steps table if it doesn't exist
CREATE TABLE IF NOT EXISTS flow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES prompt_flows(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  step_title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE prompt_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_steps ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS prompt_flows_user_id_idx ON prompt_flows(user_id);
CREATE INDEX IF NOT EXISTS prompt_flows_created_at_idx ON prompt_flows(created_at DESC);
CREATE INDEX IF NOT EXISTS flow_steps_flow_id_idx ON flow_steps(flow_id);
CREATE INDEX IF NOT EXISTS flow_steps_prompt_id_idx ON flow_steps(prompt_id);
CREATE INDEX IF NOT EXISTS flow_steps_order_idx ON flow_steps(flow_id, order_index);

-- Create RLS policies for prompt_flows (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompt_flows' AND policyname = 'Users can manage their own flows'
  ) THEN
    CREATE POLICY "Users can manage their own flows" 
      ON prompt_flows
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;

-- Create RLS policies for flow_steps (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'flow_steps' AND policyname = 'Users can manage steps in their flows'
  ) THEN
    CREATE POLICY "Users can manage steps in their flows" 
      ON flow_steps
      FOR ALL
      TO authenticated
      USING (flow_id IN (
        SELECT id FROM prompt_flows WHERE user_id = auth.uid()
      ))
      WITH CHECK (flow_id IN (
        SELECT id FROM prompt_flows WHERE user_id = auth.uid()
      ));
  END IF;
END
$$;

-- Create trigger function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_prompt_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on prompt_flows (drop if exists first to avoid errors)
DROP TRIGGER IF EXISTS update_prompt_flows_updated_at ON prompt_flows;
CREATE TRIGGER update_prompt_flows_updated_at
BEFORE UPDATE ON prompt_flows
FOR EACH ROW
EXECUTE FUNCTION update_prompt_flows_updated_at();