/*
  # Create RLS Policies for MaxControl System

  1. Security
    - Enable RLS on all tables
    - Create policies for authenticated users (full access)
    - Create policies for anon users (full access for demo/development)

  2. Tables Covered
    - companies: Company information
    - categories: Product categories
    - products: Product catalog
    - customers: Customer management
    - customer_down_payments: Customer down payments
    - quotes: Quote management
    - quote_items: Quote items
    - suppliers: Supplier management
    - supplier_debts: Supplier debts
    - supplier_credits: Supplier credits
    - accounts_payable: Accounts payable
    - app_users: System users
*/

-- Companies policies
DROP POLICY IF EXISTS "Authenticated users can manage companies" ON companies;
DROP POLICY IF EXISTS "Anon users can manage companies" ON companies;

CREATE POLICY "Authenticated users can manage companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage companies"
  ON companies
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Categories policies
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
DROP POLICY IF EXISTS "Anon users can manage categories" ON categories;

CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage categories"
  ON categories
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Products policies
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
DROP POLICY IF EXISTS "Anon users can manage products" ON products;

CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage products"
  ON products
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Customers policies
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
DROP POLICY IF EXISTS "Anon users can manage customers" ON customers;

CREATE POLICY "Authenticated users can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage customers"
  ON customers
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Customer down payments policies
DROP POLICY IF EXISTS "Authenticated users can manage customer down payments" ON customer_down_payments;
DROP POLICY IF EXISTS "Anon users can manage customer down payments" ON customer_down_payments;

CREATE POLICY "Authenticated users can manage customer down payments"
  ON customer_down_payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage customer down payments"
  ON customer_down_payments
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Quotes policies
DROP POLICY IF EXISTS "Authenticated users can manage quotes" ON quotes;
DROP POLICY IF EXISTS "Anon users can manage quotes" ON quotes;

CREATE POLICY "Authenticated users can manage quotes"
  ON quotes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage quotes"
  ON quotes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Quote items policies
DROP POLICY IF EXISTS "Authenticated users can manage quote items" ON quote_items;
DROP POLICY IF EXISTS "Anon users can manage quote items" ON quote_items;

CREATE POLICY "Authenticated users can manage quote items"
  ON quote_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage quote items"
  ON quote_items
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Suppliers policies
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Anon users can manage suppliers" ON suppliers;

CREATE POLICY "Authenticated users can manage suppliers"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage suppliers"
  ON suppliers
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Supplier debts policies
DROP POLICY IF EXISTS "Authenticated users can manage supplier debts" ON supplier_debts;
DROP POLICY IF EXISTS "Anon users can manage supplier debts" ON supplier_debts;

CREATE POLICY "Authenticated users can manage supplier debts"
  ON supplier_debts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage supplier debts"
  ON supplier_debts
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Supplier credits policies
DROP POLICY IF EXISTS "Authenticated users can manage supplier credits" ON supplier_credits;
DROP POLICY IF EXISTS "Anon users can manage supplier credits" ON supplier_credits;

CREATE POLICY "Authenticated users can manage supplier credits"
  ON supplier_credits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage supplier credits"
  ON supplier_credits
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Accounts payable policies
DROP POLICY IF EXISTS "Authenticated users can manage accounts payable" ON accounts_payable;
DROP POLICY IF EXISTS "Anon users can manage accounts payable" ON accounts_payable;

CREATE POLICY "Authenticated users can manage accounts payable"
  ON accounts_payable
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage accounts payable"
  ON accounts_payable
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- App users policies
DROP POLICY IF EXISTS "Authenticated users can manage app users" ON app_users;
DROP POLICY IF EXISTS "Anon users can manage app users" ON app_users;

CREATE POLICY "Authenticated users can manage app users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can manage app users"
  ON app_users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);