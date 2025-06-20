/*
  # Add Project Counts RPC Function

  1. New Function
    - `get_user_accessible_projects_with_counts` - Returns projects with node and member counts
    - Aggregates data from flow_projects, flow_nodes, and project_members tables
    - Returns only projects the user can access (as owner or member)

  2. Security
    - Function runs with SECURITY DEFINER to access data across tables
    - Uses auth.uid() to ensure users only see their own data
    - Returns counts for accepted members only

  3. Performance
    - Uses efficient COUNT aggregation
    - Joins only necessary tables
    - Returns all data in a single query
*/

-- Create function to get projects with counts
CREATE OR REPLACE FUNCTION get_user_accessible_projects_with_counts()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  description text,
  created_at timestamptz,
  updated_at timestamptz,
  visibility text,
  node_count bigint,
  member_count bigint,
  current_user_role text
) AS $$
BEGIN
  RETURN QUERY
  WITH project_node_counts AS (
    SELECT 
      fp.id AS project_id,
      COUNT(fn.id) AS node_count
    FROM 
      flow_projects fp
    LEFT JOIN 
      flow_nodes fn ON fp.id = fn.project_id
    GROUP BY 
      fp.id
  ),
  project_member_counts AS (
    SELECT 
      fp.id AS project_id,
      COUNT(pm.id) AS member_count
    FROM 
      flow_projects fp
    LEFT JOIN 
      project_members pm ON fp.id = pm.project_id AND pm.status = 'accepted'
    GROUP BY 
      fp.id
  ),
  user_roles AS (
    SELECT
      pm.project_id,
      pm.role
    FROM
      project_members pm
    WHERE
      pm.user_id = auth.uid()
      AND pm.status = 'accepted'
  )
  SELECT 
    fp.id,
    fp.user_id,
    fp.name,
    fp.description,
    fp.created_at,
    fp.updated_at,
    fp.visibility,
    COALESCE(pnc.node_count, 0) AS node_count,
    COALESCE(pmc.member_count, 0) AS member_count,
    CASE
      WHEN fp.user_id = auth.uid() THEN 'owner'
      ELSE ur.role
    END AS current_user_role
  FROM 
    flow_projects fp
  LEFT JOIN 
    project_node_counts pnc ON fp.id = pnc.project_id
  LEFT JOIN 
    project_member_counts pmc ON fp.id = pmc.project_id
  LEFT JOIN
    user_roles ur ON fp.id = ur.project_id
  WHERE 
    fp.user_id = auth.uid() -- User is owner
    OR EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = fp.id 
      AND pm.user_id = auth.uid() 
      AND pm.status = 'accepted'
    ) -- User is member
    OR fp.visibility = 'public' -- Project is public
  ORDER BY 
    fp.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_accessible_projects_with_counts() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_accessible_projects_with_counts() IS 'Returns all projects accessible to the current user with node and member counts';