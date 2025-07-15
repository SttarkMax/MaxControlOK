@@ .. @@
 ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Admins can manage companies"
+CREATE POLICY "Allow all operations on companies"
   ON companies
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Users can read all companies"
-  ON companies
-  FOR SELECT
-  TO authenticated
-  USING (true);