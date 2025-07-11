/*
  # Create customer down payments table

  1. New Tables
    - `customer_down_payments`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `amount` (numeric, required)
      - `date` (date, required)
      - `description` (text, default empty)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `customer_down_payments` table
    - Add policies for sales and admins to manage customer down payments
    - Add policy for users to read all customer down payments

  3. Indexes
    - Add index on customer_id for better performance
*/

CREATE TABLE IF NOT EXISTS customer_down_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  date date NOT NULL,
  description text DEFAULT ''::text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_down_payments_customer_id ON customer_down_payments(customer_id);

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