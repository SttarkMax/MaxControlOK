import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured with real credentials
const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your-supabase-url' && 
  supabaseAnonKey !== 'your-supabase-anon-key' &&
  supabaseUrl.includes('supabase.co')
);

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
    console.warn('Supabase not configured. Using localStorage fallback.');
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  
  // Handle network connectivity issues
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    console.error('Network error: Unable to connect to Supabase.');
    throw new Error('NETWORK_ERROR');
  }
  
  // Also handle cases where message might contain 'Failed to fetch'
  if (error?.message?.includes('Failed to fetch')) {
    console.error('Network error: Unable to connect to Supabase.');
    throw new Error('NETWORK_ERROR');
  }
  
  // Handle PGRST116 (no rows found) as a non-critical error
  if (error?.code === 'PGRST116') {
    return; // Don't throw an error for 'no rows found' scenarios
  }
  
  console.error('Supabase error:', error);
  throw error;
};