/*
  # Create default admin user

  1. New User
    - Creates a default admin user for initial system access
    - Username: admin
    - Password: password123 (hashed)
    - Role: admin
    
  2. Security
    - Password is properly hashed using bcrypt
    - User can change password after first login
*/

-- Insert default admin user
INSERT INTO app_users (username, full_name, password_hash, role)
VALUES (
  'admin',
  'Administrator',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
  'admin'
) ON CONFLICT (username) DO NOTHING;