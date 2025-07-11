import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enable Supabase for full functionality
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

console.log('Supabase Config Check:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'undefined',
  isConfigured: isSupabaseConfigured
});

export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  // Check if Supabase is not configured
  if (!supabase) {
    console.warn('Supabase not configured. Please check environment variables.');
    throw new Error('Database not configured');
  }
  
  // Handle network connectivity issues
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    console.error('Network error: Unable to connect to Supabase.');
    throw new Error('Erro de conexão com o banco de dados');
  }
  
  // Also handle cases where message might contain 'Failed to fetch'
  if (error?.message?.includes('Failed to fetch')) {
    console.error('Network error: Unable to connect to Supabase.');
    throw new Error('Erro de conexão com o banco de dados');
  }
  
  // Handle PGRST116 (no rows found) as a non-critical error
  if (error?.code === 'PGRST116') {
    return; // Don't throw an error for 'no rows found' scenarios
  }
  
  console.error('Supabase error:', error);
  throw error;
};