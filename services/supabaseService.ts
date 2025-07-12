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

// Test connection on service load
if (isSupabaseConfigured()) {
  testSupabaseConnection().then(success => {
    if (!success) {
      console.warn('⚠️ Supabase connection test failed - some features may not work');
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
        console.log('📝 No company data found - returning default');
        return {
          name: 'Sua Empresa',
          logoUrlDarkBg: '',
          logoUrlLightBg: '',
          address: '',
          phone: '',
          email: '',
          cnpj: '',
          instagram: '',
          website: '',
        };
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
      throw error;
    }

    if (!supabase) {
      throw new Error('Cliente Supabase não inicializado');
    }

    try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error && (error.code === 'PGRST116' || error.code === '42P01')) {
      // No rows found - return default company info
      return {
        name: 'Sua Empresa',
        logoUrlDarkBg: '',
        logoUrlLightBg: '',
        address: '',
        phone: '',
        email: '',
        cnpj: '',
        instagram: '',
        website: '',
      };
    }

    if (error) {
      handleSupabaseError(error);
      return {
        name: 'Sua Empresa',
        logoUrlDarkBg: '',
        logoUrlLightBg: '',
        address: '',
        phone: '',
        email: '',
        cnpj: '',
        instagram: '',
        website: '',
      };
    }

    if (!data) {
      return {
        name: 'Sua Empresa',
        logoUrlDarkBg: '',
        logoUrlLightBg: '',
        address: '',
        phone: '',
        email: '',
        cnpj: '',
        instagram: '',
        website: '',
      };
    }

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
      console.warn('🔌 Company service - switching to offline mode');
      handleSupabaseError(error);
      return {
        name: 'Sua Empresa',
        logoUrlDarkBg: '',
        logoUrlLightBg: '',
        address: '',
        phone: '',
        email: '',
        cnpj: '',
        instagram: '',
        website: '',
      };
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
      handleSupabaseError(error);
      throw error;
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
        throw new Error('Supabase não configurado');
      }

      if (!supabase) {
        console.error('❌ Supabase client not available for products');
        throw new Error('Cliente Supabase não inicializado');
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Products error:', error);
        handleSupabaseError(error);
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
      throw error;
    }
  },
      return (data || []).map(item => ({
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
    } catch (error) {
      console.warn('🔌 Products service - switching to offline mode');
      return [];
    }
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const { data, error } = await supabase
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
          category_id: product.categoryId,
        }])
        .select()
        .single();

      if (error) handleSupabaseError(error);
      
      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        pricingModel: data.pricing_model as any,
        basePrice: Number(data.base_price),
        unit: data.unit || 'un',
        customCashPrice: data.custom_cash_price ? Number(data.custom_cash_price) : undefined,
        customCardPrice: data.custom_card_price ? Number(data.custom_card_price) : undefined,
        supplierCost: data.supplier_cost ? Number(data.supplier_cost) : undefined,
        categoryId: data.category_id || undefined,
      };
    } catch (error) {
      handleSupabaseError(error);
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
    try {
      // Check if Supabase is configured first
      if (!isSupabaseConfigured()) {
        return [];
      }

      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (quotesError) {
        // Handle missing table gracefully
        if (quotesError.code === '42P01') {
          console.warn('🔌 Quotes table does not exist - switching to offline mode');
          return [];
        }
        handleSupabaseError(quotesError);
        return [];
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .order('created_at');

      if (itemsError) {
        // Handle missing table gracefully
        if (itemsError.code === '42P01') {
          console.warn('🔌 Quote items table does not exist - switching to offline mode');
          return [];
        }
        handleSupabaseError(itemsError);
        return [];
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
      console.warn('🔌 Quote service - switching to offline mode');
      handleSupabaseError(error);
      return [];
    }
  },

  async createQuote(quote: Omit<Quote, 'id'>): Promise<Quote> {
    try {
      const { data, error } = await supabase
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

      if (error) handleSupabaseError(error);

      // Insert quote items
      if (quote.items && quote.items.length > 0) {
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

        if (itemsError) handleSupabaseError(itemsError);
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
      handleSupabaseError(error);
      throw error;
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
      const { data, error } = await supabase
        .from('supplier_debts')
        .select('*')
        .order('date_added', { ascending: false });

      if (error) handleSupabaseError(error);
      
      return (data || []).map(debt => ({
        id: debt.id,
        supplierId: debt.supplier_id,
        descr
}iption: debt.description || '',
        totalAmount: Number(debt.total_amount),
        dateAdded: debt.date_added,
      }));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createSupplierDebt(debt: Omit<Debt, 'id'>): Promise<Debt> {
    try {
      const { data, error } = await supabase
        .from('supplier_debts')
        .insert([{
          supplier_id: debt.supplierId,
          description: debt.description,
          total_amount: debt.totalAmount,
          date_added: debt.dateAdded,
        }])
        .select()
        .single();

      if (error) handleSupabaseError(error);
      
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
      const { data, error } = await supabase
        .from('supplier_credits')
        .select('*')
        .order('date', { ascending: false });

      if (error) handleSupabaseError(error);
      
      return (data || []).map(credit => ({
        id: credit.id,
        supplierId: credit.supplier_id,
        amount: Number(credit.amount),
        date: credit.date,
        description: credit.description || '',
      }));
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  },

  async createSupplierCredit(credit: Omit<SupplierCredit, 'id'>): Promise<SupplierCredit> {
    try {
      const { data, error } = await supabase
        .from('supplier_credits')
        .insert([{
          supplier_id: credit.supplierId,
          amount: credit.amount,
          date: credit.date,
          description: credit.description,
        }])
        .select()
        .single();

      if (error) handleSupabaseError(error);
      
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
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
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

      if (error) handleSupabaseError(error);
      
      return {
        id: data.id,
        username: data.username,
        fullName: data.full_name || '',
        password: '', // Never return password
        role: data.role as UserAccessLevel,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
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
    }
  },

  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) return null;

      const isValid = await bcrypt.compare(password, data.password_hash);
      if (!isValid) return null;

      return {
        id: data.id,
        username: data.username,
        fullName: data.full_name || '',
        password: '', // Never return password
        role: data.role as UserAccessLevel,
      };
    } catch (error) {
      return null;
    }
  },

  async getUserByEmail(email: string) {
    // This method is not used in the current implementation
    return null;
  }
};