@@ .. @@
 ALTER TABLE products ENABLE ROW LEVEL SECURITY;
 
-CREATE POLICY "Sales and admins can manage products"
+CREATE POLICY "Allow all operations on products"
   ON products
   FOR ALL
-  TO authenticated
+  TO anon, authenticated
   USING (true)
   WITH CHECK (true);
 
-CREATE POLICY "Users can read all products"
-  ON products
-  FOR SELECT
-  TO authenticated
-  USING (true);