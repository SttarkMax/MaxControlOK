import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { APP_NAME } from '../constants';
import UserCircleIcon from '../components/icons/UserCircleIcon';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('Admin User'); // Default for demo
  const [password, setPassword] = useState('password'); // Dummy password
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username);
    navigate('/');
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
          <Input
            label="Nome de Usuário (Simulado)"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Ex: João Silva"
          />
          <Input
            label="Senha (Simulada)"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="********"
          />
          <Button type="submit" variant="primary" size="lg" className="w-full">
            Entrar
          </Button>
        </form>
         <p className="mt-4 text-center text-xs text-gray-400">
            Esta é uma simulação. Nenhuma senha real é necessária.
          </p>
      </div>
    </div>
  );
};

export default LoginPage;