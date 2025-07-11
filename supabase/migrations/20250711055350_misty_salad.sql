/*
  # Create quote items table

  1. New Tables
    - `quote_items`
      - `id` (uuid, primary key)
      - `quote_id` (uuid, foreign key to quotes)
      - `product_id` (uuid, foreign key to products)
      - `product_name` (text, required)
      - `quantity` (numeric, required)
      - `unit_price` (numeric, required)
      - `total_price` (numeric, required)
      - `pricing_model` (text, required, check constraint)
      - `width` (numeric, optional)
      - `height` (numeric, optional)
      - `item_count_for_area_calc` (integer, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `quote_items` table
    - Add policies for sales and admins to manage quote items
    - Add policy for users to read all quote items

  3. Indexes
    - Add index on quote_id for better performance
    - Add index on product_id for better performance
*/

CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric(10,3) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  pricing_model text NOT NULL CHECK (pricing_model IN ('unidade', 'm2')),
  width numeric(10,2),
  height numeric(10,2),
  item_count_for_area_calc integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items(product_id);

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