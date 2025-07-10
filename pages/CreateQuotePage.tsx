import React, { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Quote, QuoteItem, CompanyInfo, PricingModel, Customer, QuoteStatus, LoggedInUser } from '../types';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import { CARD_SURCHARGE_PERCENTAGE } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../utils'; 

const CUSTOMERS_STORAGE_KEY = 'customers';
const PRODUCTS_STORAGE_KEY = 'products';
const QUOTES_STORAGE_KEY = 'quotes';
const CURRENT_USER_STORAGE_KEY = 'currentUser'; // Key for logged-in user

const initialQuickCustomerState: Customer = {
  id: '', name: '', documentType: 'CPF', documentNumber: '', phone: '', email: '', address: '', city: '', postalCode: '', downPayments: []
};

const today = new Date();
const sevenDaysFromToday = new Date();
sevenDaysFromToday.setDate(today.getDate() + 7);

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const paymentMethodOptions = [
  { value: '', label: 'Selecione...' },
  { value: 'Dinheiro', label: 'Dinheiro' },
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
  { value: 'Boleto Bancário', label: 'Boleto Bancário' },
  { value: 'Transferência Bancária', label: 'Transferência Bancária' },
  { value: 'Outro', label: 'Outro (especificar)' },
];

const getInstallmentDetails = (paymentMethod: string | undefined, totalAmountForInstallments: number) => {
    if (!paymentMethod || !paymentMethod.toLowerCase().includes('cartão de crédito') || !paymentMethod.includes('x') || totalAmountForInstallments <= 0) {
      return null;
    }
    const match = paymentMethod.match(/(\d+)x/);
    if (match && match[1]) {
      const installments = parseInt(match[1], 10);
      if (installments > 0) {
        return {
          count: installments,
          value: totalAmountForInstallments / installments,
        };
      }
    }
    return null;
};

interface CreateQuotePageProps {
  currentUser: LoggedInUser | null; // Pass current user from App.tsx
}

