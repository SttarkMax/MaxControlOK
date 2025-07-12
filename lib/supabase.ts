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

// Create Supabase client with fallback for missing credentials
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey || 'placeholder-key'
      }
    }
  }
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key');
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  // Check if Supabase is configured first
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase not configured - using offline mode');
    throw new Error('Aplicação funcionando em modo offline. Configure o Supabase para funcionalidade completa.');
  }

  // Handle network errors gracefully
  if (error instanceof TypeError && (
    error.message.includes('Failed to fetch') || 
    error.message.includes('fetch')
  )) {
    console.warn('🔌 Supabase Connection Issue - switching to offline mode');
    throw new Error('Conexão com o banco de dados falhou. Verifique sua conexão com a internet.');
  }
  
  console.error('Supabase error:', error);
  throw new Error(error.message || 'Operação no banco de dados falhou');
};