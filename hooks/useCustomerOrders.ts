import { useState, useEffect } from 'react';
import { CustomerOrder, OrderStatus, OrderStatusUpdate } from '../types';

// Mock data for demonstration - replace with actual Supabase integration
const mockOrders: CustomerOrder[] = [
  {
    id: '1',
    quoteId: 'quote-1',
    quoteNumber: 'ORC-20250115-1430',
    customerId: 'customer-1',
    clientName: 'João Silva',
    items: [
      {
        productId: 'prod-1',
        productName: 'Cartão de Visita Premium',
        quantity: 1000,
        unitPrice: 0.15,
        totalPrice: 150,
        pricingModel: 'unidade' as any
      }
    ],
    totalAmount: 150,
    paymentMethod: 'PIX',
    acceptedAt: '2025-01-15T14:30:00Z',
    currentStatus: 'in_production',
    statusHistory: [
      {
        id: 'status-1',
        orderId: '1',
        status: 'in_production',
        message: 'Fique tranquilo, seu material está em produção.',
        updatedAt: '2025-01-16T10:00:00Z',
        updatedBy: 'admin'
      },
      {
        id: 'status-2',
        orderId: '1',
        status: 'preparing_materials',
        message: 'Estamos preparando o seu material para produzir',
        updatedAt: '2025-01-15T16:00:00Z',
        updatedBy: 'admin'
      },
      {
        id: 'status-3',
        orderId: '1',
        status: 'payment_received',
        message: 'O seu pedido foi pago.',
        updatedAt: '2025-01-15T15:00:00Z',
        updatedBy: 'admin'
      },
      {
        id: 'status-4',
        orderId: '1',
        status: 'quote_accepted',
        message: 'Orçamento aceito com sucesso!',
        updatedAt: '2025-01-15T14:30:00Z',
        updatedBy: 'system'
      }
    ],
    estimatedDelivery: '2025-01-20T00:00:00Z'
  }
];

export const useCustomerOrders = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrders(mockOrders);
      setError(null);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, message?: string) => {
    try {
      const newUpdate: OrderStatusUpdate = {
        id: `status-${Date.now()}`,
        orderId,
        status,
        message: message || `Status atualizado para: ${status}`,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      };

      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              currentStatus: status,
              statusHistory: [newUpdate, ...order.statusHistory]
            };
          }
          return order;
        })
      );

      // Here you would make the actual API call to update the database
      console.log('Updating order status:', { orderId, status, message });
      
    } catch (err) {
      console.error('Error updating order status:', err);
      throw new Error('Erro ao atualizar status do pedido');
    }
  };

  const createOrderFromQuote = async (quoteId: string, quoteData: any) => {
    try {
      const newOrder: CustomerOrder = {
        id: `order-${Date.now()}`,
        quoteId,
        quoteNumber: quoteData.quoteNumber,
        customerId: quoteData.customerId,
        clientName: quoteData.clientName,
        items: quoteData.items,
        totalAmount: quoteData.totalCash,
        paymentMethod: quoteData.selectedPaymentMethod || 'Não informado',
        acceptedAt: new Date().toISOString(),
        currentStatus: 'quote_accepted',
        statusHistory: [
          {
            id: `status-${Date.now()}`,
            orderId: `order-${Date.now()}`,
            status: 'quote_accepted',
            message: 'Orçamento aceito com sucesso!',
            updatedAt: new Date().toISOString(),
            updatedBy: 'system'
          }
        ]
      };

      setOrders(prevOrders => [...prevOrders, newOrder]);
      
      // Here you would make the actual API call to create the order in the database
      console.log('Creating order from quote:', newOrder);
      
      return newOrder;
    } catch (err) {
      console.error('Error creating order from quote:', err);
      throw new Error('Erro ao criar pedido a partir do orçamento');
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    updateOrderStatus,
    createOrderFromQuote,
    refetch: loadOrders
  };
};