@@ .. @@
 ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Sales and admins can manage quotes"
+CREATE POLICY "Allow all operations on quotes"
   ON quotes
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Users can read all quotes"
-  ON quotes
-  FOR SELECT
-  TO authenticated
-  USING (true);