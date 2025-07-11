import bcrypt from 'bcryptjs';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { 
  CompanyInfo, 
  Category, 
  Product, 
  Customer, 
  DownPaymentEntry, 
  Quote, 
  QuoteItem,
  Supplier,
  Debt,
  SupplierCredit,
  AccountsPayableEntry,
  User,
  UserAccessLevel
} from '../types';

// Helper function to check if Supabase is configured
const checkSupabaseConnection = () => {
  if (!supabase) {
    console.warn('Supabase not configured. Operations will be skipped.');
    return false;
  }
  return true;
};

// Helper function to get fallback data from localStorage
const getLocalStorageFallback = (key: string, defaultValue: any = []) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper function to save data to localStorage
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Company Services
export const companyService = {
  async getCompany(): Promise<CompanyInfo | null> {
    console.log('companyService.getCompany: Starting...');
    
    // First check localStorage
    const stored = localStorage.getItem('companyInfo');
    console.log('companyService.getCompany: localStorage data:', stored);
    
    if (!checkSupabaseConnection()) {
      console.warn('Supabase not configured, using localStorage fallback');
      const result = stored ? JSON.parse(stored) : null;
      console.log('Company loaded from localStorage:', result);
      return result;
    }
    
    try {
      console.log('companyService.getCompany: Querying Supabase');
      // Always get the first company record (there should only be one)
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .single();
      
      console.log('companyService.getCompany: Supabase response:', { data, error });
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.log('companyService.getCompany: Error from Supabase, falling back to localStorage');
        console.warn('Supabase error, using fallback:', error.message);
        // Fallback to localStorage
        const result = stored ? JSON.parse(stored) : null;
        console.log('Company loaded from localStorage (after error):', result);
        return result;
      }
      
      if (!data || error?.code === 'PGRST116') {
        console.log('companyService.getCompany: No data from Supabase, checking localStorage');
        // Check localStorage as fallback
        const result = stored ? JSON.parse(stored) : null;
        console.log('Company loaded from localStorage (no data):', result);
        return result;
      }
      
      const result = {
        name: data.name,
        logoUrlDarkBg: data.logo_url_dark_bg || '',
        logoUrlLightBg: data.logo_url_light_bg || '',
        address: data.address,
        phone: data.phone,
        email: data.email,
        cnpj: data.cnpj,
        instagram: data.instagram,
        website: data.website,
      };
      console.log('Company loaded from Supabase:', result);
      
      // Save to localStorage as backup
      localStorage.setItem('companyInfo', JSON.stringify(result));
      console.log('Company data saved to localStorage as backup');
      
      return result;
    } catch (error) {
      console.error('companyService.getCompany: Catch block error:', error);
      console.warn('Supabase error in catch block, using fallback:', error);
      // Fallback to localStorage
      const result = stored ? JSON.parse(stored) : null;
      console.log('Company loaded from localStorage (catch):', result);
      return result;
    }
  },

  async saveCompany(company: CompanyInfo): Promise<void> {
    if (!checkSupabaseConnection()) {
      console.warn('Supabase not configured, using localStorage fallback');
      localStorage.setItem('companyInfo', JSON.stringify(company));
      return;
    }
    
    try {
      // Always try to get the first company record
      const { data: existingCompanies, error: selectError } = await supabase
        .from('companies')
        .select('id');
      
      if (selectError && selectError.code !== 'PGRST116') {
        handleSupabaseError(selectError);
        // Fallback to localStorage
        localStorage.setItem('companyInfo', JSON.stringify(company));
        return;
      }
      
      const companyData = {
        name: company.name,
        logo_url_dark_bg: company.logoUrlDarkBg || null,
        logo_url_light_bg: company.logoUrlLightBg || null,
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        cnpj: company.cnpj || '',
        instagram: company.instagram || '',
        website: company.website || '',
        updated_at: new Date().toISOString(),
      };
      
      let result;
      if (existingCompanies && existingCompanies.length > 0) {
        // Update the first existing record
        result = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', existingCompanies[0].id);
          
        // If there are multiple company records, delete the extras
        if (existingCompanies.length > 1) {
          console.log(`Found ${existingCompanies.length} company records, cleaning up extras...`);
          const extraIds = existingCompanies.slice(1).map(c => c.id);
          await supabase
            .from('companies')
            .delete()
            .in('id', extraIds);
          console.log('Cleaned up extra company records');
        }
      } else {
        // Insert new record
        result = await supabase
          .from('companies')
          .insert(companyData);
      }
      
      if (result.error) {
        handleSupabaseError(result.error);
        // Fallback to localStorage
        localStorage.setItem('companyInfo', JSON.stringify(company));
        return;
      }
      
      // Always save to localStorage as backup
      localStorage.setItem('companyInfo', JSON.stringify(company));
      console.log('Company data saved successfully to both Supabase and localStorage');
    } catch (error) {
      console.error('Error saving company data:', error);
      // Fallback to localStorage
      localStorage.setItem('companyInfo', JSON.stringify(company));
      return;
    }
  }
};

