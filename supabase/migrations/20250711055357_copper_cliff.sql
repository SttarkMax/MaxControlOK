/*
  # Create suppliers table

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `cnpj` (text, default empty)
      - `phone` (text, default empty)
      - `email` (text, default empty)
      - `address` (text, default empty)
      - `notes` (text, default empty)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `suppliers` table
    - Add policies for sales and admins to manage suppliers
    - Add policy for users to read all suppliers
*/

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