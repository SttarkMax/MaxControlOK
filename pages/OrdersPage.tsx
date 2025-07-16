import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerOrder } from '../types';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import { translateOrderStatus, getOrderStatusColor, getOrderStatusIcon, formatCurrency } from '../utils';
import { useCustomerOrders } from '../hooks/useCustomerOrders';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, loading } = useCustomerOrders();

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/tracking/${orderId}`);
  };

  if (loading) {
    return (
      <div className="p-6 text-white flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-3">Carregando pedidos...</span>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="h-8 w-8 text-yellow-500 mr-3" />
          <h2 className="text-2xl font-semibold text-white">Acompanhamento de Pedidos</h2>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10 bg-[#1d1d1d] shadow-xl rounded-lg">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-white">Nenhum pedido encontrado</h3>
          <p className="mt-1 text-sm text-gray-400">
            Os pedidos aparecerão aqui quando os orçamentos forem aceitos.
          </p>
        </div>
      ) : (
        <div className="bg-[#1d1d1d] shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-[#282828]">
            <thead className="bg-[#282828]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Aceito em</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-[#1F1F1F] divide-y divide-[#282828]">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-[#2A2A2A]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getOrderStatusIcon(order.currentStatus)}</span>
                      <div>
                        <div className="text-sm font-medium text-yellow-400">#{order.quoteNumber}</div>
                        <div className="text-xs text-gray-400">{order.items.length} item(s)</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{order.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getOrderStatusColor(order.currentStatus)}`}>
                      {translateOrderStatus(order.currentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(order.acceptedAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <Button 
                      onClick={() => handleViewOrder(order.id)}
                      variant="outline" 
                      size="sm"
                    >
                      Acompanhar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;