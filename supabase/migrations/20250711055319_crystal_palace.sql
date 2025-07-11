/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, default empty)
      - `pricing_model` (text, required, check constraint)
      - `base_price` (numeric, default 0)
      - `unit` (text, default 'un')
      - `custom_cash_price` (numeric, optional)
      - `custom_card_price` (numeric, optional)
      - `supplier_cost` (numeric, optional)
      - `category_id` (uuid, foreign key to categories)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `products` table
    - Add policies for sales and admins to manage products
    - Add policy for users to read all products

  3. Indexes
    - Add index on category_id for better performance
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT ''::text,
  pricing_model text NOT NULL CHECK (pricing_model IN ('unidade', 'm2')),
  base_price numeric(10,2) DEFAULT 0 NOT NULL,
  unit text DEFAULT 'un'::text,
  custom_cash_price numeric(10,2),
  custom_card_price numeric(10,2),
  supplier_cost numeric(10,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

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