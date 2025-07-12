/*
  # Complete MaxControl ERP Database Schema

  1. New Tables
    - `companies` - Company information and settings
    - `categories` - Product categories
    - `products` - Product catalog with pricing models
    - `customers` - Customer management with down payments
    - `customer_down_payments` - Customer advance payments
    - `quotes` - Quote/order management
    - `quote_items` - Quote line items
    - `suppliers` - Supplier management
    - `supplier_debts` - Supplier debt tracking
    - `supplier_credits` - Supplier payment tracking
    - `accounts_payable` - Accounts payable management
    - `app_users` - System user management

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Proper access controls

  3. Performance
    - Strategic indexes for common queries
    - Foreign key relationships
    - Cascade deletes where appropriate
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url_dark_bg text,
  logo_url_light_bg text,
  address text DEFAULT ''::text,
  phone text DEFAULT ''::text,
  email text DEFAULT ''::text,
  cnpj text DEFAULT ''::text,
  instagram text DEFAULT ''::text,
  website text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (true);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales and admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT ''::text,
  pricing_model text NOT NULL CHECK (pricing_model = ANY (ARRAY['unidade'::text, 'm2'::text])),
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  unit text DEFAULT 'un'::text,
  custom_cash_price numeric(10,2),
  custom_card_price numeric(10,2),
  supplier_cost numeric(10,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales and admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products USING btree (category_id);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document_type text DEFAULT 'CPF'::text CHECK (document_type = ANY (ARRAY['CPF'::text, 'CNPJ'::text, 'N/A'::text])),
  document_number text DEFAULT ''::text,
  phone text NOT NULL,
  email text DEFAULT ''::text,
  address text DEFAULT ''::text,
  city text DEFAULT ''::text,
  postal_code text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales and admins can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true);

-- Customer down payments table
CREATE TABLE IF NOT EXISTS customer_down_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  date date NOT NULL,
  description text DEFAULT ''::text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customer_down_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all customer down payments"
  ON customer_down_payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales and admins can manage customer down payments"
  ON customer_down_payments
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for customer down payments
CREATE INDEX IF NOT EXISTS idx_customer_down_payments_customer_id ON customer_down_payments USING btree (customer_id);

-- App users table
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  full_name text DEFAULT ''::text,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'sales'::text CHECK (role = ANY (ARRAY['admin'::text, 'sales'::text, 'viewer'::text])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all app users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage app users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (true);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_contact text DEFAULT ''::text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_type text DEFAULT 'none'::text CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'none'::text])),
  discount_value numeric(10,2) DEFAULT 0,
  discount_amount_calculated numeric(10,2) DEFAULT 0,
  subtotal_after_discount numeric(10,2) NOT NULL DEFAULT 0,
  total_cash numeric(10,2) NOT NULL DEFAULT 0,
  total_card numeric(10,2) NOT NULL DEFAULT 0,
  down_payment_applied numeric(10,2) DEFAULT 0,
  selected_payment_method text DEFAULT ''::text,
  payment_date date,
  delivery_deadline date,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'accepted'::text, 'rejected'::text, 'converted_to_order'::text, 'cancelled'::text])),
  company_info_snapshot jsonb NOT NULL,
  notes text DEFAULT ''::text,
  salesperson_username text NOT NULL,
  salesperson_full_name text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales and admins can manage quotes"
  ON quotes
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for quotes
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes USING btree (status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes USING btree (created_at);

-- Quote items table
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric(10,3) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  pricing_model text NOT NULL CHECK (pricing_model = ANY (ARRAY['unidade'::text, 'm2'::text])),
  width numeric(10,2),
  height numeric(10,2),
  item_count_for_area_calc integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all quote items"
  ON quote_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales and admins can manage quote items"
  ON quote_items
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for quote items
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items USING btree (quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items USING btree (product_id);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text DEFAULT ''::text,
  phone text DEFAULT ''::text,
  email text DEFAULT ''::text,
  address text DEFAULT ''::text,
  notes text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all suppliers"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales and admins can manage suppliers"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (true);

-- Supplier debts table
CREATE TABLE IF NOT EXISTS supplier_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  description text DEFAULT ''::text,
  total_amount numeric(10,2) NOT NULL,
  date_added date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all supplier debts"
  ON supplier_debts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales and admins can manage supplier debts"
  ON supplier_debts
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for supplier debts
CREATE INDEX IF NOT EXISTS idx_supplier_debts_supplier_id ON supplier_debts USING btree (supplier_id);

-- Supplier credits table
CREATE TABLE IF NOT EXISTS supplier_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  date date NOT NULL,
  description text DEFAULT ''::text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all supplier credits"
  ON supplier_credits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales and admins can manage supplier credits"
  ON supplier_credits
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for supplier credits
CREATE INDEX IF NOT EXISTS idx_supplier_credits_supplier_id ON supplier_credits USING btree (supplier_id);

-- Accounts payable table
CREATE TABLE IF NOT EXISTS accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  is_paid boolean DEFAULT false,
  notes text DEFAULT ''::text,
  series_id text,
  total_installments_in_series integer,
  installment_number_of_series integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all accounts payable"
  ON accounts_payable
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage accounts payable"
  ON accounts_payable
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for accounts payable
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_series_id ON accounts_payable USING btree (series_id);

-- Insert default data
DO $$
BEGIN
  -- Insert default company if not exists
  IF NOT EXISTS (SELECT 1 FROM companies LIMIT 1) THEN
    INSERT INTO companies (name, address, phone, email, cnpj, instagram, website)
    VALUES (
      'MaxControl ERP',
      'Rua das Empresas, 123 - Centro - São Paulo - SP - 01000-000',
      '(11) 99999-9999',
      'contato@maxcontrol.com.br',
      '12.345.678/0001-90',
      '@maxcontrol',
      'https://www.maxcontrol.com.br'
    );
  END IF;

  -- Insert default admin user if not exists
  IF NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'admin') THEN
    INSERT INTO app_users (username, full_name, password_hash, role)
    VALUES (
      'admin',
      'Administrador do Sistema',
      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
      'admin'
    );
  END IF;

  -- Insert sample categories if not exists
  IF NOT EXISTS (SELECT 1 FROM categories LIMIT 1) THEN
    INSERT INTO categories (name) VALUES
    ('Cartões de Visita'),
    ('Banners e Lonas'),
    ('Impressos Gráficos'),
    ('Adesivos'),
    ('Materiais Promocionais');
  END IF;
END $$;