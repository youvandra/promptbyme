/*
  # Add Input Node Type to Flow Nodes

  1. Schema Changes
    - Update flow_nodes type constraint to include 'input'
    - Allow input, prompt, condition, and output node types

  2. Security
    - Maintain existing RLS policies
    - No changes to permissions needed
*/

-- Update the type constraint to include 'input'
ALTER TABLE flow_nodes DROP CONSTRAINT IF EXISTS flow_nodes_type_check;
ALTER TABLE flow_nodes ADD CONSTRAINT flow_nodes_type_check 
  CHECK (type IN ('input', 'prompt', 'condition', 'output'));