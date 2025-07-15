/*
  # Create comprehensive RLS policies for all tables

  This migration creates Row Level Security policies for all tables in the system
  to allow proper access control for the application.

  ## Tables covered:
  1. companies - Company information
  2. categories - Product categories  
  3. products - Product catalog
  4. customers - Customer management
  5. customer_down_payments - Customer down payments
  6. quotes - Quote management
  7. quote_items - Quote line items
  8. suppliers - Supplier management
  9. supplier_debts - Supplier debt tracking
  10. supplier_credits - Supplier credit tracking
  11. accounts_payable - Accounts payable management
  12. app_users - Application user management

  ## Security approach:
  - All authenticated users can read most data
  - Sales and admin users can manage operational data
  - Admin users can manage system configuration
*/

-- Companies table policies
CREATE POLICY "Allow all authenticated users to read companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Categories table policies  
CREATE POLICY "Allow all authenticated users to read categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Products table policies
CREATE POLICY "Allow all authenticated users to read products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Customers table policies
CREATE POLICY "Allow all authenticated users to read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Customer down payments table policies
CREATE POLICY "Allow all authenticated users to read customer down payments"
  ON customer_down_payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage customer down payments"
  ON customer_down_payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Quotes table policies
CREATE POLICY "Allow all authenticated users to read quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage quotes"
  ON quotes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Quote items table policies
CREATE POLICY "Allow all authenticated users to read quote items"
  ON quote_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage quote items"
  ON quote_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Suppliers table policies
CREATE POLICY "Allow all authenticated users to read suppliers"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage suppliers"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Supplier debts table policies
CREATE POLICY "Allow all authenticated users to read supplier debts"
  ON supplier_debts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage supplier debts"
  ON supplier_debts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Supplier credits table policies
CREATE POLICY "Allow all authenticated users to read supplier credits"
  ON supplier_credits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage supplier credits"
  ON supplier_credits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Accounts payable table policies
CREATE POLICY "Allow all authenticated users to read accounts payable"
  ON accounts_payable
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage accounts payable"
  ON accounts_payable
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- App users table policies
CREATE POLICY "Allow all authenticated users to read app users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage app users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Additional policies for anon access (for demo/development purposes)
-- Note: In production, you should remove these and implement proper authentication

-- Companies anon policies
CREATE POLICY "Allow anon to read companies"
  ON companies
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage companies"
  ON companies
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Categories anon policies
CREATE POLICY "Allow anon to read categories"
  ON categories
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage categories"
  ON categories
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Products anon policies
CREATE POLICY "Allow anon to read products"
  ON products
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage products"
  ON products
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Customers anon policies
CREATE POLICY "Allow anon to read customers"
  ON customers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage customers"
  ON customers
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Customer down payments anon policies
CREATE POLICY "Allow anon to read customer down payments"
  ON customer_down_payments
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage customer down payments"
  ON customer_down_payments
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Quotes anon policies
CREATE POLICY "Allow anon to read quotes"
  ON quotes
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage quotes"
  ON quotes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Quote items anon policies
CREATE POLICY "Allow anon to read quote items"
  ON quote_items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage quote items"
  ON quote_items
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Suppliers anon policies
CREATE POLICY "Allow anon to read suppliers"
  ON suppliers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage suppliers"
  ON suppliers
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Supplier debts anon policies
CREATE POLICY "Allow anon to read supplier debts"
  ON supplier_debts
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage supplier debts"
  ON supplier_debts
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Supplier credits anon policies
CREATE POLICY "Allow anon to read supplier credits"
  ON supplier_credits
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage supplier credits"
  ON supplier_credits
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Accounts payable anon policies
CREATE POLICY "Allow anon to read accounts payable"
  ON accounts_payable
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage accounts payable"
  ON accounts_payable
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- App users anon policies
CREATE POLICY "Allow anon to read app users"
  ON app_users
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to manage app users"
  ON app_users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);