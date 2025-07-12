/*
  # Fix RLS Policies for MaxControl System

  1. Security
    - Enable RLS on all tables
    - Create policies for authenticated and anon users
    - Allow full access for development/demo purposes

  2. Tables Covered
    - All system tables with proper RLS policies
*/

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_down_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for authenticated users" ON companies;
DROP POLICY IF EXISTS "Allow all for anon users" ON companies;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON categories;
DROP POLICY IF EXISTS "Allow all for anon users" ON categories;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON products;
DROP POLICY IF EXISTS "Allow all for anon users" ON products;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON customers;
DROP POLICY IF EXISTS "Allow all for anon users" ON customers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON customer_down_payments;
DROP POLICY IF EXISTS "Allow all for anon users" ON customer_down_payments;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON quotes;
DROP POLICY IF EXISTS "Allow all for anon users" ON quotes;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON quote_items;
DROP POLICY IF EXISTS "Allow all for anon users" ON quote_items;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Allow all for anon users" ON suppliers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON supplier_debts;
DROP POLICY IF EXISTS "Allow all for anon users" ON supplier_debts;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON supplier_credits;
DROP POLICY IF EXISTS "Allow all for anon users" ON supplier_credits;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON accounts_payable;
DROP POLICY IF EXISTS "Allow all for anon users" ON accounts_payable;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON app_users;
DROP POLICY IF EXISTS "Allow all for anon users" ON app_users;

-- Companies policies
CREATE POLICY "Allow all for authenticated users" ON companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON companies FOR ALL TO anon USING (true) WITH CHECK (true);

-- Categories policies
CREATE POLICY "Allow all for authenticated users" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);

-- Products policies
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON products FOR ALL TO anon USING (true) WITH CHECK (true);

-- Customers policies
CREATE POLICY "Allow all for authenticated users" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);

-- Customer down payments policies
CREATE POLICY "Allow all for authenticated users" ON customer_down_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON customer_down_payments FOR ALL TO anon USING (true) WITH CHECK (true);

-- Quotes policies
CREATE POLICY "Allow all for authenticated users" ON quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON quotes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Quote items policies
CREATE POLICY "Allow all for authenticated users" ON quote_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON quote_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- Suppliers policies
CREATE POLICY "Allow all for authenticated users" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON suppliers FOR ALL TO anon USING (true) WITH CHECK (true);

-- Supplier debts policies
CREATE POLICY "Allow all for authenticated users" ON supplier_debts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON supplier_debts FOR ALL TO anon USING (true) WITH CHECK (true);

-- Supplier credits policies
CREATE POLICY "Allow all for authenticated users" ON supplier_credits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON supplier_credits FOR ALL TO anon USING (true) WITH CHECK (true);

-- Accounts payable policies
CREATE POLICY "Allow all for authenticated users" ON accounts_payable FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON accounts_payable FOR ALL TO anon USING (true) WITH CHECK (true);

-- App users policies
CREATE POLICY "Allow all for authenticated users" ON app_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON app_users FOR ALL TO anon USING (true) WITH CHECK (true);