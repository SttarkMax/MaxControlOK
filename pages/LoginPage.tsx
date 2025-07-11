import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { userService } from '../services/supabaseService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { APP_NAME } from '../constants';
import UserCircleIcon from '../components/icons/UserCircleIcon';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (supabase) {
        try {
          // Try Supabase authentication first
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) {
            if (authError.message === 'Invalid login credentials') {
                setShowInstructions(true);
                throw new Error('Usuário não encontrado no Supabase. Veja as instruções abaixo para criar o usuário.');
            }
            throw new Error(authError.message);
          }

          if (data.user) {
            // Authentication successful, the auth state change will handle user data
            // Just trigger the login callback
            onLogin(data.user.email?.split('@')[0] || 'admin');
          }
        } catch (authError: any) {
          console.warn('Supabase authentication failed, using fallback:', authError);
          // Fallback to demo authentication
          if (email === 'admin@example.com' && password === 'password123') {
            onLogin('admin');
          } else {
            throw new Error('Credenciais inválidas');
          }
        }
      } else {
        // Fallback authentication for development/demo
        if (email === 'admin@example.com' && password === 'password123') {
          onLogin('admin');
        } else {
          throw new Error('Credenciais inválidas');
        }
      }
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#1d1d1d] p-10 rounded-xl shadow-2xl">
        <div>
          <UserCircleIcon className="mx-auto h-16 w-auto text-yellow-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Acessar {APP_NAME}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Bem-vindo! Insira suas credenciais.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@example.com"
          />
          <Input
            label="Senha"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="password123"
          />
          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <div className="mt-4 text-center text-xs text-gray-400">
          {showInstructions && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                📋 Como criar o usuário no Supabase:
              </h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Acesse seu <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Dashboard do Supabase</a></li>
                <li>Selecione seu projeto</li>
                <li>Vá para <strong>Authentication → Users</strong></li>
                <li>Clique em <strong>"Add user"</strong></li>
                <li>Email: <code className="bg-blue-100 px-1 rounded">admin@example.com</code></li>
                <li>Password: <code className="bg-blue-100 px-1 rounded">password123</code></li>
                <li>Clique em <strong>"Create user"</strong></li>
                <li>Tente fazer login novamente</li>
              </ol>
              <p className="text-xs text-blue-600 mt-2">
                💡 Alternativamente, o sistema funcionará em modo demo se o Supabase não estiver configurado.
              </p>
            </div>
          )}

          <p>Credenciais padrão:</p>
          <p>Email: admin@example.com</p>
          <p>Senha: password123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;