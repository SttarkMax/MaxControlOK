Here's the fixed version with all missing closing brackets added:

```javascript
// At line 1043, adding missing closing bracket for getProducts method
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
  }
```

The main issue was a missing closing curly brace `}` for the `getProducts` method. The rest of the file appears to be properly closed.