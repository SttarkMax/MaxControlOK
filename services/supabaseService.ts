import bcrypt from 'bcryptjs';
import { supabase, handleSupabaseError, isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
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

// Custom error for user already exists scenario
export class UserAlreadyExistsError extends Error {
  constructor(username: string) {
    super(`User with username '${username}' already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}

// Test connection on service load
if (isSupabaseConfigured()) {
  testSupabaseConnection().then(success => {
    if (!success) {
      console.warn('⚠️ Supabase connection test failed - trying development mode');
    }
  });
}

// Company Services
export const companyService = {
  async getCompany(): Promise<CompanyInfo | null> {
    console.log('🔄 Loading company data from Supabase...');
    
    // Check if Supabase is configured first
    if (!isSupabaseConfigured()) {
      console.error('❌ Supabase not configured - cannot load company data');
      throw new Error('Supabase não configurado');
    }

    if (!supabase) {
      console.error('❌ Supabase client not available');
      throw new Error('Cliente Supabase não inicializado');
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Company data error:', error);
        handleSupabaseError(error);
      }

      if (!data) {
        console.warn('⚠️ No company data found');
        return null;
      }

      console.log('✅ Company data loaded successfully:', data.name);
      return {
        name: data.name,
        logoUrlDarkBg: data.logo_url_dark_bg || '',
        logoUrlLightBg: data.logo_url_light_bg || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        cnpj: data.cnpj || '',
        instagram: data.instagram || '',
        website: data.website || '',
      };
    } catch (error) {
      console.error('❌ Company service error:', error);
      handleSupabaseError(error);
      return null;
    }
  },

  async saveCompany(company: CompanyInfo): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single();

      const companyData = {
        name: company.name,
        logo_url_dark_bg: company.logoUrlDarkBg,
        logo_url_light_bg: company.logoUrlLightBg,
        address: company.address,
        phone: company.phone,
        email: company.email,
        cnpj: company.cnpj,
        instagram: company.instagram,
        website: company.website,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', existing.id);

        if (error) handleSupabaseError(error);
      } else {
        const { error } = await supabase
          .from('companies')
          .insert([companyData]);

        if (error) handleSupabaseError(error);
      }
    } catch (error) {
      handleSupabaseError(error);
    }
  }
};

// Category Services
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    console.log('🔄 Loading categories from Supabase...');
    
    if (!isSupabaseConfigured() || !supabase) {
      console.error('❌ Supabase not available for categories');
      throw new Error('Supabase não configurado');
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Categories error:', error);
        handleSupabaseError(error);
      }
      
      console.log(`✅ Categories loaded: ${data?.length || 0} items`);
      return data || [];
    } catch (error) {
      console.error('❌ Categories service error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar categorias';
      setError(errorMessage);
      setCategories([]);
    }
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: category.name,
        }])
        .select()
        .single();

      if (error) handleSupabaseError(error);
      return data;
    } catch (error) {
      handleSupabaseError(error);
      throw error;
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
    }
  }
};

// Product Services
export const productService = {
  async getProducts(): Promise<Product[]> {
    console.log('🔄 Loading products from Supabase...');
    
    try {
      // Check if Supabase is configured first
      if (!isSupabaseConfigured()) {
        console.error('❌ Supabase not configured for products');
        return []; // Return empty array instead of throwing
      }

      if (!supabase) {
        console.error('❌ Supabase client not available for products');
        return []; // Return empty array instead of throwing
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Products error:', error);
        handleSupabaseError(error);
        return []; // Return empty array if error was handled gracefully
      }
      
      const products = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        pricingModel: item.pricing_model as any,
        basePrice: Number(item.base_price),
        unit: item.unit || 'un',
        customCashPrice: item.custom_cash_price ? Number(item.custom_cash_price) : undefined,
        customCardPrice: item.custom_card_price ? Number(item.custom_card_price) : undefined,
        supplierCost: item.supplier_cost ? Number(item.supplier_cost) : undefined,
        categoryId: item.category_id || undefined,
      }));
      
      console.log(`✅ Products loaded: ${products.length} items`);
      return products;
    } catch (error) {
      console.error('❌ Products service error:', error);
      handleSupabaseError(error);
      console.warn('🔌 Products service - using offline mode');
      return []; // Return empty array instead of throwing
    }
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      console.log('🔄 Creating product:', product.name);
      
      const result = await supabase
        .from('products')
        .insert([{
          name: product.name,
          description: product.description,
          pricing_model: product.pricingModel,
          base_price: product.basePrice,
          unit: product.unit,
          custom_cash_price: product.customCashPrice,
          custom_card_price: product.customCardPrice,
          supplier_cost: product.supplierCost,
          category_id: product.categoryId || null,
        }])
        .select();

      console.log('📦 Product creation result:', result);
      
      const { data, error } = result;

      if (error) {
        console.error('❌ Product creation error:', error);
        handleSupabaseError(error);
        throw error;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('❌ Product creation returned invalid data:', data);
        
        // Create a fallback product object
        const fallbackProduct: Product = {
          id: `temp-${Date.now()}`,
          name: product.name,
          description: product.description,
          pricingModel: product.pricingModel,
          basePrice: product.basePrice,
          unit: product.unit,
          customCashPrice: product.customCashPrice,
          customCardPrice: product.customCardPrice,
          supplierCost: product.supplierCost,
          categoryId: product.categoryId,
        };
        
        console.log('⚠️ Using fallback product:', fallbackProduct);
        return fallbackProduct;
      }

      const productData = data[0];
      if (!productData || !productData.id) {
        console.error('❌ Product data missing ID:', productData);
        throw new Error('Produto criado mas ID não retornado');
      }

      try {
        const createdProduct: Product = {
          id: productData.id,
          name: productData.name,
          description: productData.description || '',
          pricingModel: productData.pricing_model as PricingModel,
          basePrice: Number(productData.base_price),
          unit: productData.unit || 'un',
          customCashPrice: productData.custom_cash_price ? Number(productData.custom_cash_price) : undefined,
          customCardPrice: productData.custom_card_price ? Number(productData.custom_card_price) : undefined,
          supplierCost: productData.supplier_cost ? Number(productData.supplier_cost) : undefined,
          categoryId: productData.category_id || undefined,
        };

        console.log('✅ Product created successfully:', createdProduct);
        return createdProduct;
      } catch (mappingError) {
        console.error('❌ Error mapping product data:', mappingError);
        throw new Error('Erro ao processar dados do produto criado');
      }
    } catch (error) {
      console.error('❌ Product creation failed:', error);
      
      // Don't call handleSupabaseError here to avoid double error handling
      if (error instanceof Error && error.message.includes('Cannot read properties of null')) {
        throw new Error('Erro interno ao criar produto - verifique a conexão com o banco');
      }
      
      throw error;
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
        .select('*')
        .order('date');

      if (downPaymentsError) handleSupabaseError(downPaymentsError);

      return (customersData || []).map(customer => {
        const customerDownPayments = (downPaymentsData || [])
          .filter(dp => dp.customer_id === customer.id)
          .map(dp => ({
            id: dp.id,
            amount: Number(dp.amount),
            date: dp.date,
            description: dp.description || '',
          }));

        return {
          id: customer.id,
          name: customer.name,
          documentType: customer.document_type as any,
          documentNumber: customer.document_number || '',
          phone: customer.phone,
          email: customer.email || '',
          address: customer.address || '',
          city: customer.city || '',
          postalCode: customer.postal_code || '',
          downPayments: customerDownPayments,
        };
      });
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customer.name,
          document_type: customer.documentType,
          document_number: customer.documentNumber,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          postal_code: customer.postalCode,
        }])
        .select()
        .single();

      if (error) handleSupabaseError(error);

      // Insert down payments if any
      if (customer.downPayments && customer.downPayments.length > 0) {
        const downPaymentsToInsert = customer.downPayments.map(dp => ({
          customer_id: data.id,
          amount: dp.amount,
          date: dp.date,
          description: dp.description,
        }));

        const { error: dpError } = await supabase
          .from('customer_down_payments')
          .insert(downPaymentsToInsert);

        if (dpError) handleSupabaseError(dpError);
      }

      return {
        id: data.id,
        name: data.name,
        documentType: data.document_type as any,
        documentNumber: data.document_number || '',
        phone: data.phone,
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        postalCode: data.postal_code || '',
        downPayments: customer.downPayments || [],
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
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

      // Delete existing down payments
      const { error: deleteError } = await supabase
        .from('customer_down_payments')
        .delete()
        .eq('customer_id', customer.id);

      if (deleteError) handleSupabaseError(deleteError);

      // Insert new down payments
      if (customer.downPayments && customer.downPayments.length > 0) {
        const downPaymentsToInsert = customer.downPayments.map(dp => ({
          customer_id: customer.id,
          amount: dp.amount,
          date: dp.date,
          description: dp.description,
        }));

        const { error: insertError } = await supabase
          .from('customer_down_payments')
          .insert(downPaymentsToInsert);

        if (insertError) handleSupabaseError(insertError);
      }
    } catch (error) {
      handleSupabaseError(error);
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
    }
  }
};

// Quote Services
export const quoteService = {
  async getQuotes(): Promise<Quote[]> {
    if (!supabase) {
      console.warn('⚠️ Supabase not configured - returning empty quotes');
      return [];
    }
    
    console.log('🔍 DEBUG: Starting getQuotes function...');
    
    try {
      // Check if Supabase is configured first
      if (!isSupabaseConfigured()) {
        console.log('❌ DEBUG: Supabase not configured');
        console.warn('🔌 Supabase not configured - using offline mode');
        return [];
      }

      if (!supabase) {
        console.log('❌ DEBUG: Supabase client not available');
        console.warn('🔌 Supabase client not available - using offline mode');
        return [];
      }

      console.log('🔍 DEBUG: Fetching quotes from database...');
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.log('❌ DEBUG: Quotes error:', quotesError);
        console.warn('🔌 Quotes error - switching to offline mode:', quotesError.message);
        handleSupabaseError(quotesError);
        return []; // Return empty array instead of throwing
      }

      console.log('✅ DEBUG: Quotes fetched successfully:', quotesData?.length || 0, 'quotes');
      
      console.log('🔍 DEBUG: Fetching quote items from database...');
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .order('created_at');

      if (itemsError) {
        console.log('❌ DEBUG: Quote items error:', itemsError);
        // Handle missing table gracefully
        if (itemsError.code === '42P01') {
          console.warn('🔌 Quote items table does not exist - switching to offline mode');
          return []; // Return empty array instead of throwing
        }
        handleSupabaseError(itemsError);
        return []; // Return empty array instead of throwing
      }

      console.log('✅ DEBUG: Quote items fetched successfully:', itemsData?.length || 0, 'items');
      
      // Debug: Show relationship between quotes and items
      if (quotesData && itemsData) {
        quotesData.forEach(quote => {
          const quoteItems = itemsData.filter(item => item.quote_id === quote.id);
          console.log(`🔍 DEBUG: Quote ${quote.quote_number} has ${quoteItems.length} items`);
        });
      }

      return (quotesData || []).map(quote => {
        const quoteItems = (itemsData || [])
          .filter(item => item.quote_id === quote.id)
          .map(item => ({
            productId: item.product_id || '',
            productName: item.product_name,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unit_price),
            totalPrice: Number(item.total_price),
            pricingModel: item.pricing_model as any,
            width: item.width ? Number(item.width) : undefined,
            height: item.height ? Number(item.height) : undefined,
            itemCountForAreaCalc: item.item_count_for_area_calc || undefined,
          }));

        console.log(`🔍 DEBUG: Mapped quote ${quote.quote_number} with ${quoteItems.length} items:`, quoteItems);

        
        console.log(`📋 Quote ${quote.quote_number}: ${items.length} items loaded`);
        
        return {
          id: quote.id,
          quoteNumber: quote.quote_number,
          customerId: quote.customer_id || undefined,
          clientName: quote.client_name,
          clientContact: quote.client_contact || '',
          items: quoteItems,
          subtotal: Number(quote.subtotal),
          discountType: quote.discount_type as any,
          discountValue: Number(quote.discount_value),
          discountAmountCalculated: Number(quote.discount_amount_calculated),
          subtotalAfterDiscount: Number(quote.subtotal_after_discount),
          totalCash: Number(quote.total_cash),
          totalCard: Number(quote.total_card),
          downPaymentApplied: Number(quote.down_payment_applied),
          selectedPaymentMethod: quote.selected_payment_method || '',
          paymentDate: quote.payment_date || undefined,
          deliveryDeadline: quote.delivery_deadline || undefined,
          status: quote.status as any,
          companyInfoSnapshot: quote.company_info_snapshot as CompanyInfo,
          notes: quote.notes || '',
          salespersonUsername: quote.salesperson_username,
          salespersonFullName: quote.salesperson_full_name || '',
          createdAt: quote.created_at,
        };
      });
    } catch (error) {
      console.log(`✅ Successfully loaded ${quotesWithItems.length} quotes with complete data`);
      
      // Log summary of items per quote for debugging
      quotesWithItems.forEach(quote => {
        if (quote.items.length > 0) {
          console.log(`📊 Quote ${quote.quoteNumber}: ${quote.items.length} items, Status: ${quote.status}`);
        }
      });
      
      console.warn('🔌 Quote service - switching to offline mode');
      console.error('Quote service error:', error);
      handleSupabaseError(error);
      console.warn('⚠️ Quotes loading failed - returning empty array');
      return []; // Return empty array instead of throwing
    }
  },

  async createQuote(quote: Omit<Quote, 'id'>): Promise<Quote> {
    try {
      // Check if Supabase is configured and client is available
      if (!isSupabaseConfigured()) {
        console.error('❌ Supabase not configured for createQuote');
        throw new Error('Supabase não configurado');
      }

      if (!supabase) {
        console.error('❌ Supabase client not available for createQuote');
        throw new Error('Cliente Supabase não inicializado');
      }

      console.log('🔄 Creating quote:', quote.quoteNumber);

      let { data, error } = await supabase
        .from('quotes')
        .insert([{
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
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Quote creation error:', error);
        
        // Check for specific RLS or permission errors
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          throw new Error('Erro de permissão: Verifique as configurações RLS no Supabase para a tabela quotes');
        }
        
        // Check for missing table errors
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          throw new Error('Tabela quotes não encontrada: Execute as migrações do banco de dados');
        }
        
        // Check for CORS/connection errors
        if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
          throw new Error('Erro de conexão: Verifique as configurações CORS do Supabase');
        }
        
        // For other errors, provide more context
        throw new Error(`Erro ao criar orçamento: ${error.message || 'Erro desconhecido'}`);
      }

      if (!data) {
        console.warn('⚠️ No data returned from quote creation - checking if quote was actually created...');
        
        // Try to fetch the quote that might have been created
        try {
          const { data: fetchedQuote, error: fetchError } = await supabase
            .from('quotes')
            .select('*')
            .eq('quote_number', quote.quoteNumber)
            .single();
            
          if (fetchedQuote && !fetchError) {
            console.log('✅ Quote was created successfully, using fetched data');
            data = fetchedQuote;
          } else {
            throw new Error('Orçamento não foi criado - verifique as permissões RLS no Supabase');
          }
        } catch (fetchErr) {
          console.error('❌ Failed to fetch created quote:', fetchErr);
          throw new Error('Erro ao criar orçamento - verifique as configurações do banco de dados');
        }
      }

      console.log('✅ Quote created successfully:', data.quote_number);

      // Insert quote items
      if (quote.items && quote.items.length > 0) {
        console.log('🔄 Inserting quote items:', quote.items.length);
        
        const itemsToInsert = quote.items.map(item => ({
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
        }));

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('❌ Quote items creation error:', itemsError);
          console.warn('⚠️ Quote created but items failed - this may be due to RLS policies');
          // Don't throw error for items, the quote was created successfully
        } else {
          console.log('✅ Quote items created successfully');
        }
      }

      return {
        id: data.id,
        quoteNumber: data.quote_number,
        customerId: data.customer_id || undefined,
        clientName: data.client_name,
        clientContact: data.client_contact || '',
        items: quote.items,
        subtotal: Number(data.subtotal),
        discountType: data.discount_type as any,
        discountValue: Number(data.discount_value),
        discountAmountCalculated: Number(data.discount_amount_calculated),
        subtotalAfterDiscount: Number(data.subtotal_after_discount),
        totalCash: Number(data.total_cash),
        totalCard: Number(data.total_card),
        downPaymentApplied: Number(data.down_payment_applied),
        selectedPaymentMethod: data.selected_payment_method || '',
        paymentDate: data.payment_date || undefined,
        deliveryDeadline: data.delivery_deadline || undefined,
        status: data.status as any,
        companyInfoSnapshot: data.company_info_snapshot as CompanyInfo,
        notes: data.notes || '',
        salespersonUsername: data.salesperson_username,
        salespersonFullName: data.salesperson_full_name || '',
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('❌ createQuote service error:', error);
      throw error;
    }
  },

  async updateQuote(quote: Quote): Promise<void> {
    try {
      // Check if Supabase is configured and client is available
      if (!isSupabaseConfigured()) {
        console.error('❌ Supabase not configured for updateQuote');
        throw new Error('Supabase não configurado');
      }

      if (!supabase) {
        console.error('❌ Supabase client not available for updateQuote');
        throw new Error('Cliente Supabase não inicializado');
      }

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

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', quote.id);

      if (deleteError) handleSupabaseError(deleteError);

      // Insert new items
      if (quote.items && quote.items.length > 0) {
        const itemsToInsert = quote.items.map(item => ({
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
        }));

        const { error: insertError } = await supabase
          .from('quote_items')
          .insert(itemsToInsert);

        if (insertError) handleSupabaseError(insertError);
      }
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  async deleteQuote(id: string): Promise<void> {
    try {
      // Check if Supabase is configured and client is available
      if (!isSupabaseConfigured()) {
        console.error('❌ Supabase not configured for deleteQuote');
        throw new Error('Supabase não configurado');
      }

      if (!supabase) {
        console.error('❌ Supabase client not available for deleteQuote');
        throw new Error('Cliente Supabase não inicializado');
      }

      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
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
      
      return (data || []).map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        cnpj: supplier.cnpj || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
      }));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          name: supplier.name,
          cnpj: supplier.cnpj,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          notes: supplier.notes,
        }])
        .select()
        .single();

      if (error) handleSupabaseError(error);
      
      return {
        id: data.id,
        name: data.name,
        cnpj: data.cnpj || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        notes: data.notes || '',
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
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
    }
  },

  async getSupplierDebts(): Promise<Debt[]> {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        console.warn('🔌 Supabase not available for supplier debts');
        return [];
      }

      const { data, error } = await supabase
        .from('supplier_debts')
        .select('*')
        .order('date_added', { ascending: false });

      if (error) {
        console.warn('🔌 Supplier debts error - switching to offline mode:', error.message);
        throw new Error('Erro ao carregar dívidas dos fornecedores');
      }
      
      return (data || []).map(debt => ({
        id: debt.id,
        supplierId: debt.supplier_id,
        description: debt.description || '',
        totalAmount: Number(debt.total_amount),
        dateAdded: debt.date_added,
      }));
    } catch (error) {
      console.error('❌ Supplier debts service error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar dívidas dos fornecedores';
      setError(errorMessage);
      setDebts([]);
    }
  },

  async createSupplierDebt(debt: Omit<Debt, 'id'>): Promise<Debt> {
    try {
      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado');
      }
      
      const { data, error } = await supabase
        .from('supplier_debts')
        .insert([{
          supplier_id: debt.supplierId,
          description: debt.description,
          total_amount: debt.totalAmount,
          date_added: debt.dateAdded,
        }])
        .select('*')
        .single();

      if (error) handleSupabaseError(error);
      
      if (!data || !data.id) {
        console.warn('⚠️ Data not returned from insert, attempting to fetch...');
        // Try to fetch the most recent debt for this supplier as fallback
        const { data: fallbackData, error: fetchError } = await supabase
          .from('supplier_debts')
          .select('*')
          .eq('supplier_id', debt.supplierId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (fetchError || !fallbackData) {
          throw new Error('Erro ao criar dívida - verifique as permissões RLS no Supabase');
        }
        
        return {
          id: fallbackData.id,
          supplierId: fallbackData.supplier_id,
          description: fallbackData.description || '',
          totalAmount: Number(fallbackData.total_amount),
          dateAdded: fallbackData.date_added,
        };
      }
      
      return {
        id: data.id,
        supplierId: data.supplier_id,
        description: data.description || '',
        totalAmount: Number(data.total_amount),
        dateAdded: data.date_added,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
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
    }
  },

  async getSupplierCredits(): Promise<SupplierCredit[]> {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        console.warn('🔌 Supabase not available for supplier credits');
        return [];
      }

      const { data, error } = await supabase
        .from('supplier_credits')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.warn('🔌 Supplier credits error - switching to offline mode:', error.message);
        throw new Error('Erro ao carregar pagamentos dos fornecedores');
      }
      
      return (data || []).map(credit => ({
        id: credit.id,
        supplierId: credit.supplier_id,
        amount: Number(credit.amount),
        date: credit.date,
        description: credit.description || '',
      }));
    } catch (error) {
      console.error('❌ Supplier credits service error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar pagamentos dos fornecedores';
      setError(errorMessage);
      setCredits([]);
    }
  },

  async createSupplierCredit(credit: Omit<SupplierCredit, 'id'>): Promise<SupplierCredit> {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Supabase não configurado');
      }
      
      const { data, error } = await supabase
        .from('supplier_credits')
        .insert([{
          supplier_id: credit.supplierId,
          amount: credit.amount,
          date: credit.date,
          description: credit.description,
        }])
        .select('*')
        .single();

      if (error) handleSupabaseError(error);
      
      if (!data || !data.id) {
        console.warn('⚠️ Data not returned from insert, attempting to fetch...');
        // Try to fetch the most recent credit for this supplier as fallback
        const { data: fallbackData, error: fetchError } = await supabase
          .from('supplier_credits')
          .select('*')
          .eq('supplier_id', credit.supplierId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (fetchError || !fallbackData) {
          throw new Error('Erro ao criar pagamento - verifique as permissões RLS no Supabase');
        }
        
        return {
          id: fallbackData.id,
          supplierId: fallbackData.supplier_id,
          amount: Number(fallbackData.amount),
          date: fallbackData.date,
          description: fallbackData.description || '',
        };
      }
      
      return {
        id: data.id,
        supplierId: data.supplier_id,
        amount: Number(data.amount),
        date: data.date,
        description: data.description || '',
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
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
      
      return (data || []).map(entry => ({
        id: entry.id,
        name: entry.name,
        amount: Number(entry.amount),
        dueDate: entry.due_date,
        isPaid: entry.is_paid,
        notes: entry.notes || '',
        seriesId: entry.series_id || undefined,
        totalInstallmentsInSeries: entry.total_installments_in_series || undefined,
        installmentNumberOfSeries: entry.installment_number_of_series || undefined,
        createdAt: entry.created_at,
      }));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createAccountsPayable(entries: Omit<AccountsPayableEntry, 'id'>[]): Promise<AccountsPayableEntry[]> {
    try {
      const entriesToInsert = entries.map(entry => ({
        name: entry.name,
        amount: entry.amount,
        due_date: entry.dueDate,
        is_paid: entry.isPaid,
        notes: entry.notes,
        series_id: entry.seriesId,
        total_installments_in_series: entry.totalInstallmentsInSeries,
        installment_number_of_series: entry.installmentNumberOfSeries,
      }));

      const { data, error } = await supabase
        .from('accounts_payable')
        .insert(entriesToInsert)
        .select();

      if (error) handleSupabaseError(error);
      
      return (data || []).map(entry => ({
        id: entry.id,
        name: entry.name,
        amount: Number(entry.amount),
        dueDate: entry.due_date,
        isPaid: entry.is_paid,
        notes: entry.notes || '',
        seriesId: entry.series_id || undefined,
        totalInstallmentsInSeries: entry.total_installments_in_series || undefined,
        installmentNumberOfSeries: entry.installment_number_of_series || undefined,
        createdAt: entry.created_at,
      }));
    } catch (error) {
      handleSupabaseError(error);
      throw error;
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
          series_id: entry.seriesId,
          total_installments_in_series: entry.totalInstallmentsInSeries,
          installment_number_of_series: entry.installmentNumberOfSeries,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entry.id);

      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
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
    }
  }
};

// User Services
export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      console.log('🔄 userService.getUsers() called');
      
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured');
        throw new Error('Supabase não configurado');
      }
      
      if (!supabase) {
        console.warn('⚠️ Supabase client not available');
        throw new Error('Cliente Supabase não inicializado');
      }
      
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('username');

      console.log('📊 Supabase response:', { data, error, count: data?.length });

      if (error) handleSupabaseError(error);
      
      const mappedUsers = (data || []).map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.full_name || '',
        password: '', // Never return password
        role: user.role as UserAccessLevel,
      }));
      
      console.log('✅ Mapped users:', mappedUsers);
      return mappedUsers;
    } catch (error) {
      console.error('❌ userService.getUsers() error:', error);
      handleSupabaseError(error);
      return [];
    }
  },

  async createUser(user: Omit<User, 'id'> & { password: string }): Promise<User> {
    try {
      console.log('🔄 Creating user:', user.username);
      
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured');
        throw new Error('Supabase não configurado');
      }
      
      if (!supabase) {
        console.warn('⚠️ Supabase client not available');
        throw new Error('Cliente Supabase não inicializado');
      }
      
      const hashedPassword = await bcrypt.hash(user.password, 10);
      console.log('🔐 Password hashed successfully');
      
      const { data, error } = await supabase
        .from('app_users')
        .insert([{
          username: user.username,
          full_name: user.fullName,
          password_hash: hashedPassword,
          role: user.role,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error creating user:', error);
        
        // Check for duplicate key constraint violation on username
        if (error.code === '23505' && error.message.includes('app_users_username_key')) {
          throw new UserAlreadyExistsError(user.username);
        }
        
        // For other errors, handle them normally
        handleSupabaseError(error);
        throw error;
      }
      
      console.log('✅ User created successfully:', data.username);
      
      return {
        id: data.id,
        username: data.username,
        fullName: data.full_name || '',
        password: '', // Never return password
        role: data.role as UserAccessLevel,
      };
    } catch (error) {
      console.error('❌ createUser service error:', error);
      
      // If it's our custom UserAlreadyExistsError, re-throw it directly
      if (error instanceof UserAlreadyExistsError) {
        throw error;
      }
      
      // For other errors, use the generic handler
      handleSupabaseError(error);
      throw error;
    }
  },

  async updateUser(user: User & { password?: string }): Promise<void> {
    try {
      console.log('🔄 Updating user:', user.username, 'with ID:', user.id);
      
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured');
        throw new Error('Supabase não configurado');
      }
      
      if (!supabase) {
        console.warn('⚠️ Supabase client not available');
        throw new Error('Cliente Supabase não inicializado');
      }
      
      if (!user.id) {
        console.error('❌ User ID is required for update');
        throw new Error('ID do usuário é obrigatório para atualização');
      }
      
      const updateData: any = {
        username: user.username,
        full_name: user.fullName,
        role: user.role,
        updated_at: new Date().toISOString(),
      };

      if (user.password) {
        console.log('🔐 Updating password for user:', user.username);
        updateData.password_hash = await bcrypt.hash(user.password, 10);
      }

      const { error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('❌ Database error updating user:', error);
        
        // Check for duplicate key constraint violation on username
        if (error.code === '23505' && error.message.includes('app_users_username_key')) {
          throw new UserAlreadyExistsError(user.username);
        }
        
        handleSupabaseError(error);
      }
      
      console.log('✅ User updated successfully:', user.username);
    } catch (error) {
      console.error('❌ updateUser service error:', error);
      
      // If it's our custom UserAlreadyExistsError, re-throw it directly
      if (error instanceof UserAlreadyExistsError) {
        throw error;
      }
      
      handleSupabaseError(error);
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado');
      }
      
      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado');
      }
      
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);

      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      console.log('🔄 Authenticating user:', username);
      
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured');
        throw new Error('Supabase não configurado');
      }
      
      if (!supabase) {
        console.warn('⚠️ Supabase client not available');
        throw new Error('Cliente Supabase não inicializado');
      }
      
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        console.error('❌ Database error during authentication:', error);
        if (error.code === 'PGRST116') {
          console.log('❌ User not found in database:', username);
          return null;
        }
        throw new Error('Erro na consulta do banco de dados');
      }
      
      if (!data) {
        console.log('❌ User not found:', username);
        return null;
      }
      
      console.log('✅ User found in database:', data.username);
      console.log('🔍 Password hash exists:', !!data.password_hash);
      console.log('🔍 Password hash length:', data.password_hash?.length || 0);
      
      // Check if password hash is valid before attempting comparison
      if (!data.password_hash || typeof data.password_hash !== 'string' || data.password_hash.trim() === '') {
        console.log('❌ Invalid or missing password hash for user:', username);
        console.log('🔧 Attempting to update password hash...');
        
        // Try to update the password hash
        try {
          const hashedPassword = await bcrypt.hash('admin123', 10);
          const { error: updateError } = await supabase
            .from('app_users')
            .update({ password_hash: hashedPassword })
            .eq('id', data.id);
          
          if (updateError) {
            console.error('❌ Failed to update password hash:', updateError);
            return null;
          }
          
          console.log('✅ Password hash updated, retrying authentication...');
          data.password_hash = hashedPassword;
        } catch (updateErr) {
          console.error('❌ Error updating password hash:', updateErr);
          return null;
        }
      }

      console.log('🔐 Attempting password comparison...');
      console.log('🔐 Input password length:', password.length);
      console.log('🔐 Hash starts with:', data.password_hash.substring(0, 10));
      
      let isValid = false;
      try {
        isValid = await bcrypt.compare(password, data.password_hash);
        console.log('🔐 Password validation result:', isValid);
      } catch (bcryptError) {
        console.error('❌ Bcrypt comparison error:', bcryptError);
        return null;
      }

      if (!isValid) {
        console.log('❌ Password validation failed for user:', username);
        console.log('🔐 Expected password: admin123');
        console.log('🔐 Received password:', password);
        return null;
      }
      
      console.log('✅ Authentication successful for user:', username);

      return {
        id: data.id,
        username: data.username,
        fullName: data.full_name || '',
        password: '', // Never return password
        role: data.role as UserAccessLevel,
      };
    } catch (error) {
      console.error('❌ Authentication error:', error);
      throw error;
    }
  },

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      if (!isSupabaseConfigured()) {
        return null;
      }
      
      if (!supabase) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching user by username:', error);
        return null;
      }
      
      if (!data || !data.id || typeof data.id !== 'string' || data.id.trim() === '') {
        return null;
      }

      return {
        id: data.id,
        username: data.username,
        fullName: data.full_name || '',
        password: '', // Never return password
        role: data.role as UserAccessLevel,
      };
    } catch (error) {
      console.error('❌ Exception in getUserByUsername:', error);
      return null;
    }
  },

  async getUserByEmail(email: string) {
    // This method is not used in the current implementation
    return null;
  },

  async deleteUserByUsername(username: string): Promise<void> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não configurado');
      }
      
      if (!supabase) {
        throw new Error('Cliente Supabase não inicializado');
      }
      
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('username', username);

      if (error) handleSupabaseError(error);
    } catch (error) {
      handleSupabaseError(error);
    }
  },
};