// Category Services
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    if (!checkSupabaseConnection()) {
      return getLocalStorageFallback('categories', []);
    }
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.warn('Error loading categories from Supabase:', error);
        return getLocalStorageFallback('categories', []);
      }
      
      const result = data?.map(item => ({
        id: item.id,
        name: item.name,
      })) || [];
      
      // Save to localStorage as backup
      saveToLocalStorage('categories', result);
      return result;
    } catch (error) {
      console.warn('Error in getCategories:', error);
      return getLocalStorageFallback('categories', []);
    }
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      
      return {
        id: data.id,
        name: data.name,
      };
    } catch (error) {
      handleSupabaseError(error);
      return { id: '', name: '' };
    }
  },

  async updateCategory(category: Category): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', category.id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  }
};

// Product Services
export const productService = {
  async getProducts(): Promise<Product[]> {
    if (!checkSupabaseConnection()) {
      return getLocalStorageFallback('products', []);
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) {
        console.warn('Error loading products from Supabase:', error);
        return getLocalStorageFallback('products', []);
      }
      
      const result = data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        pricingModel: item.pricing_model as any,
        basePrice: Number(item.base_price),
        unit: item.unit,
        customCashPrice: item.custom_cash_price ? Number(item.custom_cash_price) : undefined,
        customCardPrice: item.custom_card_price ? Number(item.custom_card_price) : undefined,
        supplierCost: item.supplier_cost ? Number(item.supplier_cost) : undefined,
        categoryId: item.category_id || undefined,
      })) || [];
      
      // Save to localStorage as backup
      saveToLocalStorage('products', result);
      return result;
    } catch (error) {
      console.warn('Error in getProducts:', error);
      return getLocalStorageFallback('products', []);
    }
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          description: product.description,
          pricing_model: product.pricingModel,
          base_price: product.basePrice,
          unit: product.unit,
          custom_cash_price: product.customCashPrice,
          custom_card_price: product.customCardPrice,
          supplier_cost: product.supplierCost,
          category_id: product.categoryId,
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        pricingModel: data.pricing_model as any,
        basePrice: Number(data.base_price),
        unit: data.unit,
        customCashPrice: data.custom_cash_price ? Number(data.custom_cash_price) : undefined,
        customCardPrice: data.custom_card_price ? Number(data.custom_card_price) : undefined,
        supplierCost: data.supplier_cost ? Number(data.supplier_cost) : undefined,
        categoryId: data.category_id || undefined,
      };
    } catch (error) {
      handleSupabaseError(error);
      return { id: '', name: '', description: '', pricingModel: 'unidade', basePrice: 0, unit: 'un' };
    }
  },

  async updateProduct(product: Product): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          description: product.description,
          pricing_model: product.pricingModel,
          base_price: product.basePrice,
          unit: product.unit,
          custom_cash_price: product.customCashPrice,
          custom_card_price: product.customCardPrice,
          supplier_cost: product.supplierCost,
          category_id: product.categoryId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  }
};

