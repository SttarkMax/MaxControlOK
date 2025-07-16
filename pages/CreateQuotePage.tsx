import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Quote, QuoteItem, Product, Customer, PricingModel, CompanyInfo, LoggedInUser } from '../types';
import { CARD_SURCHARGE_PERCENTAGE } from '../constants';
import { formatCurrency, formatDateForInput } from '../utils';
import { formatPhoneNumber } from '../utils';
import { isSupabaseConfigured } from '../lib/supabase';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Spinner from '../components/common/Spinner';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useProducts, useCustomers, useCompany, useQuotes } from '../hooks/useSupabaseData';

interface CreateQuotePageProps {
  currentUser: LoggedInUser;
}

const CreateQuotePage: React.FC<CreateQuotePageProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const { quoteId } = useParams<{ quoteId: string }>();
  const isEditing = Boolean(quoteId);

  const { products, loading: productsLoading } = useProducts();
  const { customers, loading: customersLoading } = useCustomers();
  const { company: companyInfo, loading: companyLoading } = useCompany();
  const { quotes, createQuote, updateQuote } = useQuotes();

  const [isLoading, setIsLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Partial<Quote>>({
    quoteNumber: '',
    customerId: '',
    clientName: '',
    clientContact: '',
    items: [],
    subtotal: 0,
    discountType: 'none',
    discountValue: 0,
    discountAmountCalculated: 0,
    subtotalAfterDiscount: 0,
    totalCash: 0,
    totalCard: 0,
    downPaymentApplied: 0,
    selectedPaymentMethod: '',
    paymentDate: formatDateForInput(new Date()),
    deliveryDeadline: formatDateForInput(new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)),
    status: 'draft',
    notes: '',
    salespersonUsername: currentUser.username,
    salespersonFullName: currentUser.fullName || currentUser.username,
  });

  const [newItem, setNewItem] = useState<Partial<QuoteItem>>({
    productId: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    pricingModel: PricingModel.PER_UNIT,
    width: undefined,
    height: undefined,
    itemCountForAreaCalc: undefined,
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [useCardPricing, setUseCardPricing] = useState(false);

  // Load existing quote for editing
  useEffect(() => {
    if (isEditing && quoteId && quotes.length > 0) {
      const existingQuote = quotes.find(q => q.id === quoteId);
      if (existingQuote) {
        // Load all quote data including payment method, dates, notes, etc.
        setCurrentQuote({
          ...existingQuote,
          // Ensure all fields are properly loaded
          quoteNumber: existingQuote.quoteNumber,
          customerId: existingQuote.customerId,
          clientName: existingQuote.clientName,
          clientContact: existingQuote.clientContact,
          items: existingQuote.items || [],
          subtotal: existingQuote.subtotal,
          discountType: existingQuote.discountType,
          discountValue: existingQuote.discountValue,
          discountAmountCalculated: existingQuote.discountAmountCalculated,
          subtotalAfterDiscount: existingQuote.subtotalAfterDiscount,
          totalCash: existingQuote.totalCash,
          totalCard: existingQuote.totalCard,
          downPaymentApplied: existingQuote.downPaymentApplied,
          selectedPaymentMethod: existingQuote.selectedPaymentMethod || '',
          paymentDate: existingQuote.paymentDate || '',
          deliveryDeadline: existingQuote.deliveryDeadline || '',
          status: existingQuote.status,
          notes: existingQuote.notes || '',
          salespersonUsername: existingQuote.salespersonUsername,
          salespersonFullName: existingQuote.salespersonFullName,
        });
        
        // Load customer data if exists
        if (existingQuote.customerId) {
          const customer = customers.find(c => c.id === existingQuote.customerId);
          setSelectedCustomer(customer || null);
        }
        
        // Set pricing mode based on existing quote items
        if (existingQuote.items && existingQuote.items.length > 0) {
          // Check if any item uses card pricing by comparing with base prices
          const firstItem = existingQuote.items[0];
          const product = products.find(p => p.id === firstItem.productId);
          if (product) {
            const cashPrice = product.customCashPrice ?? product.basePrice;
            const cardPrice = product.customCardPrice ?? (cashPrice * (1 + CARD_SURCHARGE_PERCENTAGE / 100));
            // If the item price is closer to card price, assume card pricing was used
            const isCardPricing = Math.abs(firstItem.unitPrice - cardPrice) < Math.abs(firstItem.unitPrice - cashPrice);
            setUseCardPricing(isCardPricing);
          }
        }
      }
    }
  }, [isEditing, quoteId, quotes, customers, products]);

  // Generate quote number
  useEffect(() => {
    if (!isEditing && !currentQuote.quoteNumber) {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const time = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
      const quoteNumber = `ORC-${year}${month}${day}-${time}`;
      setCurrentQuote(prev => ({ ...prev, quoteNumber }));
    }
  }, [isEditing, currentQuote.quoteNumber]);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    setCurrentQuote(prev => ({
      ...prev,
      customerId: customerId || undefined,
      clientName: customer?.name || '',
      clientContact: customer?.phone || '',
    }));
  };

  const handleAddItem = () => {
    if (!newItem.productId || !newItem.quantity || newItem.quantity <= 0) {
      alert('Por favor, selecione um produto e informe uma quantidade válida.');
      return;
    }

    const product = products.find(p => p.id === newItem.productId);
    if (!product) return;

    let finalQuantity = newItem.quantity;
    let finalUnitPrice = 0;

    if (product.pricingModel === PricingModel.PER_SQUARE_METER) {
      if (!newItem.width || !newItem.height || !newItem.itemCountForAreaCalc) {
        alert('Para produtos por m², informe largura, altura e quantidade de peças.');
        return;
      }
      finalQuantity = (newItem.width * newItem.height * newItem.itemCountForAreaCalc);
    }

    // Calculate price
    const cashPrice = product.customCashPrice ?? product.basePrice;
    const cardPrice = product.customCardPrice ?? (cashPrice * (1 + CARD_SURCHARGE_PERCENTAGE / 100));
    finalUnitPrice = useCardPricing ? cardPrice : cashPrice;

    const itemToAdd: QuoteItem = {
      productId: product.id,
      productName: product.name,
      quantity: finalQuantity,
      unitPrice: finalUnitPrice,
      totalPrice: finalQuantity * finalUnitPrice,
      pricingModel: product.pricingModel,
      width: newItem.width,
      height: newItem.height,
      itemCountForAreaCalc: newItem.itemCountForAreaCalc,
    };

    setCurrentQuote(prev => ({
      ...prev,
      items: [...(prev.items || []), itemToAdd],
    }));

    // Reset form
    setNewItem({
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      pricingModel: PricingModel.PER_UNIT,
      width: undefined,
      height: undefined,
      itemCountForAreaCalc: undefined,
    });
  };

  const handleRemoveItem = (index: number) => {
    setCurrentQuote(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const cashPrice = product.customCashPrice ?? product.basePrice;
      const cardPrice = product.customCardPrice ?? (cashPrice * (1 + CARD_SURCHARGE_PERCENTAGE / 100));
      
      setNewItem(prev => ({
        ...prev,
        productId: product.id,
        productName: product.name,
        unitPrice: useCardPricing ? cardPrice : cashPrice,
        pricingModel: product.pricingModel,
      }));
    }
  };

  // Calculate totals
  const calculatedTotals = useMemo(() => {
    const items = currentQuote.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    let discountAmount = 0;
    if (currentQuote.discountType === 'percentage') {
      discountAmount = subtotal * ((currentQuote.discountValue || 0) / 100);
    } else if (currentQuote.discountType === 'fixed') {
      discountAmount = currentQuote.discountValue || 0;
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const totalCash = subtotalAfterDiscount;
    const totalCard = subtotalAfterDiscount * (1 + CARD_SURCHARGE_PERCENTAGE / 100);

    return {
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      totalCash,
      totalCard,
    };
  }, [currentQuote.items, currentQuote.discountType, currentQuote.discountValue]);

  // Update quote totals when calculated values change
  useEffect(() => {
    setCurrentQuote(prev => ({
      ...prev,
      subtotal: calculatedTotals.subtotal,
      discountAmountCalculated: calculatedTotals.discountAmount,
      subtotalAfterDiscount: calculatedTotals.subtotalAfterDiscount,
      totalCash: calculatedTotals.totalCash,
      totalCard: calculatedTotals.totalCard,
    }));
  }, [calculatedTotals]);

  const handleSaveQuote = async () => {
    if (!currentQuote.clientName?.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    if (!currentQuote.items?.length) {
      alert('Por favor, adicione pelo menos um item ao orçamento.');
      return;
    }

    if (!companyInfo) {
      alert('Informações da empresa não encontradas. Configure a empresa primeiro.');
      return;
    }

    // Check Supabase connection before attempting to save
    if (!isSupabaseConfigured()) {
      alert('Erro de configuração: Supabase não está configurado. Verifique as variáveis de ambiente.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 Preparing to save quote:', currentQuote.quoteNumber);
      
      const quoteToSave: Omit<Quote, 'id'> = {
        quoteNumber: currentQuote.quoteNumber!,
        customerId: currentQuote.customerId,
        clientName: currentQuote.clientName,
        clientContact: currentQuote.clientContact || '',
        items: currentQuote.items,
        subtotal: currentQuote.subtotal!,
        discountType: currentQuote.discountType as any,
        discountValue: currentQuote.discountValue!,
        discountAmountCalculated: currentQuote.discountAmountCalculated!,
        subtotalAfterDiscount: currentQuote.subtotalAfterDiscount!,
        totalCash: currentQuote.totalCash!,
        totalCard: currentQuote.totalCard!,
        downPaymentApplied: currentQuote.downPaymentApplied || 0,
        selectedPaymentMethod: currentQuote.selectedPaymentMethod,
        paymentDate: currentQuote.paymentDate,
        deliveryDeadline: currentQuote.deliveryDeadline,
        status: currentQuote.status as any,
        companyInfoSnapshot: companyInfo,
        notes: currentQuote.notes || '',
        salespersonUsername: currentUser.username,
        salespersonFullName: currentUser.fullName || currentUser.username,
        paymentDate: currentQuote.paymentDate || null,
        deliveryDeadline: currentQuote.deliveryDeadline || null,
        createdAt: new Date().toISOString(),
      };

      console.log('💾 Saving quote data:', {
        number: quoteToSave.quoteNumber,
        client: quoteToSave.clientName,
        itemsCount: quoteToSave.items.length,
        total: quoteToSave.totalCash
      });
      if (isEditing && quoteId) {
        console.log('🔄 Updating existing quote:', quoteId);
        await updateQuote({ ...quoteToSave, id: quoteId });
        console.log('✅ Quote updated successfully');
        alert('Orçamento atualizado com sucesso!');
      } else {
        console.log('🔄 Creating new quote');
        await createQuote(quoteToSave);
        console.log('✅ Quote created successfully');
        alert('Orçamento criado com sucesso!');
      }

      navigate('/');
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      
      // Check if it's just a connection warning but the operation was successful
      if (error instanceof Error && error.message.includes('Erro de conexão')) {
        console.warn('⚠️ Connection warning, but quote may have been saved. Checking...');
        
        // Give a more user-friendly message
        const shouldContinue = window.confirm(
          'Houve um aviso de conexão, mas o orçamento pode ter sido salvo com sucesso.\n\n' +
          'Deseja continuar? (Recomendado: Clique OK para continuar)'
        );
        
        if (shouldContinue) {
          navigate('/');
          return;
        }
      }
      
      // For other errors, show the full error message
      alert(`Erro ao salvar orçamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!currentQuote.items?.length) {
      alert('Adicione itens ao orçamento antes de gerar o PDF.');
      return;
    }
    
    if (!companyInfo) {
      alert('Informações da empresa não encontradas. Configure a empresa primeiro.');
      return;
    }

    // Validar dados mínimos necessários para o PDF
    if (!currentQuote.clientName?.trim()) {
      alert('Por favor, informe o nome do cliente antes de gerar o PDF.');
      return;
    }

    // Gerar PDF diretamente com os dados atuais, sem salvar no banco
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    let yPos = 15;
    const lineHeight = 4.5;

    // Company Header with Logo
    let companyDetailsX = margin;
    let potentialLogoHeight = 0;
    const logoForPdf = companyInfo.logoUrlLightBg;

    // Add logo if available
    if (logoForPdf && logoForPdf.startsWith('data:image')) {
      try {
        const imageMimeType = logoForPdf.substring(logoForPdf.indexOf(':') + 1, logoForPdf.indexOf(';'));
        const imageFormat = imageMimeType.split('/')[1]?.toUpperCase();
        
        if (imageFormat && (imageFormat === 'PNG' || imageFormat === 'JPEG' || imageFormat === 'JPG')) {
          const maxLogoDisplayWidth = 35;
          const maxLogoDisplayHeight = 20;
          doc.addImage(logoForPdf, imageFormat, margin, yPos, maxLogoDisplayWidth, maxLogoDisplayHeight);
          companyDetailsX = margin + maxLogoDisplayWidth + 5;
          potentialLogoHeight = maxLogoDisplayHeight;
        } else {
          console.warn(`Formato de logo (PDF) não suportado: ${imageFormat}. Apenas PNG, JPEG/JPG são bem suportados. Logo não adicionado.`);
        }
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
      }
    }
    
    // Company details
    let textYPos = yPos;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(companyInfo.name, companyDetailsX, textYPos);
    textYPos += (lineHeight + 1.5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (companyInfo.address) {
      const addressLines = doc.splitTextToSize(companyInfo.address, pageWidth - companyDetailsX - margin);
      doc.text(addressLines, companyDetailsX, textYPos);
      textYPos += (addressLines.length * lineHeight);
    }
    
    let contactLine = '';
    if (companyInfo.phone) contactLine += `Tel: ${companyInfo.phone}`;
    if (companyInfo.email) contactLine += `${companyInfo.phone ? ' | ' : ''}Email: ${companyInfo.email}`;
    if (contactLine) {
      doc.text(contactLine, companyDetailsX, textYPos);
      textYPos += lineHeight;
    }
    
    if (companyInfo.cnpj) {
      doc.text(`CNPJ: ${companyInfo.cnpj}`, companyDetailsX, textYPos);
      textYPos += lineHeight;
    }
    
    let webContactLine = '';
    if (companyInfo.website) webContactLine += `Site: ${companyInfo.website}`;
    if (companyInfo.instagram) webContactLine += `${companyInfo.website ? ' | ' : ''}Instagram: ${companyInfo.instagram}`;
    if (webContactLine) {
      doc.text(webContactLine, companyDetailsX, textYPos);
      textYPos += lineHeight;
    }
    
    const headerBlockBottomY = Math.max(textYPos, yPos + potentialLogoHeight);
    yPos = headerBlockBottomY + 8; // Padding below header

    // Quote info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO', pageWidth - margin, yPos, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${currentQuote.quoteNumber}`, pageWidth - margin, yPos + 6, { align: 'right' });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, yPos + 12, { align: 'right' });
    yPos += 25;

    // Client info
    doc.text(`Cliente: ${currentQuote.clientName}`, margin, yPos);
    if (currentQuote.clientContact) {
      doc.text(`Contato: ${currentQuote.clientContact}`, margin, yPos + 5);
      yPos += 5;
    }
    if (currentQuote.salespersonFullName) {
      doc.text(`Vendedor: ${currentQuote.salespersonFullName}`, margin, yPos + 5);
      yPos += 5;
    }
    yPos += 15;

    // Items table
    const tableBody = currentQuote.items.map(item => [
      item.productName,
      item.pricingModel === PricingModel.PER_SQUARE_METER 
        ? `${item.quantity.toFixed(2)} m²`
        : `${item.quantity} un`,
      formatCurrency(item.unitPrice * (1 + CARD_SURCHARGE_PERCENTAGE / 100)),
      formatCurrency(item.totalPrice * (1 + CARD_SURCHARGE_PERCENTAGE / 100))
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Produto/Serviço', 'Quantidade', 'Preço Unit.', 'Total']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40] },
      margin: { left: margin, right: margin }
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 10;

    // Totals
    if (currentQuote.discountAmountCalculated! > 0) {
      doc.text(`Desconto: ${formatCurrency(currentQuote.discountAmountCalculated!)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }
    doc.text(`Subtotal com Desconto: ${formatCurrency(currentQuote.subtotalAfterDiscount!)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
    
    // Totals section with both prices
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${formatCurrency(currentQuote.totalCard!)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total à Vista com Desconto: ${formatCurrency(currentQuote.totalCash!)}`, pageWidth - margin, yPos, { align: 'right' });
    
    // Payment method and installment info
    if (currentQuote.selectedPaymentMethod) {
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text(`Forma de Pagamento: ${currentQuote.selectedPaymentMethod}`, margin, yPos);
      
      // Add installment details if it's a credit card payment
      if (currentQuote.selectedPaymentMethod.toLowerCase().includes('cartão de crédito') && 
          currentQuote.selectedPaymentMethod.includes('x')) {
        const match = currentQuote.selectedPaymentMethod.match(/(\d+)x/);
        if (match && match[1]) {
          const installments = parseInt(match[1], 10);
          if (installments > 1) {
            const installmentValue = currentQuote.totalCard! / installments;
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            doc.text(`(${installments}x de ${formatCurrency(installmentValue)} no cartão)`, margin, yPos);
          }
        }
      }
    }
    
    // Additional quote details
    if (currentQuote.deliveryDeadline) {
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Prazo de Entrega: ${new Date(currentQuote.deliveryDeadline + 'T00:00:00').toLocaleDateString('pt-BR')}`, margin, yPos);
    }
    
    if (currentQuote.notes) {
      yPos += 8;
      doc.setFont('helvetica', 'italic');
      doc.text('Observações:', margin, yPos);
      yPos += 5;
      const notesLines = doc.splitTextToSize(currentQuote.notes, pageWidth - (2 * margin));
      doc.text(notesLines, margin, yPos);
    }

    doc.save(`Orcamento-${currentQuote.quoteNumber}.pdf`);
  };

  const handleCloseQuote = async () => {
    if (!currentQuote.id && !quoteId) {
      alert('Salve o orçamento primeiro antes de fechá-lo.');
      return;
    }

    if (window.confirm('Tem certeza que deseja fechar este orçamento? Esta ação marcará o orçamento como aceito.')) {
      setIsLoading(true);
      try {
        const quoteToUpdate = {
          ...currentQuote,
          id: quoteId || currentQuote.id!,
          status: 'accepted' as const
        };
        
        await updateQuote(quoteToUpdate as Quote);
        setCurrentQuote(prev => ({ ...prev, status: 'accepted' }));
        alert('Orçamento fechado com sucesso!');
      } catch (error) {
        console.error('Erro ao fechar orçamento:', error);
        alert('Erro ao fechar orçamento. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  if (productsLoading || customersLoading || companyLoading) {
    return (
      <div className="p-6 text-white flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-3">Carregando dados...</span>
      </div>
    );
  }

  const customerOptions = [
    { value: '', label: 'Selecione um cliente ou digite manualmente' },
    ...customers.map(customer => ({
      value: customer.id,
      label: customer.name
    }))
  ];

  const productOptions = [
    { value: '', label: 'Selecione um produto' },
    ...products.map(product => ({
      value: product.id,
      label: product.name
    }))
  ];

  const selectedProduct = products.find(p => p.id === newItem.productId);

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-yellow-500 mr-3" />
          <h2 className="text-2xl font-semibold text-white">
            {isEditing ? 'Editar Orçamento' : 'Criar Novo Orçamento'}
          </h2>
          {currentQuote.status && (
            <span className={`ml-4 px-3 py-1 text-xs rounded-full font-medium ${
              currentQuote.status === 'accepted' ? 'bg-green-600 text-white' :
              currentQuote.status === 'sent' ? 'bg-blue-600 text-white' :
              'bg-yellow-600 text-black'
            }`}>
              {currentQuote.status === 'accepted' ? 'Aceito' :
               currentQuote.status === 'sent' ? 'Enviado' : 'Rascunho'}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/')} variant="secondary">
            Cancelar
          </Button>
          <Button onClick={generatePDF} variant="outline" disabled={!currentQuote.items?.length}>
            {!isEditing ? 'Enviar Orçamento (PDF)' : 'Gerar PDF'}
          </Button>
          {(isEditing || currentQuote.status === 'sent') && currentQuote.status !== 'accepted' && (
            <Button 
              onClick={handleCloseQuote} 
              variant="success" 
              isLoading={isLoading}
              iconLeft={<CheckCircleIcon className="w-5 h-5" />}
            >
              Fechar Orçamento
            </Button>
          )}
          <Button 
            onClick={handleSaveQuote} 
            variant="primary" 
            isLoading={isLoading}
            iconLeft={<CheckCircleIcon className="w-5 h-5" />}
          >
            {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')} Orçamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Informações do Orçamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número do Orçamento"
                value={currentQuote.quoteNumber || ''}
                onChange={(e) => setCurrentQuote(prev => ({ ...prev, quoteNumber: e.target.value }))}
                disabled={isEditing}
              />
              <Select
                label="Cliente"
                options={customerOptions}
                value={currentQuote.customerId || ''}
                onChange={(e) => handleCustomerChange(e.target.value)}
              />
              <Input
                label="Nome do Cliente"
                value={currentQuote.clientName || ''}
                onChange={(e) => setCurrentQuote(prev => ({ ...prev, clientName: e.target.value }))}
                required
              />
              <Input
                label="Contato do Cliente"
                value={currentQuote.clientContact || ''}
                onChange={(e) => setCurrentQuote(prev => ({ ...prev, clientContact: formatPhoneNumber(e.target.value) }))}
              />
            </div>
          </div>

          {/* Add Items */}
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Adicionar Item</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={useCardPricing}
                    onChange={(e) => setUseCardPricing(e.target.checked)}
                    className="mr-2"
                  />
                  Usar preços de cartão
                </label>
              </div>
              
              <Select
                label="Produto"
                options={productOptions}
                value={newItem.productId || ''}
                onChange={(e) => handleProductSelect(e.target.value)}
              />

              {selectedProduct?.pricingModel === PricingModel.PER_SQUARE_METER ? (
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Largura (m)"
                    type="number"
                    step="0.01"
                    value={newItem.width || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, width: parseFloat(e.target.value) || undefined }))}
                  />
                  <Input
                    label="Altura (m)"
                    type="number"
                    step="0.01"
                    value={newItem.height || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, height: parseFloat(e.target.value) || undefined }))}
                  />
                  <Input
                    label="Quantidade de Peças"
                    type="number"
                    value={newItem.itemCountForAreaCalc || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, itemCountForAreaCalc: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              ) : (
                <Input
                  label="Quantidade"
                  type="number"
                  value={newItem.quantity || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                />
              )}

              <Button onClick={handleAddItem} variant="primary" iconLeft={<PlusIcon className="w-4 h-4" />}>
                Adicionar Item
              </Button>
            </div>
          </div>

          {/* Items List */}
          {currentQuote.items && currentQuote.items.length > 0 && (
            <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Itens do Orçamento</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Produto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Qtd</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Preço Unit.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {currentQuote.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-white">{item.productName}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">
                          {item.pricingModel === PricingModel.PER_SQUARE_METER 
                            ? `${item.quantity.toFixed(2)} m²`
                            : `${item.quantity} un`
                          }
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-300 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm text-gray-300 text-right">{formatCurrency(item.totalPrice)}</td>
                        <td className="px-4 py-2 text-center">
                          <Button
                            onClick={() => handleRemoveItem(index)}
                            variant="danger"
                            size="xs"
                            iconLeft={<TrashIcon className="w-4 h-4" />}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Resumo</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Subtotal:</span>
                <span className="text-white">{formatCurrency(calculatedTotals.subtotal)}</span>
              </div>
              
              <div className="space-y-2">
                <Select
                  label="Tipo de Desconto"
                  options={[
                    { value: 'none', label: 'Sem desconto' },
                    { value: 'percentage', label: 'Percentual' },
                    { value: 'fixed', label: 'Valor fixo' }
                  ]}
                  value={currentQuote.discountType || 'none'}
                  onChange={(e) => setCurrentQuote(prev => ({ ...prev, discountType: e.target.value as any }))}
                />
                
                {currentQuote.discountType !== 'none' && (
                  <Input
                    label={currentQuote.discountType === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}
                    type="number"
                    step="0.01"
                    value={currentQuote.discountValue || ''}
                    onChange={(e) => setCurrentQuote(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                  />
                )}
              </div>

              {calculatedTotals.discountAmount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(calculatedTotals.discountAmount)}</span>
                </div>
              )}

              <hr className="border-gray-600" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-white">Total (À Vista):</span>
                <span className="text-yellow-400">{formatCurrency(calculatedTotals.totalCash)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Total (Cartão):</span>
                <span className="text-gray-300">{formatCurrency(calculatedTotals.totalCard)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Detalhes Adicionais</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Status do Orçamento</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentQuote(prev => ({ ...prev, status: 'draft' }))}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                      currentQuote.status === 'draft' 
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300' 
                        : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-yellow-500/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-medium">Rascunho</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setCurrentQuote(prev => ({ ...prev, status: 'sent' }))}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                      currentQuote.status === 'sent' 
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300' 
                        : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">Enviado</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setCurrentQuote(prev => ({ ...prev, status: 'accepted' }))}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                      currentQuote.status === 'accepted' 
                        ? 'border-green-500 bg-green-500/20 text-green-300' 
                        : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Aceito</span>
                    </div>
                  </button>
                </div>
              </div>
              
              <Input
                label="Forma de Pagamento"
                value={currentQuote.selectedPaymentMethod || ''}
                onChange={(e) => setCurrentQuote(prev => ({ ...prev, selectedPaymentMethod: e.target.value }))}
                placeholder="Ex: PIX, Cartão 2x, Dinheiro"
              />
              <Select
                label="Forma de Pagamento"
                options={[
                  { value: '', label: 'Selecione a forma de pagamento' },
                  { value: 'PIX', label: 'PIX' },
                  { value: 'Cartão de Débito', label: 'Cartão de Débito' },
                  { value: 'Cartão de Crédito 1x', label: 'Cartão de Crédito 1x' },
                  { value: 'Cartão de Crédito 2x', label: 'Cartão de Crédito 2x' },
                  { value: 'Cartão de Crédito 3x', label: 'Cartão de Crédito 3x' },
                  { value: 'Cartão de Crédito 4x', label: 'Cartão de Crédito 4x' },
                  { value: 'Cartão de Crédito 5x', label: 'Cartão de Crédito 5x' },
                  { value: 'Cartão de Crédito 6x', label: 'Cartão de Crédito 6x' },
                  { value: 'Cartão de Crédito 7x', label: 'Cartão de Crédito 7x' },
                  { value: 'Cartão de Crédito 8x', label: 'Cartão de Crédito 8x' },
                  { value: 'Cartão de Crédito 9x', label: 'Cartão de Crédito 9x' },
                  { value: 'Cartão de Crédito 10x', label: 'Cartão de Crédito 10x' },
                ]}
                value={currentQuote.selectedPaymentMethod || ''}
                onChange={(e) => setCurrentQuote(prev => ({ ...prev, selectedPaymentMethod: e.target.value }))}
              />
              
              <Input
                label="Data de Pagamento"
                type="date"
                value={currentQuote.paymentDate || ''}
                onChange={(e) => setCurrentQuote(prev => ({ ...prev, paymentDate: e.target.value }))}
              />
              
              <Input
                label="Prazo de Entrega"
                type="date"
                value={currentQuote.deliveryDeadline || ''}
                onChange={(e) => setCurrentQuote(prev => ({ ...prev, deliveryDeadline: e.target.value }))}
              />
              
              <Textarea
                label="Observações"
                value={currentQuote.notes || ''}
                onChange={(e) => setCurrentQuote(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuotePage;