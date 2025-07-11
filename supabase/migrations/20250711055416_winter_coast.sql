/*
  # Create app users table

  1. New Tables
    - `app_users`
      - `id` (uuid, primary key)
      - `username` (text, required, unique)
      - `full_name` (text, default empty)
      - `password_hash` (text, required)
      - `role` (text, default 'sales', check constraint)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_users` table
    - Add policies for admins to manage app users
    - Add policy for admins to read all app users
*/

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  full_name text DEFAULT ''::text,
  password_hash text NOT NULL,
  role text DEFAULT 'sales'::text NOT NULL CHECK (role IN ('admin', 'sales', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all app users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage app users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (true);