// Customer Services
export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (customersError) handleSupabaseError(customersError);
      
      const { data: downPaymentsData, error: downPaymentsError } = await supabase
        .from('customer_down_payments')
        .select('*');
      
      if (downPaymentsError) handleSupabaseError(downPaymentsError);
      
      return customersData?.map(customer => ({
        id: customer.id,
        name: customer.name,
        documentType: customer.document_type as any,
        documentNumber: customer.document_number,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        postalCode: customer.postal_code,
        downPayments: downPaymentsData?.filter(dp => dp.customer_id === customer.id).map(dp => ({
          id: dp.id,
          amount: Number(dp.amount),
          date: dp.date,
          description: dp.description,
        })) || [],
      })) || [];
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: customer.name,
          document_type: customer.documentType,
          document_number: customer.documentNumber,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          postal_code: customer.postalCode,
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      
      // Insert down payments
      if (customer.downPayments.length > 0) {
        const { error: dpError } = await supabase
          .from('customer_down_payments')
          .insert(
            customer.downPayments.map(dp => ({
              customer_id: data.id,
              amount: dp.amount,
              date: dp.date,
              description: dp.description,
            }))
          );
        
        if (dpError) handleSupabaseError(dpError);
      }
      
      return {
        id: data.id,
        name: data.name,
        documentType: data.document_type as any,
        documentNumber: data.document_number,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        postalCode: data.postal_code,
        downPayments: customer.downPayments,
      };
    } catch (error) {
      handleSupabaseError(error);
      return { id: '', name: '', documentType: 'CPF', documentNumber: '', phone: '', email: '', address: '', city: '', postalCode: '', downPayments: [] };
    }
  },

  async updateCustomer(customer: Customer): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          document_type: customer.documentType,
          document_number: customer.documentNumber,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          postal_code: customer.postalCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id);
      
      if (error) handleSupabaseError(error);
      
      // Delete existing down payments and insert new ones
      const { error: deleteError } = await supabase
        .from('customer_down_payments')
        .delete()
        .eq('customer_id', customer.id);
      
      if (deleteError) handleSupabaseError(deleteError);
      
      if (customer.downPayments.length > 0) {
        const { error: insertError } = await supabase
          .from('customer_down_payments')
          .insert(
            customer.downPayments.map(dp => ({
              customer_id: customer.id,
              amount: dp.amount,
              date: dp.date,
              description: dp.description,
            }))
          );
        
        if (insertError) handleSupabaseError(insertError);
      }
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  }
};

