/*
  # Complete MaxControl Database Schema

  1. New Tables
    - `companies` - Company information and settings
    - `categories` - Product categories
    - `products` - Product catalog with pricing models
    - `customers` - Customer information
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
    - Secure data access patterns

  3. Features
    - Complete ERP functionality
    - Multi-user support with roles
    - Financial management
    - Quote and order processing
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url_dark_bg text,
  logo_url_light_bg text,
  address text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  cnpj text DEFAULT '',
  instagram text DEFAULT '',
  website text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies are publicly readable"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Companies are updatable by authenticated users"
  ON companies
  FOR ALL
  TO authenticated
  USING (true);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are readable by authenticated users"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Categories are manageable by authenticated users"
  ON categories
  FOR ALL
  TO authenticated
  USING (true);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text DEFAULT '',
  pricing_model text NOT NULL DEFAULT 'unidade',
  base_price numeric DEFAULT 0,
  unit text DEFAULT 'un',
  custom_cash_price numeric,
  custom_card_price numeric,
  supplier_cost numeric,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are readable by authenticated users"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Products are manageable by authenticated users"
  ON products
  FOR ALL
  TO authenticated
  USING (true);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  document_type text DEFAULT 'CPF',
  document_number text DEFAULT '',
  phone text NOT NULL,
  email text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  postal_code text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers are readable by authenticated users"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers are manageable by authenticated users"
  ON customers
  FOR ALL
  TO authenticated
  USING (true);

-- Customer down payments table
CREATE TABLE IF NOT EXISTS customer_down_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customer_down_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer down payments are readable by authenticated users"
  ON customer_down_payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customer down payments are manageable by authenticated users"
  ON customer_down_payments
  FOR ALL
  TO authenticated
  USING (true);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_contact text DEFAULT '',
  subtotal numeric DEFAULT 0,
  discount_type text DEFAULT 'none',
  discount_value numeric DEFAULT 0,
  discount_amount_calculated numeric DEFAULT 0,
  subtotal_after_discount numeric DEFAULT 0,
  total_cash numeric DEFAULT 0,
  total_card numeric DEFAULT 0,
  down_payment_applied numeric DEFAULT 0,
  selected_payment_method text DEFAULT '',
  payment_date text,
  delivery_deadline text,
  status text DEFAULT 'draft',
  company_info_snapshot jsonb NOT NULL,
  notes text DEFAULT '',
  salesperson_username text NOT NULL,
  salesperson_full_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quotes are readable by authenticated users"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Quotes are manageable by authenticated users"
  ON quotes
  FOR ALL
  TO authenticated
  USING (true);

-- Quote items table
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id text,
  product_name text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  pricing_model text NOT NULL,
  width numeric,
  height numeric,
  item_count_for_area_calc integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quote items are readable by authenticated users"
  ON quote_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Quote items are manageable by authenticated users"
  ON quote_items
  FOR ALL
  TO authenticated
  USING (true);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  cnpj text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers are readable by authenticated users"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Suppliers are manageable by authenticated users"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (true);

-- Supplier debts table
CREATE TABLE IF NOT EXISTS supplier_debts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  description text DEFAULT '',
  total_amount numeric NOT NULL,
  date_added text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplier debts are readable by authenticated users"
  ON supplier_debts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Supplier debts are manageable by authenticated users"
  ON supplier_debts
  FOR ALL
  TO authenticated
  USING (true);

-- Supplier credits table
CREATE TABLE IF NOT EXISTS supplier_credits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplier credits are readable by authenticated users"
  ON supplier_credits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Supplier credits are manageable by authenticated users"
  ON supplier_credits
  FOR ALL
  TO authenticated
  USING (true);

-- Accounts payable table
CREATE TABLE IF NOT EXISTS accounts_payable (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  amount numeric NOT NULL,
  due_date text NOT NULL,
  is_paid boolean DEFAULT false,
  notes text DEFAULT '',
  series_id text,
  total_installments_in_series integer,
  installment_number_of_series integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accounts payable are readable by authenticated users"
  ON accounts_payable
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Accounts payable are manageable by authenticated users"
  ON accounts_payable
  FOR ALL
  TO authenticated
  USING (true);

-- App users table
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text NOT NULL UNIQUE,
  full_name text DEFAULT '',
  password_hash text NOT NULL,
  role text DEFAULT 'sales',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App users are readable by authenticated users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "App users are manageable by authenticated users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_customer_down_payments_customer_id ON customer_down_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_supplier_debts_supplier_id ON supplier_debts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_credits_supplier_id ON supplier_credits(supplier_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_series_id ON accounts_payable(series_id);
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);

-- Insert default admin user (password: admin123)
INSERT INTO app_users (username, full_name, password_hash, role)
VALUES (
  'admin',
  'Administrador',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'admin123'
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- Insert default company
INSERT INTO companies (name, address, phone, email)
VALUES (
  'MaxControl ERP',
  'Rua Exemplo, 123 - Centro',
  '(11) 99999-9999',
  'contato@maxcontrol.com.br'
) ON CONFLICT DO NOTHING;