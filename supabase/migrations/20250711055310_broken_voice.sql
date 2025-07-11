/*
  # Create companies table

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `logo_url_dark_bg` (text, optional)
      - `logo_url_light_bg` (text, optional)
      - `address` (text, default empty)
      - `phone` (text, default empty)
      - `email` (text, default empty)
      - `cnpj` (text, default empty)
      - `instagram` (text, default empty)
      - `website` (text, default empty)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `companies` table
    - Add policies for authenticated users to manage companies
    - Add policy for users to read all companies
*/

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url_dark_bg text,
  logo_url_light_bg text,
  address text DEFAULT ''::text,
  phone text DEFAULT ''::text,
  email text DEFAULT ''::text,
  cnpj text DEFAULT ''::text,
  instagram text DEFAULT ''::text,
  website text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (true);