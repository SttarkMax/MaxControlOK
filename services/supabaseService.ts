import { supabase, handleSupabaseError, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../lib/database.types';
import bcrypt from 'bcryptjs';
import { 
  CompanyInfo, 
  Category, 
  Product, 
  Customer, 
  Quote, 
  QuoteItem,
  Supplier,
  Debt,
  SupplierCredit,
  AccountsPayableEntry,
  User,
  UserAccessLevel
} from '../types';

// Company Service
export const companyService = {
  async getCompany(): Promise<CompanyInfo | null> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured - returning default company');
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

    try {
      // Always get the first company record (there should only be one)
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        handleSupabaseError(error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
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
      console.error('Company data error:', error);
      handleSupabaseError(error);
      return null;
    }
  },

  async saveCompany(company: CompanyInfo): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      // Check if a company already exists
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const companyPayload = {
        name: company.name,
        logo_url_dark_bg: company.logoUrlDarkBg || null,
        logo_url_light_bg: company.logoUrlLightBg || null,
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        cnpj: company.cnpj || '',
        instagram: company.instagram || '',
        website: company.website || '',
        updated_at: new Date().toISOString()
      };

      if (existingCompany) {
        // Update the existing company record
        console.log('🔄 Updating existing company record:', existingCompany.id);
        const { error } = await supabase
          .from('companies')
          .update(companyPayload)
          .eq('id', existingCompany.id);

        if (error) {
          handleSupabaseError(error);
          throw new Error('Erro ao atualizar empresa');
        }
      } else {
        // Create the first company record
        console.log('🔄 Creating first company record');
        const { error } = await supabase
          .from('companies')
          .insert([companyPayload]);

        if (error) {
          handleSupabaseError(error);
          throw new Error('Erro ao criar empresa');
        }
      }
    } catch (error) {
      console.error('Error saving company:', error);
      throw error;
    }
  }
};

// Category Service
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured - returning empty categories');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        handleSupabaseError(error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        name: item.name,
      })) || [];
    } catch (error) {
      console.error('Categories error:', error);
      handleSupabaseError(error);
      return [];
    }
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: category.name,
        }])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao criar categoria');
      }

      return {
        id: data.id,
        name: data.name,
      };
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  async updateCategory(category: Category): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name,
        })
        .eq('id', category.id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao atualizar categoria');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao excluir categoria');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
};

// Product Service
export const productService = {
  async getProducts(): Promise<Product[]> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured - returning empty products');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        handleSupabaseError(error);
        return [];
      }

      return data?.map(item => ({
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
      })) || [];
    } catch (error) {
      console.error('Products error:', error);
      handleSupabaseError(error);
      return [];
    }
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: product.name,
          description: product.description || '',
          pricing_model: product.pricingModel,
          base_price: product.basePrice,
          unit: product.unit || 'un',
          custom_cash_price: product.customCashPrice || null,
          custom_card_price: product.customCardPrice || null,
          supplier_cost: product.supplierCost || null,
          category_id: product.categoryId || null,
        }])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao criar produto');
      }

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
      console.error('Error creating product:', error);
      throw error;
    }
  },

  async updateProduct(product: Product): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          description: product.description || '',
          pricing_model: product.pricingModel,
          base_price: product.basePrice,
          unit: product.unit || 'un',
          custom_cash_price: product.customCashPrice || null,
          custom_card_price: product.customCardPrice || null,
          supplier_cost: product.supplierCost || null,
          category_id: product.categoryId || null,
        })
        .eq('id', product.id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao atualizar produto');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
};

