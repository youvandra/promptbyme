/*
  # Fix Position Columns Data Type

  1. Changes
    - Alter position_x column from integer to real (floating point)
    - Alter position_y column from integer to real (floating point)
    - This allows storing decimal coordinates for smooth node positioning

  2. Reason
    - The application generates floating-point coordinates during drag operations
    - Database was rejecting these values because columns were integer type
    - Real type supports decimal values needed for precise positioning
*/

-- Alter position columns to support floating point numbers
ALTER TABLE flow_nodes 
ALTER COLUMN position_x TYPE real,
ALTER COLUMN position_y TYPE real;