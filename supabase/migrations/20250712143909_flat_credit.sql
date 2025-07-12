@@ .. @@
 ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Admins can manage accounts payable"
+CREATE POLICY "Allow all operations on accounts payable"
   ON accounts_payable
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Admins can read all accounts payable"
-  ON accounts_payable
-  FOR SELECT
-  TO authenticated
-  USING (true);