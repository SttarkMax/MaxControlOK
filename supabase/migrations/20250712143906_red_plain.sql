@@ .. @@
 ALTER TABLE supplier_debts ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Sales and admins can manage supplier debts"
+CREATE POLICY "Allow all operations on supplier debts"
   ON supplier_debts
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Users can read all supplier debts"
-  ON supplier_debts
-  FOR SELECT
-  TO authenticated
-  USING (true);