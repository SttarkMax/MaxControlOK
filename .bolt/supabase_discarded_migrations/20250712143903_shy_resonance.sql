@@ .. @@
 ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Sales and admins can manage quote items"
+CREATE POLICY "Allow all operations on quote items"
   ON quote_items
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Users can read all quote items"
-  ON quote_items
-  FOR SELECT
-  TO authenticated
-  USING (true);