// Quote Services
export const quoteService = {
  async getQuotes(): Promise<Quote[]> {
    if (!checkSupabaseConnection()) {
      return getLocalStorageFallback('quotes', []);
    }
    
    try {
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (quotesError) {
        console.warn('Error loading quotes from Supabase:', quotesError);
        return getLocalStorageFallback('quotes', []);
      }
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*');
      
      if (itemsError) {
        console.warn('Error loading quote items from Supabase:', itemsError);
        // Continue without items data
      }
      
      const result = quotesData?.map(quote => ({
        id: quote.id,
        quoteNumber: quote.quote_number,
        customerId: quote.customer_id || undefined,
        clientName: quote.client_name,
        clientContact: quote.client_contact,
        items: itemsData?.filter(item => item.quote_id === quote.id).map(item => ({
          productId: item.product_id || '',
          productName: item.product_name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
          pricingModel: item.pricing_model as any,
          width: item.width ? Number(item.width) : undefined,
          height: item.height ? Number(item.height) : undefined,
          itemCountForAreaCalc: item.item_count_for_area_calc || undefined,
        })) || [],
        subtotal: Number(quote.subtotal),
        discountType: quote.discount_type as any,
        discountValue: Number(quote.discount_value),
        discountAmountCalculated: Number(quote.discount_amount_calculated),
        subtotalAfterDiscount: Number(quote.subtotal_after_discount),
        totalCash: Number(quote.total_cash),
        totalCard: Number(quote.total_card),
        downPaymentApplied: Number(quote.down_payment_applied),
        selectedPaymentMethod: quote.selected_payment_method,
        paymentDate: quote.payment_date || undefined,
        deliveryDeadline: quote.delivery_deadline || undefined,
        createdAt: quote.created_at,
        status: quote.status as any,
        companyInfoSnapshot: quote.company_info_snapshot as CompanyInfo,
        notes: quote.notes,
        salespersonUsername: quote.salesperson_username,
        salespersonFullName: quote.salesperson_full_name,
      })) || [];
      
      // Save to localStorage as backup
      saveToLocalStorage('quotes', result);
      return result;
    } catch (error) {
      console.warn('Error in getQuotes:', error);
      return getLocalStorageFallback('quotes', []);
    }
  },

  async createQuote(quote: Omit<Quote, 'id'>): Promise<Quote> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert({
          quote_number: quote.quoteNumber,
          customer_id: quote.customerId,
          client_name: quote.clientName,
          client_contact: quote.clientContact,
          subtotal: quote.subtotal,
          discount_type: quote.discountType,
          discount_value: quote.discountValue,
          discount_amount_calculated: quote.discountAmountCalculated,
          subtotal_after_discount: quote.subtotalAfterDiscount,
          total_cash: quote.totalCash,
          total_card: quote.totalCard,
          down_payment_applied: quote.downPaymentApplied,
          selected_payment_method: quote.selectedPaymentMethod,
          payment_date: quote.paymentDate,
          delivery_deadline: quote.deliveryDeadline,
          status: quote.status,
          company_info_snapshot: quote.companyInfoSnapshot,
          notes: quote.notes,
          salesperson_username: quote.salespersonUsername,
          salesperson_full_name: quote.salespersonFullName,
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      
      // Insert quote items
      if (quote.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(
            quote.items.map(item => ({
              quote_id: data.id,
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total_price: item.totalPrice,
              pricing_model: item.pricingModel,
              width: item.width,
              height: item.height,
              item_count_for_area_calc: item.itemCountForAreaCalc,
            }))
          );
        
        if (itemsError) handleSupabaseError(itemsError);
      }
      
      return {
        ...quote,
        id: data.id,
      };
    } catch (error) {
      handleSupabaseError(error);
      return { id: '', quoteNumber: '', customerId: undefined, clientName: '', clientContact: '', items: [], subtotal: 0, discountType: 'none', discountValue: 0, discountAmountCalculated: 0, subtotalAfterDiscount: 0, totalCash: 0, totalCard: 0, downPaymentApplied: 0, selectedPaymentMethod: '', paymentDate: undefined, deliveryDeadline: undefined, createdAt: '', status: 'draft', companyInfoSnapshot: { name: '', logoUrlDarkBg: '', logoUrlLightBg: '', address: '', phone: '', email: '', cnpj: '', instagram: '', website: '' }, notes: '', salespersonUsername: '', salespersonFullName: '' };
    }
  },

  async updateQuote(quote: Quote): Promise<void> {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          quote_number: quote.quoteNumber,
          customer_id: quote.customerId,
          client_name: quote.clientName,
          client_contact: quote.clientContact,
          subtotal: quote.subtotal,
          discount_type: quote.discountType,
          discount_value: quote.discountValue,
          discount_amount_calculated: quote.discountAmountCalculated,
          subtotal_after_discount: quote.subtotalAfterDiscount,
          total_cash: quote.totalCash,
          total_card: quote.totalCard,
          down_payment_applied: quote.downPaymentApplied,
          selected_payment_method: quote.selectedPaymentMethod,
          payment_date: quote.paymentDate,
          delivery_deadline: quote.deliveryDeadline,
          status: quote.status,
          company_info_snapshot: quote.companyInfoSnapshot,
          notes: quote.notes,
          salesperson_username: quote.salespersonUsername,
          salesperson_full_name: quote.salespersonFullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quote.id);
      
      if (error) handleSupabaseError(error);
      
      // Delete existing items and insert new ones
      const { error: deleteError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', quote.id);
      
      if (deleteError) handleSupabaseError(deleteError);
      
      if (quote.items.length > 0) {
        const { error: insertError } = await supabase
          .from('quote_items')
          .insert(
            quote.items.map(item => ({
              quote_id: quote.id,
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total_price: item.totalPrice,
              pricing_model: item.pricingModel,
              width: item.width,
              height: item.height,
              item_count_for_area_calc: item.itemCountForAreaCalc,
            }))
          );
        
        if (insertError) handleSupabaseError(insertError);
      }
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async deleteQuote(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  }
};

// Supplier Services
export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) handleSupabaseError(error);
      
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        cnpj: item.cnpj,
        phone: item.phone,
        email: item.email,
        address: item.address,
        notes: item.notes,
      })) || [];
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          name: supplier.name,
          cnpj: supplier.cnpj,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          notes: supplier.notes,
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      
      return {
        id: data.id,
        name: data.name,
        cnpj: data.cnpj,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
      };
    } catch (error) {
      handleSupabaseError(error);
      return { id: '', name: '', cnpj: '', phone: '', email: '', address: '', notes: '' };
    }
  },

  async updateSupplier(supplier: Supplier): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: supplier.name,
          cnpj: supplier.cnpj,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          notes: supplier.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplier.id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async deleteSupplier(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async getSupplierDebts(): Promise<Debt[]> {
    try {
      const { data, error } = await supabase
        .from('supplier_debts')
        .select('*')
        .order('date_added', { ascending: false });
      
      if (error) handleSupabaseError(error);
      
      return data?.map(item => ({
        id: item.id,
        supplierId: item.supplier_id,
        description: item.description,
        totalAmount: Number(item.total_amount),
        dateAdded: item.date_added,
      })) || [];
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createSupplierDebt(debt: Omit<Debt, 'id'>): Promise<Debt> {
    try {
      const { data, error } = await supabase
        .from('supplier_debts')
        .insert({
          supplier_id: debt.supplierId,
          description: debt.description,
          total_amount: debt.totalAmount,
          date_added: debt.dateAdded,
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      
      return {
        id: data.id,
        supplierId: data.supplier_id,
        description: data.description,
        totalAmount: Number(data.total_amount),
        dateAdded: data.date_added,
      };
    } catch (error) {
      handleSupabaseError(error);
      return { id: '', supplierId: '', description: '', totalAmount: 0, dateAdded: '' };
    }
  },

  async deleteSupplierDebt(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('supplier_debts')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async getSupplierCredits(): Promise<SupplierCredit[]> {
    try {
      const { data, error } = await supabase
        .from('supplier_credits')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) handleSupabaseError(error);
      
      return data?.map(item => ({
        id: item.id,
        supplierId: item.supplier_id,
        amount: Number(item.amount),
        date: item.date,
        description: item.description,
      })) || [];
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createSupplierCredit(credit: Omit<SupplierCredit, 'id'>): Promise<SupplierCredit> {
    try {
      const { data, error } = await supabase
        .from('supplier_credits')
        .insert({
          supplier_id: credit.supplierId,
          amount: credit.amount,
          date: credit.date,
          description: credit.description,
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      
      return {
        id: data.id,
        supplierId: data.supplier_id,
        amount: Number(data.amount),
        date: data.date,
        description: data.description,
      };
    } catch (error) {
      handleSupabaseError(error);
      return { id: '', supplierId: '', amount: 0, date: '', description: '' };
    }
  },

  async deleteSupplierCredit(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('supplier_credits')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  }
};

// Accounts Payable Services
export const accountsPayableService = {
  async getAccountsPayable(): Promise<AccountsPayableEntry[]> {
    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .order('due_date');
      
      if (error) handleSupabaseError(error);
      
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        dueDate: item.due_date,
        isPaid: item.is_paid,
        createdAt: item.created_at,
        notes: item.notes,
        seriesId: item.series_id || undefined,
        totalInstallmentsInSeries: item.total_installments_in_series || undefined,
        installmentNumberOfSeries: item.installment_number_of_series || undefined,
      })) || [];
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createAccountsPayable(entries: Omit<AccountsPayableEntry, 'id'>[]): Promise<AccountsPayableEntry[]> {
    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .insert(
          entries.map(entry => ({
            name: entry.name,
            amount: entry.amount,
            due_date: entry.dueDate,
            is_paid: entry.isPaid,
            notes: entry.notes,
            series_id: entry.seriesId,
            total_installments_in_series: entry.totalInstallmentsInSeries,
            installment_number_of_series: entry.installmentNumberOfSeries,
          }))
        )
        .select();
      
      if (error) handleSupabaseError(error);
      
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        dueDate: item.due_date,
        isPaid: item.is_paid,
        createdAt: item.created_at,
        notes: item.notes,
        seriesId: item.series_id || undefined,
        totalInstallmentsInSeries: item.total_installments_in_series || undefined,
        installmentNumberOfSeries: item.installment_number_of_series || undefined,
      })) || [];
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async updateAccountsPayable(entry: AccountsPayableEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          name: entry.name,
          amount: entry.amount,
          due_date: entry.dueDate,
          is_paid: entry.isPaid,
          notes: entry.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async deleteAccountsPayable(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async deleteAccountsPayableBySeries(seriesId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .delete()
        .eq('series_id', seriesId);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  }
};

// User Services
export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('username');
      
      if (error) handleSupabaseError(error);
      
      return data?.map(item => ({
        id: item.id,
        username: item.username,
        fullName: item.full_name,
        password: '', // Never return password hash
        role: item.role as UserAccessLevel,
      })) || [];
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createUser(user: Omit<User, 'id'> & { password: string }): Promise<User> {
    try {
      // Hash the password properly
      const passwordHash = await bcrypt.hash(user.password, 10);
      
      const { data, error } = await supabase
        .from('app_users')
        .insert({
          username: user.username,
          full_name: user.fullName,
          password_hash: passwordHash,
          role: user.role,
        })
        .select()
        .single();
      
      if (error) handleSupabaseError(error);
      
      return {
        id: data.id,
        username: data.username,
        fullName: data.full_name,
        password: '',
        role: data.role as UserAccessLevel,
      };
    } catch (error) {
      handleSupabaseError(error);
      return { id: '', username: '', fullName: '', password: '', role: 'sales' };
    }
  },

  async updateUser(user: User & { password?: string }): Promise<void> {
    try {
      const updateData: any = {
        username: user.username,
        full_name: user.fullName,
        role: user.role,
        updated_at: new Date().toISOString(),
      };
      
      if (user.password) {
        updateData.password_hash = await bcrypt.hash(user.password, 10);
      }
      
      const { error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
      return;
    }
  },

  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, data.password_hash);
      if (!isValidPassword) {
        return null;
      }
      
      return {
        id: data.id,
        username: data.username,
        fullName: data.full_name,
        password: '',
        role: data.role as UserAccessLevel,
      };
    } catch (error) {
      handleSupabaseError(error);
      return null;
    }
  },

  // Get user by email
  async getUserByEmail(email: string) {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', email.split('@')[0])
        .single();
      
      if (error) {
        console.log('User not found in app_users table:', error.message);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Error fetching user by email:', error);
      return null;
    }
  }
};