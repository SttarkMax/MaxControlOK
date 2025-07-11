import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Temporarily disable Supabase to prevent fetch errors
const isSupabaseConfigured = false;

console.log('Supabase Config Check:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
  isConfigured: isSupabaseConfigured,
  note: 'Supabase temporarily disabled to prevent fetch errors'
});

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
    console.warn('Falling back to localStorage or default values.');
    return;
  }
  
  // Also handle cases where message might contain 'Failed to fetch'
  if (error?.message?.includes('Failed to fetch')) {
    console.warn('Network error: Unable to connect to Supabase.');
    console.warn('Falling back to localStorage or default values.');
    return;
  }
  
  // Handle PGRST116 (no rows found) as a non-critical error
  if (error?.code === 'PGRST116') {
    return; // Don't throw an error for 'no rows found' scenarios
  }
  
  console.error('Supabase error:', error);
  // Don't throw errors, just log them and continue
  console.warn('Continuing with fallback behavior due to Supabase error');
};