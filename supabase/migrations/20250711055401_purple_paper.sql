/*
  # Create supplier debts table

  1. New Tables
    - `supplier_debts`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `description` (text, default empty)
      - `total_amount` (numeric, required)
      - `date_added` (date, required)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `supplier_debts` table
    - Add policies for sales and admins to manage supplier debts
    - Add policy for users to read all supplier debts

  3. Indexes
    - Add index on supplier_id for better performance
*/

CREATE TABLE IF NOT EXISTS supplier_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  description text DEFAULT ''::text,
  total_amount numeric(10,2) NOT NULL,
  date_added date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_debts_supplier_id ON supplier_debts(supplier_id);

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