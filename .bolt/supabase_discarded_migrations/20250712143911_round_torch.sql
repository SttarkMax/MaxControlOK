@@ .. @@
 ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Admins can manage app users"
+CREATE POLICY "Allow all operations on app users"
   ON app_users
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Admins can read all app users"
-  ON app_users
-  FOR SELECT
-  TO authenticated
-  USING (true);