@@ .. @@
 ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Sales and admins can manage suppliers"
+CREATE POLICY "Allow all operations on suppliers"
   ON suppliers
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Users can read all suppliers"
-  ON suppliers
-  FOR SELECT
-  TO authenticated
-  USING (true);