// Customer Service
export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured - returning empty customers');
      return [];
    }

    try {
      // Get customers with their down payments
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (customersError) {
        handleSupabaseError(customersError);
        return [];
      }

      if (!customersData) return [];

      // Get all down payments for all customers
      const { data: downPaymentsData, error: downPaymentsError } = await supabase
        .from('customer_down_payments')
        .select('*')
        .order('date', { ascending: false });

      if (downPaymentsError) {
        console.warn('Error loading down payments:', downPaymentsError);
        // Continue without down payments data
      }

      // Combine customers with their down payments
      return customersData.map(customer => ({
        id: customer.id,
        name: customer.name,
        documentType: customer.document_type as any,
        documentNumber: customer.document_number || '',
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        postalCode: customer.postal_code || '',
        downPayments: downPaymentsData?.filter(dp => dp.customer_id === customer.id).map(dp => ({
          id: dp.id,
          amount: Number(dp.amount),
          date: dp.date,
          description: dp.description || '',
        })) || [],
      }));
    } catch (error) {
      console.error('Customers error:', error);
      handleSupabaseError(error);
      return [];
    }
  },

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      // Create customer first
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([{
          name: customer.name,
          document_type: customer.documentType,
          document_number: customer.documentNumber || '',
          phone: customer.phone,
          email: customer.email || '',
          address: customer.address || '',
          city: customer.city || '',
          postal_code: customer.postalCode || '',
        }])
        .select()
        .single();

      if (customerError) {
        handleSupabaseError(customerError);
        throw new Error('Erro ao criar cliente');
      }

      // Create down payments if any
      if (customer.downPayments && customer.downPayments.length > 0) {
        const downPaymentsToInsert = customer.downPayments.map(dp => ({
          customer_id: customerData.id,
          amount: dp.amount,
          date: dp.date,
          description: dp.description || '',
        }));

        const { error: downPaymentsError } = await supabase
          .from('customer_down_payments')
          .insert(downPaymentsToInsert);

        if (downPaymentsError) {
          console.warn('Error creating down payments:', downPaymentsError);
          // Continue without down payments
        }
      }

      return {
        id: customerData.id,
        name: customerData.name,
        documentType: customerData.document_type as any,
        documentNumber: customerData.document_number || '',
        phone: customerData.phone,
        email: customerData.email || '',
        address: customerData.address || '',
        city: customerData.city || '',
        postalCode: customerData.postal_code || '',
        downPayments: customer.downPayments || [],
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  async updateCustomer(customer: Customer): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      // Update customer data
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          document_type: customer.documentType,
          document_number: customer.documentNumber || '',
          phone: customer.phone,
          email: customer.email || '',
          address: customer.address || '',
          city: customer.city || '',
          postal_code: customer.postalCode || '',
        })
        .eq('id', customer.id);

      if (customerError) {
        handleSupabaseError(customerError);
        throw new Error('Erro ao atualizar cliente');
      }

      // Delete existing down payments
      await supabase
        .from('customer_down_payments')
        .delete()
        .eq('customer_id', customer.id);

      // Create new down payments if any
      if (customer.downPayments && customer.downPayments.length > 0) {
        const downPaymentsToInsert = customer.downPayments.map(dp => ({
          customer_id: customer.id,
          amount: dp.amount,
          date: dp.date,
          description: dp.description || '',
        }));

        const { error: downPaymentsError } = await supabase
          .from('customer_down_payments')
          .insert(downPaymentsToInsert);

        if (downPaymentsError) {
          console.warn('Error updating down payments:', downPaymentsError);
        }
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      // Delete down payments first (cascade should handle this, but being explicit)
      await supabase
        .from('customer_down_payments')
        .delete()
        .eq('customer_id', id);

      // Delete customer
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao excluir cliente');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
};

