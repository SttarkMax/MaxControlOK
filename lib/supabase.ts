import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-url-here') || supabaseAnonKey.includes('your-anon-key-here')) {
  console.error('⚠️  Supabase not configured properly. Please update your .env.local file with your actual Supabase credentials.');
  console.error('📋 Instructions:');
  console.error('1. Go to https://supabase.com/dashboard');
  console.error('2. Select your project');
  console.error('3. Go to Settings -> API');
  console.error('4. Copy your Project URL and anon public key');
  console.error('5. Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-url-here') 
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
    console.error('Network error: Unable to connect to Supabase. Please check your internet connection and Supabase configuration.');
    throw new Error('Erro de conexão: Verifique sua conexão com a internet e configuração do Supabase');
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