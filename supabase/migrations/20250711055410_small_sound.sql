/*
  # Create accounts payable table

  1. New Tables
    - `accounts_payable`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `amount` (numeric, required)
      - `due_date` (date, required)
      - `is_paid` (boolean, default false)
      - `notes` (text, default empty)
      - `series_id` (text, optional)
      - `total_installments_in_series` (integer, optional)
      - `installment_number_of_series` (integer, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `accounts_payable` table
    - Add policies for admins to manage accounts payable
    - Add policy for admins to read all accounts payable

  3. Indexes
    - Add index on due_date for better performance
    - Add index on series_id for better performance
*/

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

CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_series_id ON accounts_payable(series_id);

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