const CreateQuotePage: React.FC<CreateQuotePageProps> = ({ currentUser: propCurrentUser }) => {
  const { quoteId } = useParams<{ quoteId?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!quoteId;

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(propCurrentUser);
  
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerAvailableCredit, setCustomerAvailableCredit] = useState<number>(0);
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantityForUnitProduct, setQuantityForUnitProduct] = useState<number>(1);
  const [itemWidth, setItemWidth] = useState<number>(1);
  const [itemHeight, setItemHeight] = useState<number>(1);
  const [itemCountForArea, setItemCountForArea] = useState<number>(1);

  const [currentQuoteNumber, setCurrentQuoteNumber] = useState<string>('');
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('draft');

  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(formatDateForInput(today));
  const [deliveryDeadline, setDeliveryDeadline] = useState<string>(formatDateForInput(sevenDaysFromToday));
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string>(''); 
  const [lastDownPaymentApplied, setLastDownPaymentApplied] = useState<number>(0);


  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState<Customer>(initialQuickCustomerState);
  const [isSavingQuickCustomer, setIsSavingQuickCustomer] = useState(false);
  const [pageTitle, setPageTitle] = useState('Criar Novo Orçamento');

  const selectedProductDetails = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    // Load loggedInUser from localStorage if not passed or if prop is null (e.g., page refresh)
    if (!loggedInUser) {
      const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (storedUser) {
        setLoggedInUser(JSON.parse(storedUser));
      }
    }
    const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (storedProducts) setProducts(JSON.parse(storedProducts));
    
    const storedCustomers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (storedCustomers) {
         const parsedCustomers: Customer[] = JSON.parse(storedCustomers).map((c: Customer) => ({
            ...initialQuickCustomerState, 
            ...c,
            downPayments: c.downPayments || [], 
          }));
        setCustomers(parsedCustomers);
    }
    
    const storedCompanyInfo = localStorage.getItem('companyInfo');
    if (storedCompanyInfo) setCompanyInfo(JSON.parse(storedCompanyInfo));

    if (isEditMode && quoteId) {
      const allQuotes: Quote[] = JSON.parse(localStorage.getItem(QUOTES_STORAGE_KEY) || '[]');
      const quoteToEdit = allQuotes.find(q => q.id === quoteId);
      if (quoteToEdit) {
        setPageTitle(`Editar Orçamento - ${quoteToEdit.quoteNumber}`);
        // Client name, contact, and available credit will be set by the other useEffect reacting to selectedCustomerId
        setSelectedCustomerId(quoteToEdit.customerId || '');
        setQuoteItems(quoteToEdit.items);
        setDiscountType(quoteToEdit.discountType);
        setDiscountValue(quoteToEdit.discountValue);
        setSelectedPaymentMethod(quoteToEdit.selectedPaymentMethod || '');
        setCustomPaymentMethod(''); // Reset custom, will be re-evaluated if 'Outro'
        setPaymentDate(quoteToEdit.paymentDate || formatDateForInput(today));
        setDeliveryDeadline(quoteToEdit.deliveryDeadline || formatDateForInput(sevenDaysFromToday));
        setQuoteNotes(quoteToEdit.notes || '');
        setCurrentQuoteNumber(quoteToEdit.quoteNumber);
        setQuoteStatus(quoteToEdit.status);
        setOriginalCreatedAt(quoteToEdit.createdAt);
        setLastDownPaymentApplied(quoteToEdit.downPaymentApplied || 0);
        // No need to set clientName, clientContact, customerAvailableCredit here directly,
        // as the effect listening to selectedCustomerId will handle it.
      } else {
        alert("Orçamento não encontrado para edição.");
        navigate('/quotes/new');
      }
    } else {
      // Reset for new quote
      setPageTitle('Criar Novo Orçamento');
      setClientName('');
      setClientContact('');
      setSelectedCustomerId('');
      setCustomerAvailableCredit(0);
      setQuoteItems([]);
      setDiscountType('none');
      setDiscountValue(0);
      setSelectedPaymentMethod('');
      setCustomPaymentMethod('');
      setPaymentDate(formatDateForInput(today));
      setDeliveryDeadline(formatDateForInput(sevenDaysFromToday));
      setQuoteNotes('');
      setCurrentQuoteNumber(''); 
      setQuoteStatus('draft');
      setOriginalCreatedAt('');
      setLastDownPaymentApplied(0);
    }
  }, [quoteId, isEditMode, navigate, loggedInUser, propCurrentUser]); // Removed 'customers' from dependency array


  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setClientName(customer.name);
        setClientContact(customer.phone || customer.email || '');
        const totalCredit = (customer.downPayments || []).reduce((sum, dp) => sum + dp.amount, 0);
        setCustomerAvailableCredit(totalCredit);
      } else {
         // Customer not found in the current list, reset related fields
         setClientName(''); // Reset name if selected customer not found
         setClientContact(''); // Reset contact
         setCustomerAvailableCredit(0);
      }
    } else {
        // Only reset clientName and clientContact if not in edit mode with a quote already loaded
        if (!isEditMode || !currentQuoteNumber) { 
            setClientName('');
            setClientContact('');
        }
        setCustomerAvailableCredit(0);
    }
  }, [selectedCustomerId, customers, isEditMode, currentQuoteNumber]);

  const getProductPrice = (product: Product, type: 'cash' | 'card'): number => {
    const baseCash = product.customCashPrice ?? product.basePrice;
    if (type === 'cash') return baseCash;
    return product.customCardPrice ?? (baseCash * (1 + CARD_SURCHARGE_PERCENTAGE / 100));
  };
  
  const handleAddItem = () => {
    if (!selectedProductId) {
      alert("Selecione um produto.");
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const unitPrice = getProductPrice(product, 'cash'); 
    let newItem: QuoteItem;

    if (product.pricingModel === PricingModel.PER_SQUARE_METER) {
      if (itemWidth <= 0 || itemHeight <= 0 || itemCountForArea <= 0) {
        alert("Para produtos por m², insira Largura, Altura e Nº de Peças válidos (maiores que zero).");
        return;
      }
      const calculatedArea = itemWidth * itemHeight * itemCountForArea;
      newItem = {
        productId: product.id,
        productName: product.name,
        quantity: calculatedArea,
        unitPrice: unitPrice, 
        totalPrice: unitPrice * calculatedArea,
        pricingModel: product.pricingModel,
        width: itemWidth,
        height: itemHeight,
        itemCountForAreaCalc: itemCountForArea,
      };
    } else { 
      if (quantityForUnitProduct <= 0) {
        alert("Insira uma quantidade válida (maior que zero).");
        return;
      }
      newItem = {
        productId: product.id,
        productName: product.name,
        quantity: quantityForUnitProduct,
        unitPrice: unitPrice, 
        totalPrice: unitPrice * quantityForUnitProduct,
        pricingModel: product.pricingModel,
      };
    }
    
    setQuoteItems([...quoteItems, newItem]);
    setSelectedProductId(''); 
    setQuantityForUnitProduct(1); 
    setItemWidth(1);
    setItemHeight(1);
    setItemCountForArea(1);
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };
  
  const calculateAllTotals = () => {
    const subtotal = quoteItems.reduce((acc, item) => acc + item.totalPrice, 0);

    let discountAmountCalculated = 0;
    if (discountType === 'percentage') {
      discountAmountCalculated = (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed') {
      discountAmountCalculated = discountValue;
    }
    discountAmountCalculated = Math.max(0, Math.min(discountAmountCalculated, subtotal));

    const subtotalAfterDiscount = subtotal - discountAmountCalculated;
    // These are totals BEFORE customer's existing credit is applied
    const totalCash = subtotalAfterDiscount;
    const totalCard = totalCash * (1 + CARD_SURCHARGE_PERCENTAGE / 100);

    return { 
        subtotal,
        discountAmountCalculated, 
        subtotalAfterDiscount, 
        totalCash, 
        totalCard 
    };
  };

  const { subtotal, discountAmountCalculated, subtotalAfterDiscount, totalCash, totalCard } = calculateAllTotals();
  
  // For display in summary - these are pre-credit
  const installmentDetailsPreCredit = getInstallmentDetails(selectedPaymentMethod, totalCard);

  // For display in summary - these are post-credit (estimated)
  const finalTotalCashAfterCredit = Math.max(0, totalCash - customerAvailableCredit);
  const finalTotalCardAfterCredit = Math.max(0, totalCard - customerAvailableCredit);
  const installmentDetailsAfterCredit = getInstallmentDetails(selectedPaymentMethod, finalTotalCardAfterCredit);

  
  const generateQuoteNumber = () => `ORC-${Date.now().toString().slice(-6)}`;

  const handleSaveQuote = (
    statusToSave: QuoteStatus = quoteStatus, 
    options?: { preventNavigation?: boolean; silent?: boolean; }
  ) => {
    if (!clientName && !selectedCustomerId) {
      alert("Por favor, selecione um cliente ou insira o nome do cliente."); return false;
    }
    if (quoteItems.length === 0) {
      alert("Adicione pelo menos um item ao orçamento."); return false;
    }
    if (!companyInfo) {
      alert("Informações da empresa não encontradas. Configure em 'Empresa'."); return false;
    }
    if (!loggedInUser) {
      alert("Informações do usuário não encontradas. Por favor, faça login novamente."); return false;
    }
    
    const resolvedQuoteNumber = isEditMode && currentQuoteNumber ? currentQuoteNumber : generateQuoteNumber();
    if (!currentQuoteNumber && !isEditMode) setCurrentQuoteNumber(resolvedQuoteNumber);


    const { subtotal: finalSubtotal, discountAmountCalculated: finalDiscountAmount, subtotalAfterDiscount: finalSubtotalAfterDiscount, totalCash: finalTotalCashPreCredit, totalCard: finalTotalCardPreCredit } = calculateAllTotals();

    const finalClientName = selectedCustomerId ? customers.find(c=>c.id === selectedCustomerId)?.name || clientName : clientName;
    const finalClientContact = selectedCustomerId ? customers.find(c=>c.id === selectedCustomerId)?.phone || customers.find(c=>c.id === selectedCustomerId)?.email || clientContact : clientContact;
    const finalPaymentMethod = selectedPaymentMethod === 'Outro' ? customPaymentMethod : selectedPaymentMethod;

    let actualDownPaymentAppliedOnAccept = 0;
    if (statusToSave === 'accepted' || statusToSave === 'converted_to_order') {
        const baseAmountForPayment = (finalPaymentMethod.toLowerCase().includes('cartão')) ? finalTotalCardPreCredit : finalTotalCashPreCredit;
        actualDownPaymentAppliedOnAccept = Math.min(customerAvailableCredit, baseAmountForPayment);
    }
    // If editing an already accepted quote, retain its original downPaymentApplied unless status changes from accepted
    const downPaymentToStore = (isEditMode && (quoteStatus === 'accepted' || quoteStatus === 'converted_to_order') && (statusToSave === 'accepted' || statusToSave === 'converted_to_order'))
                               ? lastDownPaymentApplied
                               : actualDownPaymentAppliedOnAccept;


    const quoteData: Quote = {
      id: isEditMode && quoteId ? quoteId : Date.now().toString(),
      quoteNumber: resolvedQuoteNumber,
      customerId: selectedCustomerId || undefined,
      clientName: finalClientName,
      clientContact: finalClientContact,
      items: quoteItems,
      subtotal: finalSubtotal,
      discountType: discountType,
      discountValue: discountValue,
      discountAmountCalculated: finalDiscountAmount,
      subtotalAfterDiscount: finalSubtotalAfterDiscount,
      totalCash: finalTotalCashPreCredit, 
      totalCard: finalTotalCardPreCredit, 
      downPaymentApplied: downPaymentToStore,
      selectedPaymentMethod: finalPaymentMethod,
      paymentDate: paymentDate || undefined,
      deliveryDeadline: deliveryDeadline || undefined,
      notes: quoteNotes || undefined,
      createdAt: isEditMode && originalCreatedAt ? originalCreatedAt : new Date().toISOString(),
      status: statusToSave,
      companyInfoSnapshot: companyInfo,
      salespersonUsername: loggedInUser.username,
      salespersonFullName: loggedInUser.fullName || loggedInUser.username,
    };

    const existingQuotes: Quote[] = JSON.parse(localStorage.getItem(QUOTES_STORAGE_KEY) || '[]');
    let updatedQuotes;

    if (isEditMode) {
        updatedQuotes = existingQuotes.map(q => q.id === quoteData.id ? quoteData : q);
    } else {
        updatedQuotes = [...existingQuotes, quoteData];
    }
    
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(updatedQuotes));
    setQuoteStatus(statusToSave); 
    setLastDownPaymentApplied(downPaymentToStore);
    if (isEditMode) setCurrentQuoteNumber(quoteData.quoteNumber);

    if (!options?.silent) {
      alert(`Orçamento ${quoteData.quoteNumber} ${isEditMode ? 'atualizado' : 'salvo'} com status: ${statusToSave}!`);
    }
    
    if (!isEditMode && statusToSave === 'draft' && !options?.preventNavigation) { 
        setClientName('');
        setClientContact('');
        setSelectedCustomerId('');
        setCustomerAvailableCredit(0);
        setQuoteItems([]);
        setDiscountType('none');
        setDiscountValue(0);
        setSelectedPaymentMethod('');
        setCustomPaymentMethod('');
        setPaymentDate(formatDateForInput(today));
        setDeliveryDeadline(formatDateForInput(sevenDaysFromToday));
        setQuoteNotes('');
        setCurrentQuoteNumber(''); 
        setQuoteStatus('draft');
        setOriginalCreatedAt('');
        setLastDownPaymentApplied(0);
    } else if (statusToSave !== 'draft' && !options?.preventNavigation) {
      navigate('/'); 
    }
    return true;
  };
  
   const productOptions = products.map(p => ({ 
    value: p.id, 
    label: `${p.name} (${p.pricingModel === PricingModel.PER_UNIT ? `Por ${p.unit || 'Unidade de Venda'}` : 'Por m²'}) - R$ ${getProductPrice(p, 'cash').toFixed(2)} (À Vista)` 
  }));

  const customerOptions = [{ value: '', label: 'Selecione um cliente ou digite manualmente abaixo' }, ...customers.map(c => ({ value: c.id, label: `${c.name} (${c.documentNumber || c.phone || 'N/A'})` }))];

  const commonPDFStyles = (doc: jsPDF, isReceipt: boolean = false, quoteDetails: Quote) => {
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 10;
    let yPos = 15; 
    const lineHeight = 4; 

    const currentCustomerDetails = quoteDetails.customerId ? customers.find(c => c.id === quoteDetails.customerId) : null;
    const pdfClientName = quoteDetails.clientName;
    const pdfClientContact = currentCustomerDetails?.phone || currentCustomerDetails?.email || quoteDetails.clientContact;
    const pdfClientDocument = currentCustomerDetails?.documentNumber ? `${currentCustomerDetails.documentType}: ${currentCustomerDetails.documentNumber}` : '';

    let companyDetailsX = margin; 
    let potentialLogoHeight = 0;   

    const logoForPdf = quoteDetails.companyInfoSnapshot?.logoUrlLightBg; 

    if (logoForPdf && logoForPdf.startsWith('data:image')) {
        try {
            const imageMimeType = logoForPdf.substring(logoForPdf.indexOf(':') + 1, logoForPdf.indexOf(';'));
            const imageFormat = imageMimeType.split('/')[1]?.toUpperCase();

            if (imageFormat && (imageFormat === 'PNG' || imageFormat === 'JPEG' || imageFormat === 'JPG')) {
                const maxLogoDisplayWidth = 30; 
                const maxLogoDisplayHeight = 20;

                doc.addImage(
                    logoForPdf,
                    imageFormat,
                    margin, 
                    yPos,   
                    maxLogoDisplayWidth,
                    maxLogoDisplayHeight
                );
                companyDetailsX = margin + maxLogoDisplayWidth + 5; 
                potentialLogoHeight = maxLogoDisplayHeight; 
            } else {
                console.warn(`Formato de logo (PDF) não suportado: ${imageFormat}. Apenas PNG, JPEG/JPG são bem suportados. Logo não adicionado.`);
            }
        } catch (e) {
            console.error("Erro ao adicionar logo (PDF) ao PDF:", e);
        }
    }
    
    let textYPos = yPos; 
    if (quoteDetails.companyInfoSnapshot) {
        doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
        doc.text(quoteDetails.companyInfoSnapshot.name, companyDetailsX, textYPos); textYPos += (lineHeight + 2);
        
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        const addressLines = doc.splitTextToSize(quoteDetails.companyInfoSnapshot.address || '', pageWidth - companyDetailsX - margin);
        doc.text(addressLines, companyDetailsX, textYPos);
        textYPos += (addressLines.length * lineHeight);
        
        let contactLine = '';
        if (quoteDetails.companyInfoSnapshot.phone) contactLine += `Tel: ${quoteDetails.companyInfoSnapshot.phone}`;
        if (quoteDetails.companyInfoSnapshot.email) contactLine += `${quoteDetails.companyInfoSnapshot.phone ? ' | ' : ''}Email: ${quoteDetails.companyInfoSnapshot.email}`;
        if (contactLine) {
            doc.text(contactLine, companyDetailsX, textYPos); textYPos += lineHeight;
        }

        let webLine = '';
        if (quoteDetails.companyInfoSnapshot.instagram) webLine += `Instagram: ${quoteDetails.companyInfoSnapshot.instagram}`;
        if (quoteDetails.companyInfoSnapshot.website) webLine += `${quoteDetails.companyInfoSnapshot.instagram ? ' | ' : ''}Site: ${quoteDetails.companyInfoSnapshot.website}`;
         if (webLine) {
            doc.text(webLine, companyDetailsX, textYPos); textYPos += lineHeight;
        }

        if (quoteDetails.companyInfoSnapshot.cnpj) { doc.text(`CNPJ: ${quoteDetails.companyInfoSnapshot.cnpj}`, companyDetailsX, textYPos); textYPos += lineHeight;}
    }
    
    const headerBlockBottomY = Math.max(textYPos, yPos + potentialLogoHeight);
    yPos = headerBlockBottomY + 5; 

    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(isReceipt ? 'RECIBO / CONFIRMAÇÃO' : 'ORÇAMENTO', pageWidth - margin, yPos, { align: 'right' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    
    const qNumber = quoteDetails.quoteNumber;
    doc.text(`Número: ${qNumber}`, pageWidth - margin, yPos + 6, { align: 'right' });
    doc.text(`Data: ${new Date(quoteDetails.createdAt).toLocaleDateString('pt-BR')}`, pageWidth - margin, yPos + 11, { align: 'right' });
    yPos += 18; 

    doc.text(`Cliente: ${pdfClientName}`, margin, yPos); yPos += 5;
    if (pdfClientContact) { doc.text(`Contato: ${pdfClientContact}`, margin, yPos); yPos += 5; }
    if (pdfClientDocument) { doc.text(`Documento: ${pdfClientDocument}`, margin, yPos); yPos += 5; }

    if (quoteDetails.salespersonFullName) {
        doc.text(`Vendedor: ${quoteDetails.salespersonFullName}`, margin, yPos); yPos += 5;
    }
    yPos += 5; 

    return { doc, yPos, margin, pageWidth, pageHeight, qNumber };
  };

  const exportPdfLogic = (quoteDataForPdf: Quote, isReceipt: boolean) => {
    if (!quoteDataForPdf.companyInfoSnapshot || quoteDataForPdf.items.length === 0 || !quoteDataForPdf.clientName) {
      alert("Informações incompletas para gerar PDF. Verifique dados da empresa, cliente e itens."); return;
    }

    const pdfData = commonPDFStyles(new jsPDF(), isReceipt, quoteDataForPdf);
    let { doc, yPos, margin, pageWidth } = pdfData;

    const isProposal = !isReceipt;

    const tableBody = quoteDataForPdf.items.map(item => {
      const productDetails = products.find(p => p.id === item.productId);
      let qtyDisplay = '';
      if (item.pricingModel === PricingModel.PER_SQUARE_METER) {
          qtyDisplay = `${item.quantity.toFixed(2)} m² (${item.width}m x ${item.height}m x ${item.itemCountForAreaCalc}pç)`;
      } else {
          qtyDisplay = `${item.quantity} ${productDetails?.unit || 'un'}`;
      }
      
      if (isProposal && productDetails) {
        const unitCardPrice = getProductPrice(productDetails, 'card');
        return [
            item.productName, 
            qtyDisplay, 
            formatCurrency(unitCardPrice),
            formatCurrency(item.unitPrice),
        ];
      }

      // Fallback for receipt
      return [
          item.productName, 
          qtyDisplay, 
          formatCurrency(item.unitPrice),
          formatCurrency(item.totalPrice)
      ];
    });

    const head = isProposal
      ? [['Produto', 'Qtd', 'Preço Unit. (Cartão)', 'Preço Unit. (Com Desconto)']]
      : [['Produto', 'Qtd./Detalhes', 'Preço Unit. (Base)', 'Total Item (Base)']];
      
    const columnStyles = isProposal ? {
      0: { cellWidth: 'auto' as const }, // Produto
      1: { cellWidth: 14 },     // Qtd
      2: { cellWidth: 35, halign: 'right' as const }, // Preço Unit. (Cartão)
      3: { cellWidth: 40, halign: 'right' as const }, // Preço Unit. (Com Desconto)
    } : {
      0: { cellWidth: 'auto' as const }, // Produto
      1: { cellWidth: 50 },     // Qtd./Detalhes
      2: { cellWidth: 40, halign: 'right' as const }, // Preço Unit.
      3: { cellWidth: 40, halign: 'right' as const }, // Total
    };

    autoTable(doc, {
      startY: yPos,
      head: head,
      body: tableBody,
      theme: 'striped', headStyles: { fillColor: [40, 40, 40] }, bodyStyles: { textColor: [0,0,0] }, alternateRowStyles: { textColor: [0,0,0]}, margin: { left: margin, right: margin },
      columnStyles: columnStyles,
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 10; 
    doc.setTextColor(0,0,0); 

    const { subtotal: s, discountAmountCalculated: d, subtotalAfterDiscount: sad, totalCash: tc, totalCard: tcard, downPaymentApplied } = quoteDataForPdf; 
    
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    if (isReceipt) {
      doc.text(`Subtotal: ${formatCurrency(s)}`, pageWidth - margin, yPos, { align: 'right' }); yPos += 6;
    }
    if (d > 0) {
      doc.text(`Desconto Aplicado: ${formatCurrency(d)}`, pageWidth - margin, yPos, { align: 'right' }); yPos += 6;
    }
    
    if (isReceipt) {
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text(`Subtotal com Desconto: ${formatCurrency(sad)}`, pageWidth - margin, yPos, { align: 'right' }); yPos += 6;
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        
        const effectiveTotalBeforeCredit = (quoteDataForPdf.selectedPaymentMethod && quoteDataForPdf.selectedPaymentMethod.toLowerCase().includes('cartão')) 
                                        ? tcard
                                        : tc;
        const creditAppliedOnReceipt = downPaymentApplied || 0;
        const finalAmountDueOnReceipt = effectiveTotalBeforeCredit - creditAppliedOnReceipt;
        const receiptInstallmentDetails = getInstallmentDetails(quoteDataForPdf.selectedPaymentMethod, finalAmountDueOnReceipt);

        if (quoteDataForPdf.selectedPaymentMethod?.toLowerCase().includes('cartão')) {
            doc.text(`Total (Cartão - Antes do Sinal): ${formatCurrency(tcard)}`, pageWidth - margin, yPos, { align: 'right' }); yPos += 6;
        } else {
            doc.text(`Total (À Vista - Antes do Sinal): ${formatCurrency(tc)}`, pageWidth - margin, yPos, { align: 'right' }); yPos += 6;
        }

        if (creditAppliedOnReceipt > 0) {
            doc.text(`Sinal/Haver Utilizado: - ${formatCurrency(creditAppliedOnReceipt)}`, pageWidth - margin, yPos, { align: 'right' }); yPos += 6;
        }
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text(`VALOR FINAL PAGO/A PAGAR: ${formatCurrency(finalAmountDueOnReceipt)}`, pageWidth - margin, yPos, { align: 'right' }); yPos += 8;
        if (receiptInstallmentDetails) {
            doc.setFontSize(9);
            doc.text(`(Em ${receiptInstallmentDetails.count}x de ${formatCurrency(receiptInstallmentDetails.value)})`, pageWidth - margin, yPos, { align: 'right' }); yPos += 6;
        }

    } else { // Quote Proposal PDF
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL (Com Desconto): ${formatCurrency(tc)}`, pageWidth - margin, yPos, { align: 'right' }); yPos += 8;
        
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        let cardTotalText = `TOTAL (Cartão): ${formatCurrency(tcard)}`;
        const quoteInstallmentDetails = getInstallmentDetails(quoteDataForPdf.selectedPaymentMethod, tcard);
        if (quoteInstallmentDetails) {
            cardTotalText += ` (Em ${quoteInstallmentDetails.count}x de ${formatCurrency(quoteInstallmentDetails.value)})`;
        }
        doc.text(cardTotalText, pageWidth - margin, yPos, { align: 'right' }); yPos += 10;
    }


    const finalPaymentMethodText = quoteDataForPdf.selectedPaymentMethod;
    if (finalPaymentMethodText) { 
        let paymentDisplay = finalPaymentMethodText;
        if(isReceipt) {
            const finalAmountPaid = ( (quoteDataForPdf.selectedPaymentMethod && quoteDataForPdf.selectedPaymentMethod.toLowerCase().includes('cartão')) 
                                    ? tcard : tc) - (downPaymentApplied || 0);
            const receiptInstallmentText = getInstallmentDetails(quoteDataForPdf.selectedPaymentMethod, finalAmountPaid);
            if(receiptInstallmentText && paymentDisplay?.toLowerCase().includes('cartão de crédito')) {
                 paymentDisplay += ` (Em ${receiptInstallmentText.count}x de ${formatCurrency(receiptInstallmentText.value)})`;
            }
        }
        doc.text(`Forma de Pagamento${isReceipt ? '' : ' Sugerida'}: ${paymentDisplay}`, margin, yPos); yPos +=5; 
    }
    if (quoteDataForPdf.paymentDate && isReceipt) { doc.text(`Data do Pagamento: ${new Date(quoteDataForPdf.paymentDate + 'T00:00:00').toLocaleDateString('pt-BR')}`, margin, yPos); yPos +=5; }
    if (quoteDataForPdf.deliveryDeadline) { doc.text(`Prazo de Entrega${isReceipt ? '' : ' Estimado'}: ${new Date(quoteDataForPdf.deliveryDeadline + 'T00:00:00').toLocaleDateString('pt-BR')}`, margin, yPos); yPos +=5; }
    
    if (quoteDataForPdf.notes) {
        doc.setFontSize(9); doc.setFont('helvetica', 'italic');
        doc.text(isReceipt ? 'Observações Adicionais:' : 'Observações:', margin, yPos); yPos +=4;
        const splitNotes = doc.splitTextToSize(quoteDataForPdf.notes, pageWidth - (2 * margin));
        doc.text(splitNotes, margin, yPos);
        yPos += splitNotes.length * 4;
    }

    if (isReceipt) {
        yPos += 10; 
        doc.line(margin, yPos, pageWidth - margin, yPos); yPos += 8; 
        doc.text('Assinatura do Cliente', margin, yPos);
        doc.text('Assinatura da Empresa', pageWidth - margin - 50, yPos);
    }


    if (yPos > pdfData.pageHeight - 25) { doc.addPage(); yPos = margin; }
    doc.setFontSize(8); doc.setFont('helvetica', 'italic');
    doc.text(isReceipt ? 'Agradecemos a preferência!' : 'Obrigado pela sua preferência! Este orçamento é válido por 7 dias.', pdfData.pageWidth / 2, pdfData.pageHeight - margin - 5, { align: 'center' });

    doc.save(`${isReceipt ? 'Recibo': 'Orcamento'}-${pdfData.qNumber}.pdf`);
  };

  const handleExportQuotePDF = () => {
    const wasSaved = handleSaveQuote('draft', { silent: true, preventNavigation: true });
    if (wasSaved) {
        const allQuotes: Quote[] = JSON.parse(localStorage.getItem(QUOTES_STORAGE_KEY) || '[]');
        const currentId = isEditMode ? quoteId : allQuotes[allQuotes.length -1].id;
        const quoteToExport = allQuotes.find(q => q.id === currentId);

        if (quoteToExport) {
            exportPdfLogic(quoteToExport, false);
        } else {
             alert("Falha ao encontrar o orçamento salvo para gerar o PDF. Tente novamente.");
        }
    } else {
        alert("Falha ao salvar/atualizar o orçamento antes de gerar o PDF.");
    }
  };

  const handleAcceptAndGenerateReceipt = () => {
    // Pass { preventNavigation: true } to handleSaveQuote
    if (handleSaveQuote('accepted', { preventNavigation: true })) { 
        const allQuotes: Quote[] = JSON.parse(localStorage.getItem(QUOTES_STORAGE_KEY) || '[]');
        const currentId = isEditMode ? quoteId : allQuotes[allQuotes.length -1].id;
        const acceptedQuote = allQuotes.find((q: Quote) => q.id === currentId);

        if (acceptedQuote) {
            exportPdfLogic(acceptedQuote, true); // Generate PDF
            navigate('/'); // Navigate after PDF generation
        } else {
            alert("Erro ao encontrar o orçamento aceito para gerar o recibo após salvar.");
            // Optionally navigate even if PDF fails, or let user decide.
            // For now, if quote not found for PDF, we won't navigate from here to highlight the issue.
        }
    }
  };

  const handleQuickCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuickCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomer.name || !quickCustomer.phone) {
        alert("Nome e telefone são obrigatórios para cadastro rápido de cliente.");
        return;
    }
    setIsSavingQuickCustomer(true);
    const newCustomer: Customer = { ...quickCustomer, id: Date.now().toString(), downPayments: [] }; // Ensure downPayments is initialized
    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(updatedCustomers));
    
    setSelectedCustomerId(newCustomer.id);
    // setClientName and setClientContact will be handled by the useEffect for selectedCustomerId
    // setCustomerAvailableCredit will also be handled by that useEffect (0 for new customer)
    
    setIsSavingQuickCustomer(false);
    setIsQuickCustomerModalOpen(false);
    setQuickCustomer(initialQuickCustomerState);
  };

  if (!companyInfo && !localStorage.getItem('companyInfo') && !isEditMode) { 
    return (
      <div className="p-6 bg-[#1d1d1d] shadow-xl rounded-lg text-center text-white">
        <DocumentTextIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white">Informações da Empresa Não Encontradas</h2>
        <p className="text-gray-300">Por favor, configure as informações da sua empresa na seção "Empresa" antes de criar orçamentos.</p>
        <Button onClick={() => navigate('/settings')} variant="primary" className="mt-4">
          Configurar Empresa
        </Button>
      </div>
    );
  }
   if (!loggedInUser) {
    return (
      <div className="p-6 bg-[#1d1d1d] shadow-xl rounded-lg text-center text-white">
        <UserGroupIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white">Usuário não identificado</h2>
        <p className="text-gray-300">Não foi possível identificar o usuário. Por favor, tente fazer login novamente.</p>
        <Button onClick={() => navigate('/login')} variant="primary" className="mt-4">
          Ir para Login
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-black text-white">
      <div className="flex items-center mb-6">
        <DocumentTextIcon className="h-8 w-8 text-yellow-500 mr-3" />
        <h2 className="text-2xl font-semibold text-white">{pageTitle}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-end">
        <div className="md:col-span-2">
            <Select 
                label="Cliente"
                options={customerOptions}
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                disabled={isEditMode && !!selectedCustomerId && quoteStatus !== 'draft'} 
            />
        </div>
        <Button 
            onClick={() => setIsQuickCustomerModalOpen(true)}
            variant="secondary" 
            iconLeft={<PlusIcon className="w-4 h-4 mr-1"/>}
            disabled={isEditMode && !!selectedCustomerId && quoteStatus !== 'draft'}
        >
            Novo Cliente Rápido
        </Button>
      </div>
      {!selectedCustomerId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <Input label="Nome do Cliente (Manual)" value={clientName} onChange={(e) => setClientName(e.target.value)} disabled={!!selectedCustomerId || (isEditMode && !!currentQuoteNumber && quoteStatus !== 'draft')} />
            <Input label="Contato do Cliente (Manual)" value={clientContact} onChange={(e) => setClientContact(e.target.value)} disabled={!!selectedCustomerId || (isEditMode && !!currentQuoteNumber && quoteStatus !== 'draft')}/>
          </div>
      )}
      {selectedCustomerId && clientName && ( // Display details only if selectedCustomerId and clientName (derived) are present
          <div className="mb-4 p-3 bg-[#1d1d1d] border border-[#282828] rounded-md text-sm text-white">
              <p><strong>Cliente Selecionado:</strong> {clientName}</p>
              {clientContact && <p><strong>Contato:</strong> {clientContact}</p>}
              {customers.find(c=>c.id === selectedCustomerId)?.documentNumber && <p><strong>Documento:</strong> {customers.find(c=>c.id === selectedCustomerId)?.documentType} {customers.find(c=>c.id === selectedCustomerId)?.documentNumber}</p>}
              {customerAvailableCredit > 0 && <p className="text-green-400"><strong>Sinal/Haver Disponível:</strong> {formatCurrency(customerAvailableCredit)}</p>}
          </div>
      )}
      
      {loggedInUser && (
        <p className="text-sm text-gray-300 mb-6">
          Vendedor Responsável: <span className="font-medium text-white">{loggedInUser.fullName || loggedInUser.username}</span>
        </p>
      )}
      
      <div className="mb-6 p-4 border border-[#282828] rounded-md bg-[#1d1d1d]">
        <h3 className="text-lg font-medium text-white mb-3">Adicionar Itens ao Orçamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 items-end">
          <div className="md:col-span-2">
            <Select 
              label="Produto"
              options={productOptions}
              value={selectedProductId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProductId(e.target.value)}
              placeholder="Selecione um produto"
            />
          </div>

          {selectedProductDetails?.pricingModel === PricingModel.PER_SQUARE_METER && (
            <>
              <Input 
                label="Largura (m)"
                type="number"
                value={itemWidth}
                onChange={(e) => setItemWidth(Number(e.target.value))}
                min="0.01" step="0.01"
              />
              <Input 
                label="Altura (m)"
                type="number"
                value={itemHeight}
                onChange={(e) => setItemHeight(Number(e.target.value))}
                min="0.01" step="0.01"
              />
              <Input 
                label="Nº de Peças"
                type="number"
                value={itemCountForArea}
                onChange={(e) => setItemCountForArea(Number(e.target.value))}
                min="1" step="1"
              />
              {itemWidth > 0 && itemHeight > 0 && itemCountForArea > 0 &&
                <p className="text-sm text-gray-300 md:mt-6">
                    Área calculada: {(itemWidth * itemHeight * itemCountForArea).toFixed(2)} m²
                </p>
              }
            </>
          )}

          {selectedProductDetails?.pricingModel === PricingModel.PER_UNIT && (
            <Input 
              label={`Quantidade (${selectedProductDetails?.unit || 'unidades de venda'})`}
              type="number"
              value={quantityForUnitProduct}
              onChange={(e) => setQuantityForUnitProduct(Number(e.target.value))}
              min="1"
            />
          )}
          
           <div className="md:col-span-2 grid grid-cols-1 items-end">
            <Button onClick={handleAddItem} iconLeft={<PlusIcon className="w-5 h-5"/>} disabled={!selectedProductId} className="w-full mt-4 md:mt-0">Adicionar Item</Button>
           </div>
        </div>
      </div>

      {quoteItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-3">Itens do Orçamento</h3>
          <div className="overflow-x-auto border border-[#282828] rounded-md bg-[#1d1d1d]">
            <table className="min-w-full divide-y divide-[#282828]">
              <thead className="bg-[#282828]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Produto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Qtd./Detalhes</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Preço Unit. (À Vista)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Total Item (À Vista)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Ação</th>
                </tr>
              </thead>
              <tbody className="bg-black divide-y divide-[#282828]">
                {quoteItems.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  let qtyDisplay = '';
                  if (item.pricingModel === PricingModel.PER_SQUARE_METER) {
                    qtyDisplay = `${item.quantity.toFixed(2)} m²`;
                    if(item.width && item.height && item.itemCountForAreaCalc) {
                        qtyDisplay += ` (${item.width}m x ${item.height}m x ${item.itemCountForAreaCalc}pç)`;
                    }
                  } else {
                    qtyDisplay = `${item.quantity} ${product?.unit || 'un'}`;
                  }
                  return (
                    <tr key={index} className="hover:bg-[#1d1d1d]">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{item.productName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">{qtyDisplay}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">{formatCurrency(item.totalPrice)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Button onClick={() => handleRemoveItem(index)} variant="danger" size="xs" iconLeft={<TrashIcon className="w-4 h-4"/>} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

       <div className="mb-6 p-4 border border-[#282828] rounded-md bg-[#1d1d1d]">
        <h3 className="text-lg font-medium text-white mb-3">Descontos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Select
            label="Tipo de Desconto"
            options={[
              { value: 'none', label: 'Nenhum' },
              { value: 'percentage', label: 'Porcentagem (%)' },
              { value: 'fixed', label: 'Valor Fixo (R$)' },
            ]}
            value={discountType}
            onChange={(e) => {
              setDiscountType(e.target.value as 'percentage' | 'fixed' | 'none');
              if (e.target.value === 'none') setDiscountValue(0);
            }}
          />
          <Input
            label="Valor do Desconto"
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
            disabled={discountType === 'none'}
            min="0"
          />
          {discountAmountCalculated > 0 && (
             <p className="text-sm text-green-400 md:mt-6">Desconto aplicado: {formatCurrency(discountAmountCalculated)}</p>
          )}
        </div>
      </div>

      <div className="mb-6 p-4 border border-[#282828] rounded-md bg-[#1d1d1d]">
        <h3 className="text-lg font-medium text-white mb-3">Informações de Pagamento e Entrega</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Forma de Pagamento"
            options={paymentMethodOptions}
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
          />
          {selectedPaymentMethod === 'Outro' && (
            <Input
              label="Especifique a Forma de Pagamento"
              type="text"
              value={customPaymentMethod}
              onChange={(e) => setCustomPaymentMethod(e.target.value)}
            />
          )}
          <Input
            label="Data de Pagamento (Estimada)"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="text-white" 
            style={{ colorScheme: 'dark' }}
          />
          <Input
            label="Prazo de Entrega (Estimado)"
            type="date"
            value={deliveryDeadline}
            onChange={(e) => setDeliveryDeadline(e.target.value)}
            className="text-white"
            style={{ colorScheme: 'dark' }}
          />
        </div>
         <Textarea
            label="Observações Adicionais (para orçamento/recibo)"
            name="quoteNotes"
            value={quoteNotes}
            onChange={(e) => setQuoteNotes(e.target.value)}
            rows={3}
            className="mt-4"
        />
      </div>

      {quoteItems.length > 0 && (
        <div className="mt-6 p-6 bg-[#1d1d1d] rounded-lg shadow-xl">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">Resumo do Orçamento</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Subtotal:</span>
              <span className="font-medium text-white">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmountCalculated > 0 && (
              <>
                <div className="flex justify-between text-red-400">
                  <span className="text-gray-300">Desconto Aplicado:</span>
                  <span className="font-medium">- {formatCurrency(discountAmountCalculated)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-100">
                  <span>Subtotal com Desconto:</span>
                  <span>{formatCurrency(subtotalAfterDiscount)}</span>
                </div>
              </>
            )}
          </div>
          <hr className="my-3 border-[#282828]"/>
          {/* Pre-credit totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center mb-3">
            <div>
              <p className="text-md font-medium text-gray-200">TOTAL (À VISTA - sem sinal)</p>
              <p className="text-2xl font-bold text-yellow-500">{formatCurrency(totalCash)}</p>
            </div>
            <div>
              <p className="text-md font-medium text-gray-200">TOTAL (CARTÃO - sem sinal)</p>
              <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalCard)}</p>
              {installmentDetailsPreCredit && (
                <p className="text-xs text-yellow-300">
                  (Em {installmentDetailsPreCredit.count}x de {formatCurrency(installmentDetailsPreCredit.value)})
                </p>
              )}
            </div>
          </div>

          {/* Customer Credit Application Display */}
          {customerAvailableCredit > 0 && (
            <>
              <hr className="my-3 border-[#282828]"/>
              <div className="text-center my-3">
                <p className="text-md font-medium text-green-400">Sinal/Haver Disponível (Cliente): {formatCurrency(customerAvailableCredit)}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center text-green-300">
                 <div>
                    <p className="text-sm font-medium">FINAL (À VISTA com Sinal):</p>
                    <p className="text-xl font-bold">{formatCurrency(finalTotalCashAfterCredit)}</p>
                </div>
                <div>
                    <p className="text-sm font-medium">FINAL (CARTÃO com Sinal):</p>
                    <p className="text-xl font-bold">{formatCurrency(finalTotalCardAfterCredit)}</p>
                    {installmentDetailsAfterCredit && (
                    <p className="text-xs">
                        (Em {installmentDetailsAfterCredit.count}x de {formatCurrency(installmentDetailsAfterCredit.value)})
                    </p>
                    )}
                </div>
              </div>
               <hr className="my-3 border-[#282828]"/>
            </>
          )}
          <p className="text-xs text-gray-500 mt-4 text-center">
            Valores de cartão são aproximações e podem incluir taxas. Sinal/Haver é aplicado no fechamento.
          </p>
        </div>
      )}
      
      <div className="mt-8 flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3 [&>*]:w-full md:[&>*]:w-auto">
        <Button 
          onClick={() => handleSaveQuote('draft')} 
          variant="secondary" 
          size="lg" 
          disabled={quoteItems.length === 0 || (!clientName && !selectedCustomerId) }
        >
          {isEditMode ? 'Salvar Alterações do Rascunho' : 'Salvar Rascunho'}
        </Button>
        <Button 
          onClick={handleExportQuotePDF} 
          variant="primary" 
          size="lg" 
          disabled={quoteItems.length === 0 || (!clientName && !selectedCustomerId) || !companyInfo}
        >
          {isEditMode ? 'Atualizar e Gerar PDF (Proposta)' : 'Gerar PDF (Proposta)'}
        </Button>
         <Button 
          onClick={handleAcceptAndGenerateReceipt} 
          variant="success" 
          size="lg" 
          disabled={quoteItems.length === 0 || (!clientName && !selectedCustomerId) || !companyInfo || !selectedPaymentMethod}
        >
          {isEditMode && (quoteStatus === 'accepted' || quoteStatus === 'converted_to_order') ? 'Atualizar e Gerar Recibo' : 'Aceitar e Gerar Recibo'}
        </Button>
      </div>

      {isQuickCustomerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-black p-8 rounded-lg shadow-xl w-full max-w-lg text-white border border-[#282828]">
            <h3 className="text-xl font-semibold mb-6 text-white">Adicionar Novo Cliente (Rápido)</h3>
            <form onSubmit={handleSaveQuickCustomer} className="space-y-4">
              <Input label="Nome / Razão Social" name="name" value={quickCustomer.name} onChange={handleQuickCustomerInputChange} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Tipo de Documento" name="documentType" value={quickCustomer.documentType} onChange={handleQuickCustomerInputChange} options={[{ value: 'CPF', label: 'CPF' }, { value: 'CNPJ', label: 'CNPJ' }, { value: 'N/A', label: 'N/A' }]} />
                <Input label="Número do Documento" name="documentNumber" value={quickCustomer.documentNumber || ''} onChange={handleQuickCustomerInputChange} disabled={quickCustomer.documentType === 'N/A'} />
              </div>
              <Input label="Telefone" name="phone" type="tel" value={quickCustomer.phone} onChange={handleQuickCustomerInputChange} required />
              <Input label="Email (Opcional)" name="email" type="email" value={quickCustomer.email || ''} onChange={handleQuickCustomerInputChange} />
              <Textarea label="Endereço (Rua, Nº, Bairro)" name="address" value={quickCustomer.address || ''} onChange={handleQuickCustomerInputChange} rows={2} />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Cidade (Opcional)" name="city" value={quickCustomer.city || ''} onChange={handleQuickCustomerInputChange} />
                <Input label="CEP (Opcional)" name="postalCode" value={quickCustomer.postalCode || ''} onChange={handleQuickCustomerInputChange} placeholder="Ex: 00000-000"/>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => { setIsQuickCustomerModalOpen(false); setQuickCustomer(initialQuickCustomerState); }}>Cancelar</Button>
                <Button type="submit" variant="primary" isLoading={isSavingQuickCustomer}>{isSavingQuickCustomer ? "Salvando..." : 'Adicionar Cliente'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuotePage;