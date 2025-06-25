/*
  # Create prompt_flow_step table for customized flow step content

  1. New Tables
    - `prompt_flow_step`
      - `id` (uuid, primary key)
      - `flow_step_id` (uuid, references flow_steps)
      - `custom_content` (text, modified content with filled variables)
      - `variables` (jsonb, stores variable values)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on prompt_flow_step table
    - Add policy for users to manage their own flow step content
    - Only flow owners can modify custom content
*/

-- Create prompt_flow_step table if it doesn't exist
CREATE TABLE IF NOT EXISTS prompt_flow_step (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_step_id uuid NOT NULL REFERENCES flow_steps(id) ON DELETE CASCADE,
  custom_content text,
  variables jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS prompt_flow_step_flow_step_id_idx ON prompt_flow_step(flow_step_id);

-- Enable Row Level Security
ALTER TABLE prompt_flow_step ENABLE ROW LEVEL SECURITY;

-- Drop policy if it already exists to avoid the error
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own flow step content" ON prompt_flow_step;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if policy doesn't exist
END $$;

-- Create RLS policy for prompt_flow_step
CREATE POLICY "Users can manage their own flow step content"
  ON prompt_flow_step
  FOR ALL
  TO authenticated
  USING (
    flow_step_id IN (
      SELECT fs.id
      FROM flow_steps fs
      JOIN prompt_flows pf ON fs.flow_id = pf.id
      WHERE pf.user_id = auth.uid()
    )
  )
  WITH CHECK (
    flow_step_id IN (
      SELECT fs.id
      FROM flow_steps fs
      JOIN prompt_flows pf ON fs.flow_id = pf.id
      WHERE pf.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_prompt_flow_step_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS update_prompt_flow_step_updated_at ON prompt_flow_step;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_prompt_flow_step_updated_at
  BEFORE UPDATE ON prompt_flow_step
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_flow_step_updated_at();

-- Add comment for documentation
COMMENT ON TABLE prompt_flow_step IS 'Stores customized content for flow steps, allowing modifications without affecting original prompts';
COMMENT ON COLUMN prompt_flow_step.custom_content IS 'The modified content with filled variables';
COMMENT ON COLUMN prompt_flow_step.variables IS 'JSON object storing variable values used in this step';