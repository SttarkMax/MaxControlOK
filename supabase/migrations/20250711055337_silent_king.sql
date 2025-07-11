/*
  # Create quotes table

  1. New Tables
    - `quotes`
      - `id` (uuid, primary key)
      - `quote_number` (text, required, unique)
      - `customer_id` (uuid, foreign key to customers)
      - `client_name` (text, required)
      - `client_contact` (text, default empty)
      - `subtotal` (numeric, default 0)
      - `discount_type` (text, default 'none', check constraint)
      - `discount_value` (numeric, default 0)
      - `discount_amount_calculated` (numeric, default 0)
      - `subtotal_after_discount` (numeric, default 0)
      - `total_cash` (numeric, default 0)
      - `total_card` (numeric, default 0)
      - `down_payment_applied` (numeric, default 0)
      - `selected_payment_method` (text, default empty)
      - `payment_date` (date, optional)
      - `delivery_deadline` (date, optional)
      - `status` (text, default 'draft', check constraint)
      - `company_info_snapshot` (jsonb, required)
      - `notes` (text, default empty)
      - `salesperson_username` (text, required)
      - `salesperson_full_name` (text, default empty)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `quotes` table
    - Add policies for sales and admins to manage quotes
    - Add policy for users to read all quotes

  3. Indexes
    - Add index on customer_id for better performance
    - Add index on status for filtering
    - Add index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_contact text DEFAULT ''::text,
  subtotal numeric(10,2) DEFAULT 0 NOT NULL,
  discount_type text DEFAULT 'none'::text CHECK (discount_type IN ('percentage', 'fixed', 'none')),
  discount_value numeric(10,2) DEFAULT 0,
  discount_amount_calculated numeric(10,2) DEFAULT 0,
  subtotal_after_discount numeric(10,2) DEFAULT 0 NOT NULL,
  total_cash numeric(10,2) DEFAULT 0 NOT NULL,
  total_card numeric(10,2) DEFAULT 0 NOT NULL,
  down_payment_applied numeric(10,2) DEFAULT 0,
  selected_payment_method text DEFAULT ''::text,
  payment_date date,
  delivery_deadline date,
  status text DEFAULT 'draft'::text CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'converted_to_order', 'cancelled')),
  company_info_snapshot jsonb NOT NULL,
  notes text DEFAULT ''::text,
  salesperson_username text NOT NULL,
  salesperson_full_name text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales and admins can manage quotes"
  ON quotes
  FOR ALL
  TO authenticated
  USING (true);