// Quote Service
export const quoteService = {
  async getQuotes(): Promise<Quote[]> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured - returning empty quotes');
      return [];
    }

    try {
      console.log('🔄 [QUOTE SERVICE] Loading quotes from Supabase...');
      
      // First, get all quotes
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price,
            pricing_model,
            width,
            height,
            item_count_for_area_calc
          )
        `)
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('❌ [QUOTE SERVICE] Error fetching quotes:', quotesError);
        handleSupabaseError(quotesError);
        return [];
      }

      if (!quotes || quotes.length === 0) {
        console.log('📋 [QUOTE SERVICE] No quotes found in database');
        return [];
      }

      console.log(`📊 [QUOTE SERVICE] Found ${quotes.length} quotes, loading items...`);

      // Get all quote items for all quotes
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*');

      if (itemsError) {
        console.error('❌ [QUOTE SERVICE] Quote items table error:', itemsError);
        console.error('🚨 [QUOTE SERVICE] CRITICAL: Quote Items table has issues - this explains why items are not showing!');
        handleSupabaseError(itemsError);
        // Continue without items data
      }

      console.log(`📦 [QUOTE SERVICE] Found ${itemsData?.length || 0} quote items total`);

      // Combine quotes with their items
      const quotesWithItems = quotes.map(quote => {
        const quoteItems = itemsData?.filter(item => item.quote_id === quote.id) || [];
        
        console.log(`📋 [QUOTE SERVICE] Quote ${quote.quote_number}: ${quoteItems.length} items`, {
          quoteId: quote.id,
          itemsFound: quoteItems.length,
          itemsData: quoteItems.map(item => ({
            id: item.id,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price
          }))
        });
        
        return {
          id: quote.id,
          quoteNumber: quote.quote_number,
          customerId: quote.customer_id || undefined,
          clientName: quote.client_name,
          clientContact: quote.client_contact || '',
          items: (quote.quote_items || []).map((item: any) => ({
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price,
            pricingModel: item.pricing_model,
            width: item.width,
            height: item.height,
            itemCountForAreaCalc: item.item_count_for_area_calc
          })),
          subtotal: Number(quote.subtotal),
          discountType: quote.discount_type as any,
          discountValue: Number(quote.discount_value),
          discountAmountCalculated: Number(quote.discount_amount_calculated),
          subtotalAfterDiscount: Number(quote.subtotal_after_discount),
          totalCash: Number(quote.total_cash),
          totalCard: Number(quote.total_card),
          downPaymentApplied: Number(quote.down_payment_applied || 0),
          selectedPaymentMethod: quote.selected_payment_method || '',
          paymentDate: quote.payment_date || undefined,
          deliveryDeadline: quote.delivery_deadline || undefined,
          status: quote.status as any,
          companyInfoSnapshot: quote.company_info_snapshot as any,
          notes: quote.notes || '',
          salespersonUsername: quote.salesperson_username,
          salespersonFullName: quote.salesperson_full_name || '',
          createdAt: quote.created_at,
        };
      });

      console.log(`✅ [QUOTE SERVICE] Successfully loaded ${quotesWithItems.length} quotes with items`);
      
      // Debug: Log first quote details if available
      if (quotesWithItems.length > 0) {
        const firstQuote = quotesWithItems[0];
        console.log(`🔍 [QUOTE SERVICE] First quote sample:`, {
          id: firstQuote.id,
          number: firstQuote.quoteNumber,
          itemsCount: firstQuote.items.length,
          subtotal: firstQuote.subtotal,
          totalCash: firstQuote.totalCash,
          clientName: firstQuote.clientName,
          status: firstQuote.status
        });
      }
      
      return quotesWithItems;
    } catch (error) {
      console.error('❌ [QUOTE SERVICE] Critical error loading quotes:', error);
      handleSupabaseError(error);
      return [];
    }
  },

  async createQuote(quote: Omit<Quote, 'id'>): Promise<Quote> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      console.log('🔄 Creating quote with number:', quote.quoteNumber);
      
      // Helper function to check if quote number exists
      const checkQuoteNumberExists = async (quoteNumber: string): Promise<boolean> => {
        try {
          const { data, error } = await supabase!
            .from('quotes')
            .select('id')
            .eq('quote_number', quoteNumber)
            .limit(1);
          
          if (error) {
            console.error('❌ Error checking quote number:', error);
            return false; // If we can't check, allow creation to proceed
          }
          
          const exists = data && data.length > 0;
          console.log(`🔍 Quote number ${quoteNumber} exists:`, exists);
          return exists;
        } catch (error) {
          console.error('❌ Error in checkQuoteNumberExists:', error);
          return false; // If we can't check, allow creation to proceed
        }
      };
      
      // Retry mechanism for quote number generation
      let attempts = 0;
      const maxAttempts = 5;
      let finalQuoteNumber = quote.quoteNumber;
      
      while (attempts < maxAttempts) {
        // Check if quote number already exists
        const exists = await checkQuoteNumberExists(finalQuoteNumber);
        
        if (!exists) {
          // Quote number is unique, break the loop
          break;
        }
        
        // Generate a new quote number with additional randomness
        attempts++;
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        finalQuoteNumber = `ORC-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}-${randomSuffix}`;
        console.log(`🔄 [QUOTE SERVICE] Attempt ${attempts}: Trying new quote number: ${finalQuoteNumber}`);
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Não foi possível gerar um número único de orçamento após várias tentativas. Tente novamente.');
      }
      
      console.log('🔄 Creating quote:', finalQuoteNumber);
      
      // Create quote first
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert([{
          quote_number: finalQuoteNumber,
          customer_id: quote.customerId || null,
          client_name: quote.clientName,
          client_contact: quote.clientContact || '',
          subtotal: quote.subtotal,
          discount_type: quote.discountType,
          discount_value: quote.discountValue,
          discount_amount_calculated: quote.discountAmountCalculated,
          subtotal_after_discount: quote.subtotalAfterDiscount,
          total_cash: quote.totalCash,
          total_card: quote.totalCard,
          down_payment_applied: quote.downPaymentApplied || 0,
          selected_payment_method: quote.selectedPaymentMethod || '',
          payment_date: quote.paymentDate || null,
          delivery_deadline: quote.deliveryDeadline || null,
          status: quote.status,
          company_info_snapshot: quote.companyInfoSnapshot,
          notes: quote.notes || '',
          salesperson_username: quote.salespersonUsername,
          salesperson_full_name: quote.salespersonFullName || '',
        }])
        .select()
        .single();

      if (quoteError) {
        console.error('❌ Error creating quote:', quoteError);
        handleSupabaseError(quoteError);
        throw new Error('Erro ao criar orçamento');
      }

      if (!quoteData) {
        throw new Error('Erro: dados do orçamento não retornados após criação');
      }

      console.log('✅ Quote created successfully:', quoteData.id);

      // Create quote items
      if (quote.items && quote.items.length > 0) {
        console.log('🔄 Creating quote items...');
        const quoteItemsToCreate = quote.items.map(item => ({
          quote_id: quoteData.id,
          product_id: item.productId || null,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          pricing_model: item.pricingModel,
          width: item.width || null,
          height: item.height || null,
          item_count_for_area_calc: item.itemCountForAreaCalc || null,
        }));

        const { data: itemsData, error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItemsToCreate)
          .select('*');

        if (itemsError) {
          console.error('❌ Error creating quote items:', itemsError);
          // Cleanup: delete the quote if items creation failed
          await supabase.from('quotes').delete().eq('id', quoteData.id);
          handleSupabaseError(itemsError);
          return;
        }

        console.log(`✅ ${itemsData?.length || 0} quote items created successfully`);
        
        // Map items back to frontend format
        quoteData.items = itemsData?.map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          pricingModel: item.pricing_model as PricingModel,
          width: item.width,
          height: item.height,
          itemCountForAreaCalc: item.item_count_for_area_calc,
        })) || [];
      } else {
        quoteData.items = [];
      }

      // Return the complete quote with items
      const completeQuote: Quote = {
        id: quoteData.id,
        quoteNumber: quoteData.quote_number,
        customerId: quoteData.customer_id,
        clientName: quoteData.client_name,
        clientContact: quoteData.client_contact,
        items: quoteData.items,
        subtotal: quoteData.subtotal,
        discountType: quoteData.discount_type as 'percentage' | 'fixed' | 'none',
        discountValue: quoteData.discount_value,
        discountAmountCalculated: quoteData.discount_amount_calculated,
        subtotalAfterDiscount: quoteData.subtotal_after_discount,
        totalCash: quoteData.total_cash,
        totalCard: quoteData.total_card,
        downPaymentApplied: quoteData.down_payment_applied,
        selectedPaymentMethod: quoteData.selected_payment_method,
        paymentDate: quoteData.payment_date,
        deliveryDeadline: quoteData.delivery_deadline,
        status: quoteData.status as QuoteStatus,
        companyInfoSnapshot: quoteData.company_info_snapshot as CompanyInfo,
        notes: quoteData.notes,
        salespersonUsername: quoteData.salesperson_username,
        salespersonFullName: quoteData.salesperson_full_name,
        createdAt: quoteData.created_at,
      };

      console.log('✅ Quote creation completed successfully:', completeQuote.id);
      return completeQuote;
    } catch (error) {
      console.error('❌ Error in createQuote:', error);
      handleSupabaseError(error);
      throw error;
    }
  },

  async updateQuote(quote: Quote): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      console.log('🔄 Updating quote:', quote.quoteNumber);
      
      // Update quote
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          quote_number: quote.quoteNumber,
          customer_id: quote.customerId || null,
          client_name: quote.clientName,
          client_contact: quote.clientContact || '',
          subtotal: quote.subtotal,
          discount_type: quote.discountType,
          discount_value: quote.discountValue,
          discount_amount_calculated: quote.discountAmountCalculated,
          subtotal_after_discount: quote.subtotalAfterDiscount,
          total_cash: quote.totalCash,
          total_card: quote.totalCard,
          down_payment_applied: quote.downPaymentApplied || 0,
          selected_payment_method: quote.selectedPaymentMethod || '',
          payment_date: quote.paymentDate || null,
          delivery_deadline: quote.deliveryDeadline || null,
          status: quote.status,
          notes: quote.notes || '',
          salesperson_username: quote.salespersonUsername,
          salesperson_full_name: quote.salespersonFullName || '',
        })
        .eq('id', quote.id);

      if (quoteError) {
        console.error('❌ Error updating quote:', quoteError);
        handleSupabaseError(quoteError);
        throw new Error('Erro ao atualizar orçamento');
      }

      // Delete existing items
      await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', quote.id);

      // Create new items
      if (quote.items && quote.items.length > 0) {
        const itemsToInsert = quote.items.map(item => ({
          quote_id: quote.id,
          product_id: item.productId && item.productId !== '' ? item.productId : null,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          pricing_model: item.pricingModel,
          width: item.width || null,
          height: item.height || null,
          item_count_for_area_calc: item.itemCountForAreaCalc || null,
        }));

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('❌ Error updating quote items:', itemsError);
          handleSupabaseError(itemsError);
          throw new Error('Erro ao atualizar itens do orçamento');
        }

        console.log(`✅ Updated ${quote.items.length} quote items`);
      }

      console.log('✅ Quote updated successfully');
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  },

  async deleteQuote(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      // Delete quote items first (cascade should handle this, but being explicit)
      await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', id);

      // Delete quote
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao excluir orçamento');
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  }
};

// Supplier Service
export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured - returning empty suppliers');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) {
        handleSupabaseError(error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        name: item.name,
        cnpj: item.cnpj || '',
        phone: item.phone || '',
        email: item.email || '',
        address: item.address || '',
        notes: item.notes || '',
      })) || [];
    } catch (error) {
      console.error('Suppliers error:', error);
      handleSupabaseError(error);
      return [];
    }
  },

  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          name: supplier.name,
          cnpj: supplier.cnpj || '',
          phone: supplier.phone || '',
          email: supplier.email || '',
          address: supplier.address || '',
          notes: supplier.notes || '',
        }])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao criar fornecedor');
      }

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
      console.error('Error creating supplier:', error);
      throw error;
    }
  },

  async updateSupplier(supplier: Supplier): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: supplier.name,
          cnpj: supplier.cnpj || '',
          phone: supplier.phone || '',
          email: supplier.email || '',
          address: supplier.address || '',
          notes: supplier.notes || '',
        })
        .eq('id', supplier.id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao atualizar fornecedor');
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  },

  async deleteSupplier(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao excluir fornecedor');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  },

  async getSupplierDebts(): Promise<Debt[]> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured - returning empty debts');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('supplier_debts')
        .select('*')
        .order('date_added', { ascending: false });

      if (error) {
        handleSupabaseError(error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        supplierId: item.supplier_id,
        description: item.description || '',
        totalAmount: Number(item.total_amount),
        dateAdded: item.date_added,
      })) || [];
    } catch (error) {
      console.error('Supplier debts error:', error);
      handleSupabaseError(error);
      return [];
    }
  },

  async createSupplierDebt(debt: Omit<Debt, 'id'>): Promise<Debt> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { data, error } = await supabase
        .from('supplier_debts')
        .insert([{
          supplier_id: debt.supplierId,
          description: debt.description || '',
          total_amount: debt.totalAmount,
          date_added: debt.dateAdded,
        }])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao criar dívida');
      }

      return {
        id: data.id,
        supplierId: data.supplier_id,
        description: data.description || '',
        totalAmount: Number(data.total_amount),
        dateAdded: data.date_added,
      };
    } catch (error) {
      console.error('Error creating supplier debt:', error);
      throw error;
    }
  },

  async deleteSupplierDebt(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('supplier_debts')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao excluir dívida');
      }
    } catch (error) {
      console.error('Error deleting supplier debt:', error);
      throw error;
    }
  },

  async getSupplierCredits(): Promise<SupplierCredit[]> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured - returning empty credits');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('supplier_credits')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        handleSupabaseError(error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        supplierId: item.supplier_id,
        amount: Number(item.amount),
        date: item.date,
        description: item.description || '',
      })) || [];
    } catch (error) {
      console.error('Supplier credits error:', error);
      handleSupabaseError(error);
      return [];
    }
  },

  async createSupplierCredit(credit: Omit<SupplierCredit, 'id'>): Promise<SupplierCredit> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { data, error } = await supabase
        .from('supplier_credits')
        .insert([{
          supplier_id: credit.supplierId,
          amount: credit.amount,
          date: credit.date,
          description: credit.description || '',
        }])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao criar pagamento');
      }

      return {
        id: data.id,
        supplierId: data.supplier_id,
        amount: Number(data.amount),
        date: data.date,
        description: data.description || '',
      };
    } catch (error) {
      console.error('Error creating supplier credit:', error);
      throw error;
    }
  },

  async deleteSupplierCredit(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('supplier_credits')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao excluir pagamento');
      }
    } catch (error) {
      console.error('Error deleting supplier credit:', error);
      throw error;
    }
  }
};

// Accounts Payable Service
export const accountsPayableService = {
  async getAccountsPayable(): Promise<AccountsPayableEntry[]> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured - returning empty accounts payable');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .order('due_date');

      if (error) {
        handleSupabaseError(error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        dueDate: item.due_date,
        isPaid: item.is_paid || false,
        createdAt: item.created_at,
        notes: item.notes || '',
        seriesId: item.series_id || undefined,
        totalInstallmentsInSeries: item.total_installments_in_series || undefined,
        installmentNumberOfSeries: item.installment_number_of_series || undefined,
      })) || [];
    } catch (error) {
      console.error('Accounts payable error:', error);
      handleSupabaseError(error);
      return [];
    }
  },

  async createAccountsPayable(entries: Omit<AccountsPayableEntry, 'id'>[]): Promise<AccountsPayableEntry[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const entriesToInsert = entries.map(entry => ({
        name: entry.name,
        amount: entry.amount,
        due_date: entry.dueDate,
        is_paid: entry.isPaid || false,
        notes: entry.notes || '',
        series_id: entry.seriesId || null,
        total_installments_in_series: entry.totalInstallmentsInSeries || null,
        installment_number_of_series: entry.installmentNumberOfSeries || null,
      }));

      const { data, error } = await supabase
        .from('accounts_payable')
        .insert(entriesToInsert)
        .select();

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao criar contas a pagar');
      }

      return data?.map(item => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        dueDate: item.due_date,
        isPaid: item.is_paid || false,
        createdAt: item.created_at,
        notes: item.notes || '',
        seriesId: item.series_id || undefined,
        totalInstallmentsInSeries: item.total_installments_in_series || undefined,
        installmentNumberOfSeries: item.installment_number_of_series || undefined,
      })) || [];
    } catch (error) {
      console.error('Error creating accounts payable:', error);
      throw error;
    }
  },

  async updateAccountsPayable(entry: AccountsPayableEntry): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          name: entry.name,
          amount: entry.amount,
          due_date: entry.dueDate,
          is_paid: entry.isPaid,
          notes: entry.notes || '',
        })
        .eq('id', entry.id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao atualizar conta a pagar');
      }
    } catch (error) {
      console.error('Error updating accounts payable:', error);
      throw error;
    }
  },

  async deleteAccountsPayable(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('accounts_payable')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao excluir conta a pagar');
      }
    } catch (error) {
      console.error('Error deleting accounts payable:', error);
      throw error;
    }
  },

  async deleteAccountsPayableBySeries(seriesId: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      const { error } = await supabase
        .from('accounts_payable')
        .delete()
        .eq('series_id', seriesId);

      if (error) {
        handleSupabaseError(error);
        throw new Error('Erro ao excluir série de contas a pagar');
      }
    } catch (error) {
      console.error('Error deleting accounts payable series:', error);
      throw error;
    }
  }
};

// User Service
export const userService = {
  async getUsers(): Promise<User[]> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured - returning empty users');
      return [];
    }

    try {
      console.log('🔄 Loading users from Supabase...');
      
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Users table error:', error);
        handleSupabaseError(error);
        return [];
      }

      console.log(`✅ Found ${data?.length || 0} users in database`);

      return data?.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.full_name || '',
        role: user.role as UserAccessLevel,
      })) || [];
    } catch (error) {
      console.error('Users error:', error);
      handleSupabaseError(error);
      return [];
    }
  },

  async getUserByUsername(username: string): Promise<User | null> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('⚠️ Supabase not configured');
      return null;
    }

    try {
      console.log('🔍 Querying user by username:', username);
      
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          console.log('📭 No user found with username:', username);
          return null;
        }
        console.error('❌ Database error during user lookup:', error);
        handleSupabaseError(error);
        throw error; // Re-throw to prevent duplicate creation attempts
      }

      console.log('🔍 Raw user data from database:', data);
      
      if (!data) {
        console.log('❌ No data returned from query');
        return null;
      }

      // Handle case where data might be an array (shouldn't happen with maybeSingle, but being safe)
      const userData = Array.isArray(data) ? data[0] : data;
      
      if (!userData) {
        console.log('❌ No user data in response');
        return null;
      }

      // Validate that user has a valid ID before returning
      if (!userData.id || typeof userData.id !== 'string' || userData.id.trim() === '') {
        console.log('❌ User found but has invalid or missing ID:', {
          id: userData.id,
          username: userData.username,
          idType: typeof userData.id
        });
        return null;
      }

      console.log('✅ Valid user found:', {
        id: userData.id,
        username: userData.username,
        fullName: userData.full_name
      });

      return {
        id: userData.id,
        username: userData.username,
        fullName: userData.full_name || '',
        role: userData.role as UserAccessLevel,
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      
      // Check if this is a CORS/network error
      if (error?.message?.includes('Failed to fetch') || 
          error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        console.warn('⚠️ Network/CORS error during user lookup - treating as user not found');
        return null; // Treat network errors as "user not found" to allow creation
      }
      
      // For other errors, re-throw to prevent duplicate creation attempts
      throw error;
    }
  },

  async createUser(user: Omit<User, 'id'> & { password: string }): Promise<User> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      console.log('🔄 Creating user in Supabase:', user.username);
      
      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 10);

      const { data, error } = await supabase
        .from('app_users')
        .insert([{
          username: user.username,
          full_name: user.fullName || '',
          password_hash: passwordHash,
          role: user.role,
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error(`Usuário com email ${user.username} já existe`);
        }
        handleSupabaseError(error);
        throw new Error('Erro ao criar usuário');
      }

      console.log('✅ User created successfully:', data.username);

      return {
        id: data.id,
        username: data.username,
        fullName: data.full_name || '',
        role: data.role as UserAccessLevel,
      };
    } catch (error) {
      throw error;
    }
  },

  async updateUser(user: User & { password?: string }): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    if (!user.id || user.id === 'undefined' || user.id.trim() === '') {
      throw new Error('ID do usuário é obrigatório para atualização');
    }

    try {
      console.log('🔄 Updating user in Supabase:', user.username);
      
      const updateData: any = {
        username: user.username,
        full_name: user.fullName || '',
        role: user.role,
      };

      // Only update password if provided
      if (user.password) {
        updateData.password_hash = await bcrypt.hash(user.password, 10);
      }

      const { error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('❌ Error updating user:', error);
        if (error.code === '23505') { // Unique constraint violation
          throw new Error(`Usuário com email ${user.username} já existe`);
        }
        handleSupabaseError(error);
        throw new Error('Erro ao atualizar usuário');
      }

      console.log('✅ User updated successfully:', user.username);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      console.log('🔄 Deleting user from Supabase:', id);
      
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting user:', error);
        handleSupabaseError(error);
        throw new Error('Erro ao excluir usuário');
      }

      console.log('✅ User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async authenticateUser(username: string, password: string): Promise<User | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase não configurado');
    }

    try {
      console.log('🔄 Authenticating user:', username);
      
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ User not found:', username);
          return null;
        }
        console.error('❌ Database error during authentication:', error);
        throw new Error('Erro na consulta do banco de dados');
      }

      if (!data) {
        console.log('❌ No user data returned');
        return null;
      }

      // Handle case where data might be an array (shouldn't happen with maybeSingle, but being safe)
      const userData = Array.isArray(data) ? data[0] : data;
      
      if (!userData) {
        console.log('❌ No user data in response');
        return null;
      }

      // Validate that user has a valid ID
      if (!userData.id || typeof userData.id !== 'string' || userData.id.trim() === '') {
        console.log('❌ User found but has invalid or missing ID:', {
          id: userData.id,
          username: userData.username,
          idType: typeof userData.id
        });
        return null;
      }

      console.log('🔍 User found, checking password...');
      
      // Check if password_hash exists and is valid
      if (!userData.password_hash || typeof userData.password_hash !== 'string' || userData.password_hash.trim() === '') {
        console.log('❌ Invalid or missing password hash for user:', username);
        console.log('🔍 Password hash debug:', {
          exists: !!userData.password_hash,
          type: typeof userData.password_hash,
          length: userData.password_hash ? userData.password_hash.length : 0,
          value: userData.password_hash ? userData.password_hash.substring(0, 20) + '...' : 'null/undefined'
        });
        return null;
      }

      console.log('🔍 Password hash validation passed, comparing passwords...');
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      
      console.log('🔍 Password comparison result:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', username);
        return null;
      }

      console.log('✅ Authentication successful for user:', username);

      return {
        id: userData.id,
        username: userData.username,
        fullName: userData.full_name || '',
        role: userData.role as UserAccessLevel,
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }
};