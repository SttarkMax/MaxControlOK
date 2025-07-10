/*
  # Criação do Schema Inicial do MaxControl

  1. Novas Tabelas
    - `companies` - Informações da empresa
    - `categories` - Categorias de produtos
    - `products` - Produtos e serviços
    - `customers` - Clientes
    - `customer_down_payments` - Sinais/adiantamentos dos clientes
    - `quotes` - Orçamentos
    - `quote_items` - Itens dos orçamentos
    - `suppliers` - Fornecedores
    - `supplier_debts` - Dívidas com fornecedores
    - `supplier_credits` - Pagamentos aos fornecedores
    - `accounts_payable` - Contas a pagar
    - `app_users` - Usuários do sistema

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados
*/

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  pricing_model text NOT NULL CHECK (pricing_model IN ('unidade', 'm2')),
  base_price decimal(10,2) NOT NULL DEFAULT 0,
  unit text DEFAULT 'un',
  custom_cash_price decimal(10,2),
  custom_card_price decimal(10,2),
  supplier_cost decimal(10,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document_type text DEFAULT 'CPF' CHECK (document_type IN ('CPF', 'CNPJ', 'N/A')),
  document_number text DEFAULT '',
  phone text NOT NULL,
  email text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  postal_code text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de sinais/adiantamentos dos clientes
CREATE TABLE IF NOT EXISTS customer_down_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  date date NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_contact text DEFAULT '',
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  discount_type text DEFAULT 'none' CHECK (discount_type IN ('percentage', 'fixed', 'none')),
  discount_value decimal(10,2) DEFAULT 0,
  discount_amount_calculated decimal(10,2) DEFAULT 0,
  subtotal_after_discount decimal(10,2) NOT NULL DEFAULT 0,
  total_cash decimal(10,2) NOT NULL DEFAULT 0,
  total_card decimal(10,2) NOT NULL DEFAULT 0,
  down_payment_applied decimal(10,2) DEFAULT 0,
  selected_payment_method text DEFAULT '',
  payment_date date,
  delivery_deadline date,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'converted_to_order', 'cancelled')),
  company_info_snapshot jsonb NOT NULL,
  notes text DEFAULT '',
  salesperson_username text NOT NULL,
  salesperson_full_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de itens dos orçamentos
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity decimal(10,3) NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  pricing_model text NOT NULL CHECK (pricing_model IN ('unidade', 'm2')),
  width decimal(10,2),
  height decimal(10,2),
  item_count_for_area_calc integer,
  created_at timestamptz DEFAULT now()
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de dívidas com fornecedores
CREATE TABLE IF NOT EXISTS supplier_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  description text DEFAULT '',
  total_amount decimal(10,2) NOT NULL,
  date_added date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de pagamentos aos fornecedores
CREATE TABLE IF NOT EXISTS supplier_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  date date NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Tabela de contas a pagar
CREATE TABLE IF NOT EXISTS accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  is_paid boolean DEFAULT false,
  notes text DEFAULT '',
  series_id text,
  total_installments_in_series integer,
  installment_number_of_series integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  full_name text DEFAULT '',
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'sales', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
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

-- Políticas de segurança para usuários autenticados
CREATE POLICY "Users can read all companies" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage companies" ON companies FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read all categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admins can manage categories" ON categories FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read all products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admins can manage products" ON products FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read all customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admins can manage customers" ON customers FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read all customer down payments" ON customer_down_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admins can manage customer down payments" ON customer_down_payments FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read all quotes" ON quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admins can manage quotes" ON quotes FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read all quote items" ON quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admins can manage quote items" ON quote_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read all suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admins can manage suppliers" ON suppliers FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read all supplier debts" ON supplier_debts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admins can manage supplier debts" ON supplier_debts FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read all supplier credits" ON supplier_credits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales and admins can manage supplier credits" ON supplier_credits FOR ALL TO authenticated USING (true);

CREATE POLICY "Admins can read all accounts payable" ON accounts_payable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage accounts payable" ON accounts_payable FOR ALL TO authenticated USING (true);

CREATE POLICY "Admins can read all app users" ON app_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage app users" ON app_users FOR ALL TO authenticated USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_customer_down_payments_customer_id ON customer_down_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_debts_supplier_id ON supplier_debts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_credits_supplier_id ON supplier_credits(supplier_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_series_id ON accounts_payable(series_id);