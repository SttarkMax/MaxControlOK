@@ .. @@
 ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Sales and admins can manage customers"
+CREATE POLICY "Allow all operations on customers"
   ON customers
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Users can read all customers"
-  ON customers
-  FOR SELECT
-  TO authenticated
-  USING (true);