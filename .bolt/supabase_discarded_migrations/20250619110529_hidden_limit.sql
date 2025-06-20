@@ .. @@
 CREATE TABLE IF NOT EXISTS flow_nodes (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   project_id uuid NOT NULL REFERENCES flow_projects(id) ON DELETE CASCADE,
-  type text NOT NULL CHECK (type IN ('prompt', 'condition', 'output')),
+  type text NOT NULL CHECK (type IN ('input', 'prompt', 'condition', 'output')),
   title text NOT NULL,
   content text DEFAULT '',
   position_x integer NOT NULL DEFAULT 0,
   position_y integer NOT NULL DEFAULT 0,
   metadata jsonb DEFAULT '{}',
   created_at timestamptz DEFAULT now(),
   updated_at timestamptz DEFAULT now()
 );