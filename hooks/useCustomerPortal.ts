import { useState } from 'react';
import { CustomerOrder, CustomerAccess } from '../types';

// Mock customer access data
const mockCustomerAccess: CustomerAccess[] = [
  {
    id: '1',
    customerId: 'customer-1',
    email: 'joao@email.com',
    passwordHash: 'ORC-20250115-1430', // In real implementation, this would be hashed
    isActive: true,
    createdAt: '2025-01-15T14:30:00Z'
  }
];

// Mock orders for customer portal
const mockCustomerOrders: CustomerOrder[] = [
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
      },
      {
        productId: 'prod-2',
        productName: 'Folder Institucional',
        quantity: 500,
        unitPrice: 0.80,
        totalPrice: 400,
        pricingModel: 'unidade' as any
      }
    ],
    totalAmount: 550,
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

export const useCustomerPortal = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerAccess | null>(null);

  const authenticateCustomer = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find customer by email and check password
      const customer = mockCustomerAccess.find(c => 
        c.email === email && c.passwordHash === password && c.isActive
      );
      
      if (customer) {
        setCurrentCustomer(customer);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getCustomerOrders = async (email: string) => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find customer and their orders
      const customer = mockCustomerAccess.find(c => c.email === email);
      if (customer) {
        const customerOrders = mockCustomerOrders.filter(o => o.customerId === customer.customerId);
        setOrders(customerOrders);
      }
    } catch (error) {
      console.error('Error loading customer orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const createCustomerAccess = async (customerId: string, email: string, quoteNumber: string) => {
    try {
      // In real implementation, this would create a new customer access record
      const newAccess: CustomerAccess = {
        id: `access-${Date.now()}`,
        customerId,
        email,
        passwordHash: quoteNumber, // In real implementation, this would be hashed
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      console.log('Creating customer access:', newAccess);
      return newAccess;
    } catch (error) {
      console.error('Error creating customer access:', error);
      throw error;
    }
  };

  return {
    orders,
    loading,
    currentCustomer,
    authenticateCustomer,
    getCustomerOrders,
    createCustomerAccess
  };
};