import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CustomerOrder, OrderStatus } from '../types';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Spinner from '../components/common/Spinner';
import ClipboardDocumentListIcon from '../components/icons/ClipboardDocumentListIcon';
import { translateOrderStatus, getOrderStatusColor, getOrderStatusIcon, formatCurrency } from '../utils';
import { useCustomerOrders } from '../hooks/useCustomerOrders';

interface OrderTrackingPageProps {
  currentUserRole: string;
}

const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ currentUserRole }) => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { orders, loading, updateOrderStatus } = useCustomerOrders();
  
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('quote_accepted');
  const [statusMessage, setStatusMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId);
      setSelectedOrder(order || null);
    }
  }, [orderId, orders]);

  const statusOptions = [
    { value: 'quote_accepted', label: 'Orçamento aceito com sucesso!' },
    { value: 'awaiting_payment', label: 'Aguardando pagamento' },
    { value: 'payment_received', label: 'O seu pedido foi pago.' },
    { value: 'preparing_materials', label: 'Estamos preparando o seu material para produzir' },
    { value: 'in_production', label: 'Fique tranquilo, seu material está em produção.' },
    { value: 'final_production', label: 'Oba! Seu material está em fase final de produção.' },
    { value: 'ready_for_pickup', label: 'Produção concluída! O item está pronto para retirada.' }
  ];

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    setIsUpdating(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus, statusMessage || translateOrderStatus(newStatus));
      setStatusMessage('');
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-white flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-3">Carregando pedido...</span>
      </div>
    );
  }

  if (!selectedOrder) {
    return (
      <div className="p-6 text-white text-center">
        <h2 className="text-xl font-semibold text-red-500">Pedido não encontrado</h2>
        <p className="text-gray-400 mt-2">O pedido solicitado não foi encontrado.</p>
        <Button onClick={() => navigate('/orders')} variant="primary" className="mt-4">
          Voltar para Pedidos
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="h-8 w-8 text-yellow-500 mr-3" />
          <h2 className="text-2xl font-semibold text-white">
            Acompanhamento do Pedido #{selectedOrder.quoteNumber}
          </h2>
        </div>
        <Button onClick={() => navigate('/orders')} variant="secondary">
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Informações do Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="text-gray-400">Cliente:</span> {selectedOrder.clientName}</p>
                <p><span className="text-gray-400">Número:</span> {selectedOrder.quoteNumber}</p>
                <p><span className="text-gray-400">Aceito em:</span> {new Date(selectedOrder.acceptedAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <p><span className="text-gray-400">Valor Total:</span> {formatCurrency(selectedOrder.totalAmount)}</p>
                <p><span className="text-gray-400">Pagamento:</span> {selectedOrder.paymentMethod}</p>
                {selectedOrder.estimatedDelivery && (
                  <p><span className="text-gray-400">Previsão:</span> {new Date(selectedOrder.estimatedDelivery).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Linha do Tempo</h3>
            <div className="space-y-4">
              {selectedOrder.statusHistory.map((update, index) => (
                <div key={update.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'
                    }`}>
                      {getOrderStatusIcon(update.status)}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className={`font-medium ${getOrderStatusColor(update.status)}`}>
                      {update.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(update.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Itens do Pedido</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Produto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Qtd</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {selectedOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-white">{item.productName}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-300 text-right">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        {currentUserRole === 'admin' && (
          <div className="space-y-6">
            <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Atualizar Status</h3>
              <div className="space-y-4">
                <Select
                  label="Novo Status"
                  options={statusOptions}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                />
                
                <Textarea
                  label="Mensagem Personalizada (Opcional)"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  rows={3}
                  placeholder="Deixe em branco para usar a mensagem padrão"
                />
                
                <Button 
                  onClick={handleUpdateStatus}
                  variant="primary"
                  className="w-full"
                  isLoading={isUpdating}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Atualizando...' : 'Atualizar Status'}
                </Button>
              </div>
            </div>

            <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Status Atual</h3>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getOrderStatusIcon(selectedOrder.currentStatus)}</span>
                <div>
                  <p className={`font-medium ${getOrderStatusColor(selectedOrder.currentStatus)}`}>
                    {translateOrderStatus(selectedOrder.currentStatus)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Atualizado em: {new Date(selectedOrder.statusHistory[0]?.updatedAt || selectedOrder.acceptedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;