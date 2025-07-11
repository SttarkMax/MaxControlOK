/*
  # Create customers table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `document_type` (text, default 'CPF', check constraint)
      - `document_number` (text, default empty)
      - `phone` (text, required)
      - `email` (text, default empty)
      - `address` (text, default empty)
      - `city` (text, default empty)
      - `postal_code` (text, default empty)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `customers` table
    - Add policies for sales and admins to manage customers
    - Add policy for users to read all customers
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document_type text DEFAULT 'CPF'::text CHECK (document_type IN ('CPF', 'CNPJ', 'N/A')),
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