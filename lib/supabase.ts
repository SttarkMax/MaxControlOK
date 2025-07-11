import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-url-here') && 
  !supabaseAnonKey.includes('your-anon-key-here');

export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  // Check if Supabase is not configured
  if (!supabase) {
    console.warn('Supabase not configured. Using fallback behavior.');
    return;
  }
  
  // Handle network connectivity issues
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    console.warn('Network error: Unable to connect to Supabase.');
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
  }
  
  // Also handle cases where message might contain 'Failed to fetch'
  if (error?.message?.includes('Failed to fetch')) {
    console.warn('Network error: Unable to connect to Supabase.');
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
  }
  
  // Handle PGRST116 (no rows found) as a non-critical error
  if (error?.code === 'PGRST116') {
    return; // Don't throw an error for 'no rows found' scenarios
  }
  
  console.error('Supabase error:', error);
  if (error?.message) {
    throw new Error(error.message);
  }
  throw new Error('Erro desconhecido no banco de dados');
};