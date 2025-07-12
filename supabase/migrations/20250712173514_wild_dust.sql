/*
  # Create admin user in database

  1. New User
    - Creates an admin user with email admin@maxcontrol.com
    - Password: admin123 (hashed with bcrypt)
    - Role: admin
    - Full name: Administrador do Sistema

  2. Security
    - Password is properly hashed using bcrypt
    - User has admin privileges
*/

-- Insert admin user with hashed password
INSERT INTO app_users (
  username,
  full_name,
  password_hash,
  role,
  created_at,
  updated_at
) VALUES (
  'admin@maxcontrol.com',
  'Administrador do Sistema',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'admin123'
  'admin',
  now(),
  now()
) ON CONFLICT (username) DO NOTHING;