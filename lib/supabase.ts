import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug: Log environment variables (remove in production)
console.log('🔍 Debug Supabase Config:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
  keyStart: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING'
});

// Check if Supabase is properly configured
export function isSupabaseConfigured() {
  const hasValidUrl = supabaseUrl && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseUrl !== 'https://your-project-ref.supabase.co' &&
    supabaseUrl.includes('.supabase.co');
  
  const hasValidKey = supabaseAnonKey && 
    supabaseAnonKey !== 'placeholder-key' && 
    supabaseAnonKey !== 'your-anon-key-here' &&
    supabaseAnonKey.length > 50;
    
  return !!(hasValidUrl && hasValidKey);
}

// Log configuration status
console.log('🔧 Supabase Configuration Status:', {
  url: supabaseUrl ? '✅ Configured' : '❌ Missing VITE_SUPABASE_URL',
  key: supabaseAnonKey ? '✅ Configured' : '❌ Missing VITE_SUPABASE_ANON_KEY',
  status: isSupabaseConfigured() ? '🟢 Ready' : '🔴 Needs Setup'
});

// Create Supabase client only if properly configured
export const supabase = isSupabaseConfigured() 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      },
      global: {
        fetch: (url, options = {}) => {
          // Ensure API key is included in all requests
          const headers = {
            ...options.headers,
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          };
          
          // For development, add mode: 'cors' to handle CORS issues
          return fetch(url, {
            ...options,
            headers,
            mode: 'cors',
            credentials: 'omit'
          });
        }
      }
    })
  : null;

// Test connection function
export const testSupabaseConnection = async () => {
  if (!supabase) {
    console.error('❌ Supabase client not initialized - check configuration');
    return false;
  }
  
  try {
    console.log('🔄 Testing Supabase connection with comprehensive check...');
    
    // Test multiple tables to ensure full connectivity
    const tests = [
      { table: 'companies', name: 'Companies' },
      { table: 'categories', name: 'Categories' },
      { table: 'products', name: 'Products' },
      { table: 'customers', name: 'Customers' },
      { table: 'quotes', name: 'Quotes' },
      { table: 'quote_items', name: 'Quote Items' },
      { table: 'suppliers', name: 'Suppliers' },
      { table: 'accounts_payable', name: 'Accounts Payable' },
      { table: 'app_users', name: 'Users' }
    ];
    
    console.log('🔍 Testing database tables...');
    for (const test of tests) {
      try {
        const { data, error } = await supabase.from(test.table).select('*').limit(1);
        if (error) {
          console.error(`❌ ${test.name} table error:`, error);
          if (test.table === 'quote_items') {
            console.error('🚨 CRITICAL: Quote Items table has issues - this explains why items are not showing!');
          }
        } else {
          console.log(`✅ ${test.name} table accessible`);
          if (test.table === 'quote_items') {
            console.log(`📊 Quote Items table has ${data?.length || 0} records`);
          }
        }
      } catch (err) {
        console.error(`❌ ${test.name} table failed:`, err);
        if (test.table === 'quote_items') {
          console.error('🚨 CRITICAL: Quote Items table connection failed - this explains why items are not showing!');
        }
      }
    }
    
    // Final connectivity test
    const { data, error } = await supabase.from('companies').select('*').limit(1);
    
    if (error) {
      console.error('❌ Supabase final connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection fully successful - all systems ready');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection critical error:', err);
    return false;
  }
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  // Check if Supabase is configured first
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase not configured - check environment variables');
    throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
  }
  
  // Check for fetch/CORS errors first (most common issue)
  if (error?.message?.includes('Failed to fetch') || 
      error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    console.error('🔌 CORS/Network Error - Please check Supabase CORS settings');
    console.error('📋 To fix: Add http://localhost:5173 to Supabase CORS origins');
    console.error('🔗 Go to: Supabase Dashboard → Project Settings → API → CORS');
    throw new Error('Erro de conectividade. Verifique sua conexão com a internet e configurações CORS.');
  }
  
  // Log error details for debugging
  console.error('❌ Supabase Error:', {
    message: error?.message,
    code: error?.code,
    type: error?.name || 'Unknown'
  });
  
  // If the operation was successful but there's a warning/info message, don't throw
  if (error?.code === 'PGRST116' || error?.message?.includes('No rows found')) {
    console.info('ℹ️ Supabase info (non-critical):', error?.message);
    return; // Don't throw for non-critical warnings
  }
  
  // Check for network-related errors and missing tables
  if (error?.name === 'TypeError' ||
      error?.name === 'NetworkError' ||
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === '42P01' || // PostgreSQL: relation does not exist
      error?.message?.includes('does not exist') ||
      error?.message?.includes('NetworkError') ||
      error?.message?.includes('ERR_NETWORK')) {
    console.error('🔌 Network/Database Issue - check connection');
    // Only throw if it's a real connection error, not a successful operation
    throw new Error('Erro de conexão com o banco de dados. Verifique sua conexão.');
  }
  
  // For RLS and permission errors
  if (error?.code === '42501' || error?.message?.includes('permission denied') || error?.message?.includes('RLS')) {
    console.error('🔒 RLS/Permission Error:', error);
    throw new Error('Erro de permissão. Verifique suas credenciais.');
  }
  
  // For other database errors
  console.error('❌ Database error:', error?.message);
  throw new Error(`Erro no banco de dados: ${error?.message || 'Erro desconhecido'}`);
};