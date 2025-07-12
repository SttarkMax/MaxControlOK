@@ .. @@
 ALTER TABLE supplier_credits ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Sales and admins can manage supplier credits"
+CREATE POLICY "Allow all operations on supplier credits"
   ON supplier_credits
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Users can read all supplier credits"
-  ON supplier_credits
-  FOR SELECT
-  TO authenticated
-  USING (true);