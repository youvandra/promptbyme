@@ .. @@
 -- Drop existing INSERT policy if it exists
 DROP POLICY IF EXISTS "Users can insert nodes in their projects" ON flow_nodes;
 DROP POLICY IF EXISTS "Project members can insert nodes" ON flow_nodes;
+DROP POLICY IF EXISTS "Project members can manage nodes" ON flow_nodes;
 
 -- Create comprehensive INSERT policy for flow_nodes
 CREATE POLICY "Project members can insert nodes"