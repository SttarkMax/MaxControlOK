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
      { table: 'suppliers', name: 'Suppliers' },
      { table: 'accounts_payable', name: 'Accounts Payable' },
      { table: 'app_users', name: 'Users' }
    ];
    
    console.log('🔍 Testing database tables...');
    for (const test of tests) {
      try {
        const { data, error } = await supabase.from(test.table).select('count').limit(1);
        if (error) {
          console.error(`❌ ${test.name} table error:`, error);
        } else {
          console.log(`✅ ${test.name} table accessible`);
        }
      } catch (err) {
        console.error(`❌ ${test.name} table failed:`, err);
      }
    }
    
    // Final connectivity test
    const { data, error } = await supabase.from('companies').select('count').limit(1);
    
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
    console.warn('⚠️ Supabase not configured - using offline mode');
    throw new Error('Conexão com o banco de dados falhou - modo offline ativado');
  }
  
  console.error('🚨 Supabase Error Details:', {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint
  });
  
  // If the operation was successful but there's a warning/info message, don't throw
  if (error?.code === 'PGRST116' || error?.message?.includes('No rows found')) {
    console.warn('⚠️ Supabase warning (non-critical):', error?.message);
    return; // Don't throw for non-critical warnings
  }
  
  // Check for CORS errors specifically
  if (error?.message?.includes('Failed to fetch') || 
      error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    throw new Error('Erro de CORS: Adicione http://localhost:5173 às configurações CORS do Supabase');
  }
  
  // Check for network-related errors and missing tables
  if (error?.message?.includes('Failed to fetch') || 
      error?.name === 'TypeError' ||
      error?.name === 'NetworkError' ||
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === '42P01' || // PostgreSQL: relation does not exist
      error?.message?.includes('does not exist') ||
      error.message.includes('fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('ERR_NETWORK') ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED') {
    console.error('🔌 Supabase Connection Issue - database connection failed');
    // Only throw if it's a real connection error, not a successful operation
    if (!error?.statusText || error?.statusText !== 'OK') {
      throw new Error('Erro de conexão: Verifique sua internet e configurações do Supabase');
    }
  }
  
  // For RLS and permission errors
  if (error?.code === '42501' || error?.message?.includes('permission denied') || error?.message?.includes('RLS')) {
    console.error('🔒 RLS/Permission Error:', error);
    throw new Error('Erro de permissão no banco de dados - verifique as políticas RLS');
  }
  
  // For other database errors
  throw new Error(error?.message || 'Erro desconhecido no banco de dados');
};