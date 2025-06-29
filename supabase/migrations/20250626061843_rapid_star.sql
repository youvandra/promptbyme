/*
  # Fix Prompt Flow RLS Policies

  1. Changes
    - Replace existing "FOR ALL" policies with explicit policies for each operation
    - Create separate policies for SELECT, INSERT, UPDATE, and DELETE
    - Maintain the same access control logic but with more explicit policies
    - Fix issue where users can see other users' flows

  2. Security
    - Ensure flows are strictly isolated to their owners
    - Maintain proper access control for all operations
    - Prevent any cross-user data access

  3. Tables Affected
    - prompt_flows
    - flow_steps
    - prompt_flow_step
*/

-- Drop existing policies on prompt_flows
DROP POLICY IF EXISTS "Users can manage their own flows" ON prompt_flows;

-- Create explicit policies for prompt_flows
CREATE POLICY "Users can view their own flows"
  ON prompt_flows
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own flows"
  ON prompt_flows
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own flows"
  ON prompt_flows
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own flows"
  ON prompt_flows
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Drop existing policies on flow_steps
DROP POLICY IF EXISTS "Users can manage steps in their flows" ON flow_steps;

-- Create explicit policies for flow_steps
CREATE POLICY "Users can view steps in their flows"
  ON flow_steps
  FOR SELECT
  TO authenticated
  USING (flow_id IN (
    SELECT id FROM prompt_flows WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert steps in their flows"
  ON flow_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (flow_id IN (
    SELECT id FROM prompt_flows WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update steps in their flows"
  ON flow_steps
  FOR UPDATE
  TO authenticated
  USING (flow_id IN (
    SELECT id FROM prompt_flows WHERE user_id = auth.uid()
  ))
  WITH CHECK (flow_id IN (
    SELECT id FROM prompt_flows WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete steps in their flows"
  ON flow_steps
  FOR DELETE
  TO authenticated
  USING (flow_id IN (
    SELECT id FROM prompt_flows WHERE user_id = auth.uid()
  ));

-- Drop existing policies on prompt_flow_step
DROP POLICY IF EXISTS "Users can manage their own flow step content" ON prompt_flow_step;

-- Create explicit policies for prompt_flow_step
CREATE POLICY "Users can view their own flow step content"
  ON prompt_flow_step
  FOR SELECT
  TO authenticated
  USING (flow_step_id IN (
    SELECT fs.id
    FROM flow_steps fs
    JOIN prompt_flows pf ON fs.flow_id = pf.id
    WHERE pf.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own flow step content"
  ON prompt_flow_step
  FOR INSERT
  TO authenticated
  WITH CHECK (flow_step_id IN (
    SELECT fs.id
    FROM flow_steps fs
    JOIN prompt_flows pf ON fs.flow_id = pf.id
    WHERE pf.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own flow step content"
  ON prompt_flow_step
  FOR UPDATE
  TO authenticated
  USING (flow_step_id IN (
    SELECT fs.id
    FROM flow_steps fs
    JOIN prompt_flows pf ON fs.flow_id = pf.id
    WHERE pf.user_id = auth.uid()
  ))
  WITH CHECK (flow_step_id IN (
    SELECT fs.id
    FROM flow_steps fs
    JOIN prompt_flows pf ON fs.flow_id = pf.id
    WHERE pf.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own flow step content"
  ON prompt_flow_step
  FOR DELETE
  TO authenticated
  USING (flow_step_id IN (
    SELECT fs.id
    FROM flow_steps fs
    JOIN prompt_flows pf ON fs.flow_id = pf.id
    WHERE pf.user_id = auth.uid()
  ));