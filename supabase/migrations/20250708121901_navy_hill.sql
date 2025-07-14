@@ .. @@
   customer_name text NOT NULL,
   product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
   product_name text NOT NULL,
   points_used integer NOT NULL,
-  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
+  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'available_for_pickup', 'completed')),
   request_date timestamptz DEFAULT now(),
   processed_date timestamptz,
   processed_by text,
-  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE
+  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
+  expires_at timestamptz
 );