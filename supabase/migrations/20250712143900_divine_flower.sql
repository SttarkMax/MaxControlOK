@@ .. @@
 ALTER TABLE customer_down_payments ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Sales and admins can manage customer down payments"
+CREATE POLICY "Allow all operations on customer down payments"
   ON customer_down_payments
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Users can read all customer down payments"
-  ON customer_down_payments
-  FOR SELECT
-  TO authenticated
-  USING (true);