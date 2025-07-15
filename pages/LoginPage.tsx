import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/supabaseService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { APP_NAME } from '../constants';
import UserCircleIcon from '../components/icons/UserCircleIcon';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Login attempt for:', email);
      console.log('🔄 Password provided:', password ? 'Yes' : 'No');
      
      // Authenticate with Supabase
      const user = await userService.authenticateUser(email, password);
      
      if (user) {
        console.log('✅ Login successful for user:', user.username);
        // Store user session
        localStorage.setItem('currentUser', JSON.stringify({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }));
        onLogin(user.username);
      } else {
        console.log('❌ Login failed - user is null');
        throw new Error('Email ou senha incorretos');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'Supabase não configurado' || error.message === 'Cliente Supabase não inicializado') {
        setError('Erro de configuração do sistema. Verifique a conexão com o banco de dados.');
      } else if (error.message === 'Erro na consulta do banco de dados') {
        setError('Erro ao consultar banco de dados. Tente novamente.');
      } else {
        setError('Email ou senha incorretos');
      }
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
            placeholder="usuario@exemplo.com"
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
      </div>
    </div>
  );
};

export default LoginPage;