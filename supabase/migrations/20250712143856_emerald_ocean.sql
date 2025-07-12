@@ .. @@
 ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Sales and admins can manage categories"
+CREATE POLICY "Allow all operations on categories"
   ON categories
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Users can read all categories"
-  ON categories
-  FOR SELECT
-  TO authenticated
-  USING (true);