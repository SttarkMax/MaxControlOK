import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, Customer, Quote, QuoteItem, PricingModel, LoggedInUser, CompanyInfo } from '../types';
import { CARD_SURCHARGE_PERCENTAGE } from '../constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Spinner from '../components/common/Spinner';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { formatCurrency, formatDateForInput } from '../utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useProducts, useCustomers, useQuotes, useCompany } from '../hooks/useSupabaseData';

interface CreateQuotePageProps {
  currentUser: LoggedInUser;
}

const CreateQuotePage: React.FC<CreateQuotePageProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const { quoteId } = useParams<{ quoteId: string }>();
  const isEditing = Boolean(quoteId);

  // Data hooks
  const { products, loading: productsLoading } = useProducts();
  const { customers, loading: customersLoading } = useCustomers();
  const { quotes, loading: quotesLoading, createQuote, updateQuote } = useQuotes();
  const { company: companyDetails } = useCompany();

  // Quote state
  const [quoteNumber, setQuoteNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [deliveryDeadline, setDeliveryDeadline] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [downPaymentApplied, setDownPaymentApplied] = useState<number>(0);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Add item modal state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [customProductName, setCustomProductName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [itemCount, setItemCount] = useState<number>(1);
  const [priceMode, setPriceMode] = useState<'cash' | 'card'>('cash');

  // Load existing quote data when editing
  useEffect(() => {
    if (isEditing && quoteId && quotes.length > 0) {
      console.log('🔄 CARREGANDO ORÇAMENTO PARA EDIÇÃO:', quoteId);
      
      const existingQuote = quotes.find(q => q.id === quoteId);
      
      if (existingQuote) {
        console.log('✅ ORÇAMENTO ENCONTRADO:', existingQuote);
        console.log('📦 ITENS DO ORÇAMENTO:', existingQuote.items);
        console.log('💰 VALORES:', {
          subtotal: existingQuote.subtotal,
          totalCash: existingQuote.totalCash,
          totalCard: existingQuote.totalCard,
          discount: existingQuote.discountAmountCalculated
        });

        // Load all quote data
        setQuoteNumber(existingQuote.quoteNumber);
        setSelectedCustomerId(existingQuote.customerId || '');
        setClientName(existingQuote.clientName);
        setClientContact(existingQuote.clientContact || '');
        setItems(existingQuote.items || []);
        setDiscountType(existingQuote.discountType);
        setDiscountValue(existingQuote.discountValue);
        setSelectedPaymentMethod(existingQuote.selectedPaymentMethod || '');
        setPaymentDate(existingQuote.paymentDate || '');
        setDeliveryDeadline(existingQuote.deliveryDeadline || '');
        setNotes(existingQuote.notes || '');
        setDownPaymentApplied(existingQuote.downPaymentApplied || 0);

        console.log('✅ TODOS OS DADOS CARREGADOS COM SUCESSO');
        console.log('📊 ITENS CARREGADOS:', existingQuote.items?.length || 0);
      } else {
        console.error('❌ ORÇAMENTO NÃO ENCONTRADO:', quoteId);
      }
    }
  }, [isEditing, quoteId, quotes]);

  // Generate quote number for new quotes
  useEffect(() => {
    if (!isEditing && !quoteNumber) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      setQuoteNumber(`ORC-${dateStr}-${timeStr}`);
    }
  }, [isEditing, quoteNumber]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const discountAmountCalculated = useMemo(() => {
    if (discountType === 'percentage') {
      return subtotal * (discountValue / 100);
    } else if (discountType === 'fixed') {
      return Math.min(discountValue, subtotal);
    }
    return 0;
  }, [discountType, discountValue, subtotal]);

  const subtotalAfterDiscount = subtotal - discountAmountCalculated;
  const totalCash = subtotalAfterDiscount;
  const totalCard = subtotalAfterDiscount * (1 + CARD_SURCHARGE_PERCENTAGE / 100);

  // Customer options
  const customerOptions = [
    { value: '', label: 'Cliente Avulso (Inserir Dados Manualmente)' },
    ...customers.map(customer => ({
      value: customer.id,
      label: `${customer.name} - ${customer.phone}`
    }))
  ];

  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setClientName(customer.name);
        setClientContact(customer.phone + (customer.email ? ` | ${customer.email}` : ''));
      }
    } else {
      setClientName('');
      setClientContact('');
    }
  };

  // Add item functions
  const handleAddItem = () => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (!product) return;

      const effectivePrice = priceMode === 'cash' 
        ? (product.customCashPrice ?? product.basePrice)
        : (product.customCardPrice ?? (product.customCashPrice ?? product.basePrice) * (1 + CARD_SURCHARGE_PERCENTAGE / 100));

      let finalQuantity = quantity;
      let finalUnitPrice = effectivePrice;

      if (product.pricingModel === PricingModel.PER_SQUARE_METER) {
        finalQuantity = width * height * itemCount;
        finalUnitPrice = effectivePrice;
      }

      const newItem: QuoteItem = {
        productId: product.id,
        productName: product.name,
        quantity: finalQuantity,
        unitPrice: finalUnitPrice,
        totalPrice: finalQuantity * finalUnitPrice,
        pricingModel: product.pricingModel,
        width: product.pricingModel === PricingModel.PER_SQUARE_METER ? width : undefined,
        height: product.pricingModel === PricingModel.PER_SQUARE_METER ? height : undefined,
        itemCountForAreaCalc: product.pricingModel === PricingModel.PER_SQUARE_METER ? itemCount : undefined,
      };

      setItems(prev => [...prev, newItem]);
    } else if (customProductName && unitPrice > 0) {
      const newItem: QuoteItem = {
        productId: '',
        productName: customProductName,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: quantity * unitPrice,
        pricingModel: PricingModel.PER_UNIT,
      };

      setItems(prev => [...prev, newItem]);
    }

    // Reset form
    setSelectedProductId('');
    setCustomProductName('');
    setQuantity(1);
    setUnitPrice(0);
    setWidth(0);
    setHeight(0);
    setItemCount(1);
    setShowAddItemModal(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save quote
  const handleSaveQuote = async () => {
    if (!clientName.trim()) {
      alert('Nome do cliente é obrigatório');
      return;
    }

    if (items.length === 0) {
      alert('Adicione pelo menos um item ao orçamento');
      return;
    }

    if (!companyDetails) {
      alert('Configure as informações da empresa antes de criar orçamentos');
      return;
    }

    setIsLoading(true);

    try {
      const quoteData: Omit<Quote, 'id'> = {
        quoteNumber,
        customerId: selectedCustomerId || undefined,
        clientName,
        clientContact,
        items,
        subtotal,
        discountType,
        discountValue,
        discountAmountCalculated,
        subtotalAfterDiscount,
        totalCash,
        totalCard,
        downPaymentApplied,
        selectedPaymentMethod,
        paymentDate: paymentDate || undefined,
        deliveryDeadline: deliveryDeadline || undefined,
        status: 'draft',
        companyInfoSnapshot: companyDetails,
        notes,
        salespersonUsername: currentUser.username,
        salespersonFullName: currentUser.fullName || '',
        createdAt: new Date().toISOString(),
      };

      if (isEditing && quoteId) {
        await updateQuote({ ...quoteData, id: quoteId });
        alert('Orçamento atualizado com sucesso!');
      } else {
        await createQuote(quoteData);
        alert('Orçamento criado com sucesso!');
      }

      navigate('/quotes/all');
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      alert('Erro ao salvar orçamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate PDF
  const generateQuotePdf = () => {
    if (!companyDetails || items.length === 0) {
      alert('Informações incompletas para gerar PDF');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    let yPos = 15;

    // Company header
    if (companyDetails.logoUrlLightBg) {
      try {
        doc.addImage(companyDetails.logoUrlLightBg, 'PNG', margin, yPos, 35, 20);
        yPos += 25;
      } catch (e) {
        console.warn('Erro ao adicionar logo:', e);
      }
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${quoteNumber}`, margin, yPos);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;

    // Client info
    doc.text(`Cliente: ${clientName}`, margin, yPos);
    yPos += 5;
    if (clientContact) {
      doc.text(`Contato: ${clientContact}`, margin, yPos);
      yPos += 5;
    }
    yPos += 10;

    // Items table
    const tableBody = items.map(item => [
      item.productName,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalPrice)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Produto/Serviço', 'Quantidade', 'Valor Unitário', 'Total']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40] },
      margin: { left: margin, right: margin }
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 10;

    // Totals
    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;
    
    if (discountAmountCalculated > 0) {
      doc.text(`Desconto: ${formatCurrency(discountAmountCalculated)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Total à Vista: ${formatCurrency(totalCash)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Total Cartão: ${formatCurrency(totalCard)}`, pageWidth - margin, yPos, { align: 'right' });

    doc.save(`Orcamento-${quoteNumber}.pdf`);
  };

  if (productsLoading || customersLoading || quotesLoading) {
    return (
      <div className="p-6 text-white flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-3">Carregando dados...</span>
      </div>
    );
  }

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-yellow-500 mr-3" />
          <h2 className="text-2xl font-semibold text-white">
            {isEditing ? `Editar Orçamento ${quoteNumber}` : 'Criar Novo Orçamento'}
          </h2>
        </div>
        <Button onClick={() => navigate('/quotes/all')} variant="secondary">
          Voltar
        </Button>
      </div>

      {/* Editing Summary Card */}
      {isEditing && (
        <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">📝 Editando Orçamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p><span className="text-blue-200">Número:</span> <span className="text-yellow-400 font-medium">{quoteNumber}</span></p>
              <p><span className="text-blue-200">Cliente:</span> {clientName}</p>
              <p><span className="text-blue-200">Itens:</span> {items.length} produto(s)</p>
            </div>
            <div>
              <p><span className="text-blue-200">Total à Vista:</span> <span className="text-green-400 font-medium">{formatCurrency(totalCash)}</span></p>
              <p><span className="text-blue-200">Total Cartão:</span> <span className="text-green-400 font-medium">{formatCurrency(totalCard)}</span></p>
              <p><span className="text-blue-200">Desconto:</span> {formatCurrency(discountAmountCalculated)}</p>
            </div>
            <div>
              <p><span className="text-blue-200">Pagamento:</span> {selectedPaymentMethod || 'Não definido'}</p>
              <p><span className="text-blue-200">Entrega:</span> {deliveryDeadline ? new Date(deliveryDeadline + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não definido'}</p>
              <p><span className="text-blue-200">Observações:</span> {notes ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quote Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número do Orçamento"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                required
              />
              <Select
                label="Cliente"
                options={customerOptions}
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
              />
              <Input
                label="Nome do Cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
              <Input
                label="Contato do Cliente"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                placeholder="Telefone, email, etc."
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Itens do Orçamento ({items.length})
              </h3>
              <Button
                onClick={() => setShowAddItemModal(true)}
                variant="primary"
                size="sm"
                iconLeft={<PlusIcon className="w-4 h-4" />}
              >
                Adicionar Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Nenhum item adicionado ainda</p>
                <p className="text-sm">Clique em "Adicionar Item" para começar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Produto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Qtd</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Unit.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-white">{item.productName}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">
                          {item.pricingModel === PricingModel.PER_SQUARE_METER 
                            ? `${item.quantity.toFixed(2)} m²`
                            : item.quantity
                          }
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-300 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-300 text-right">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Button
                            onClick={() => handleRemoveItem(index)}
                            variant="danger"
                            size="xs"
                            iconLeft={<TrashIcon className="w-3 h-3" />}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment and Delivery */}
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Pagamento e Entrega</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Forma de Pagamento"
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                placeholder="Ex: PIX, Cartão 2x, Dinheiro"
              />
              <Input
                label="Data de Pagamento"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
              <Input
                label="Prazo de Entrega"
                type="date"
                value={deliveryDeadline}
                onChange={(e) => setDeliveryDeadline(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
              <Input
                label="Sinal Aplicado"
                type="number"
                step="0.01"
                value={downPaymentApplied}
                onChange={(e) => setDownPaymentApplied(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Observações"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Observações adicionais sobre o orçamento..."
              />
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Resumo Financeiro</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              {/* Discount Section */}
              <div className="border-t border-gray-700 pt-3">
                <Select
                  label="Tipo de Desconto"
                  options={[
                    { value: 'none', label: 'Sem Desconto' },
                    { value: 'percentage', label: 'Percentual (%)' },
                    { value: 'fixed', label: 'Valor Fixo (R$)' }
                  ]}
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                />
                
                {discountType !== 'none' && (
                  <div className="mt-2">
                    <Input
                      label={discountType === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}
                      type="number"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
                
                {discountAmountCalculated > 0 && (
                  <div className="flex justify-between text-red-400 mt-2">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(discountAmountCalculated)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-700 pt-3 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Total à Vista:</span>
                  <span className="text-green-400">{formatCurrency(totalCash)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Cartão:</span>
                  <span className="text-blue-400">{formatCurrency(totalCard)}</span>
                </div>
                
                {downPaymentApplied > 0 && (
                  <div className="flex justify-between text-yellow-400">
                    <span>Sinal Aplicado:</span>
                    <span>-{formatCurrency(downPaymentApplied)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Ações</h3>
            <div className="space-y-3">
              <Button
                onClick={handleSaveQuote}
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading || items.length === 0}
              >
                {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar Orçamento' : 'Salvar Orçamento')}
              </Button>
              
              {items.length > 0 && (
                <Button
                  onClick={generateQuotePdf}
                  variant="secondary"
                  className="w-full"
                >
                  Gerar PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Adicionar Item</h3>
            
            <div className="space-y-4">
              <Select
                label="Produto Cadastrado"
                options={[
                  { value: '', label: 'Selecione um produto ou use produto personalizado' },
                  ...products.map(p => ({ value: p.id, label: p.name }))
                ]}
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  if (e.target.value) {
                    const product = products.find(p => p.id === e.target.value);
                    if (product) {
                      setCustomProductName('');
                      const price = priceMode === 'cash' 
                        ? (product.customCashPrice ?? product.basePrice)
                        : (product.customCardPrice ?? (product.customCashPrice ?? product.basePrice) * (1 + CARD_SURCHARGE_PERCENTAGE / 100));
                      setUnitPrice(price);
                    }
                  }
                }}
              />

              {!selectedProductId && (
                <Input
                  label="Nome do Produto Personalizado"
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  placeholder="Digite o nome do produto"
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Modo de Preço"
                  options={[
                    { value: 'cash', label: 'À Vista' },
                    { value: 'card', label: 'Cartão' }
                  ]}
                  value={priceMode}
                  onChange={(e) => {
                    setPriceMode(e.target.value as 'cash' | 'card');
                    if (selectedProduct) {
                      const price = e.target.value === 'cash' 
                        ? (selectedProduct.customCashPrice ?? selectedProduct.basePrice)
                        : (selectedProduct.customCardPrice ?? (selectedProduct.customCashPrice ?? selectedProduct.basePrice) * (1 + CARD_SURCHARGE_PERCENTAGE / 100));
                      setUnitPrice(price);
                    }
                  }}
                />
                
                <Input
                  label="Preço Unitário"
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              {selectedProduct?.pricingModel === PricingModel.PER_SQUARE_METER ? (
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Largura (m)"
                    type="number"
                    step="0.01"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="Altura (m)"
                    type="number"
                    step="0.01"
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="Quantidade de Peças"
                    type="number"
                    value={itemCount}
                    onChange={(e) => setItemCount(parseInt(e.target.value) || 1)}
                  />
                </div>
              ) : (
                <Input
                  label="Quantidade"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                />
              )}

              {selectedProduct?.pricingModel === PricingModel.PER_SQUARE_METER && (
                <div className="bg-gray-800 p-3 rounded text-sm">
                  <p>Área total: {(width * height * itemCount).toFixed(2)} m²</p>
                  <p>Valor total: {formatCurrency((width * height * itemCount) * unitPrice)}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setShowAddItemModal(false)}
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddItem}
                variant="primary"
                disabled={(!selectedProductId && !customProductName) || unitPrice <= 0}
              >
                Adicionar Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuotePage;