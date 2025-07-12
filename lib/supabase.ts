import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseAnonKey ? 'Present' : 'Missing'
  });
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  // Handle network errors gracefully
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    console.warn('Network connection to Supabase failed. Using fallback behavior.');
    throw new Error('Conexão com o banco de dados falhou. Verifique sua conexão com a internet.');
  }
  
  throw new Error(error.message || 'Operação no banco de dados falhou');
};