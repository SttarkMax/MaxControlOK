import React, { useState, useEffect } from 'react';
import { CustomerOrder } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Spinner from '../components/common/Spinner';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import { translateOrderStatus, getOrderStatusColor, getOrderStatusIcon, formatCurrency } from '../utils';
import { useCustomerPortal } from '../hooks/useCustomerPortal';

const CustomerPortalPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { orders, loading: ordersLoading, authenticateCustomer, getCustomerOrders } = useCustomerPortal();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await authenticateCustomer(email, password);
      if (success) {
        setIsLoggedIn(true);
        await getCustomerOrders(email);
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setError('');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-[#1d1d1d] p-10 rounded-xl shadow-2xl">
          <div>
            <UserCircleIcon className="mx-auto h-16 w-auto text-yellow-500" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Portal do Cliente
            </h2>
            <p className="mt-2 text-center text-sm text-gray-300">
              Acompanhe seus pedidos em tempo real
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
              placeholder="seu@email.com"
            />
            <Input
              label="Senha"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Sua senha de acesso"
            />
            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Acessar Portal'}
            </Button>
          </form>
          <div className="text-center text-xs text-gray-400">
            <p>Primeira vez aqui? Use seu email e o número do orçamento como senha.</p>
          </div>
        </div>
      </div>
    );
  }

  if (ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Spinner size="lg" />
        <span className="ml-3 text-white">Carregando seus pedidos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-[#1d1d1d] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-8 w-8 text-yellow-500 mr-3" />
              <h1 className="text-xl font-bold text-white">Portal do Cliente</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">Olá, {email}</span>
              <Button onClick={handleLogout} variant="secondary" size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-white mb-6">Meus Pedidos</h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-10 bg-[#1d1d1d] rounded-lg">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-white">Nenhum pedido encontrado</h3>
            <p className="mt-1 text-sm text-gray-400">
              Você ainda não possui pedidos em nosso sistema.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-yellow-400">
                    #{order.quoteNumber}
                  </h3>
                  <span className="text-2xl">
                    {getOrderStatusIcon(order.currentStatus)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <p><span className="text-gray-400">Valor:</span> {formatCurrency(order.totalAmount)}</p>
                  <p><span className="text-gray-400">Pagamento:</span> {order.paymentMethod}</p>
                  <p><span className="text-gray-400">Aceito em:</span> {new Date(order.acceptedAt).toLocaleDateString('pt-BR')}</p>
                </div>

                <div className="mb-4">
                  <p className={`font-medium ${getOrderStatusColor(order.currentStatus)}`}>
                    {translateOrderStatus(order.currentStatus)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Atualizado em: {new Date(order.statusHistory[0]?.updatedAt || order.acceptedAt).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-white mb-2">Itens:</h4>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item, index) => (
                      <p key={index} className="text-xs text-gray-300">
                        {item.quantity}x {item.productName}
                      </p>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-xs text-gray-400">
                        +{order.items.length - 2} item(s) adicional(is)
                      </p>
                    )}
                  </div>
                </div>

                {/* Timeline Preview */}
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-white mb-2">Progresso:</h4>
                  <div className="space-y-2">
                    {order.statusHistory.slice(0, 3).map((update, index) => (
                      <div key={update.id} className="flex items-center space-x-2">
                        <span className="text-xs">{getOrderStatusIcon(update.status)}</span>
                        <p className="text-xs text-gray-300 truncate">
                          {update.message}
                        </p>
                      </div>
                    ))}
                    {order.statusHistory.length > 3 && (
                      <p className="text-xs text-gray-400">
                        +{order.statusHistory.length - 3} atualizações
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPortalPage;