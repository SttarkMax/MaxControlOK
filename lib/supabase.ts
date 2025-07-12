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
    return; // Don't throw, just return to enable offline mode
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
    console.warn('5. Ensure database tables are created (run migrations)');
    console.warn('6. Check if Supabase project has the required schema');
    console.warn('🔌 Supabase Connection Issue - switching to offline mode');
    return; // Don't throw, just return to enable offline mode
  }
  
  console.error('Supabase error:', error);
  return; // Don't throw any errors, let the app continue in offline mode
};