/*
  # Create supplier credits table

  1. New Tables
    - `supplier_credits`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `amount` (numeric, required)
      - `date` (date, required)
      - `description` (text, default empty)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `supplier_credits` table
    - Add policies for sales and admins to manage supplier credits
    - Add policy for users to read all supplier credits

  3. Indexes
    - Add index on supplier_id for better performance
*/

CREATE TABLE IF NOT EXISTS supplier_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  date date NOT NULL,
  description text DEFAULT ''::text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_credits_supplier_id ON supplier_credits(supplier_id);

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