import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For demo purposes, we'll disable Supabase and use localStorage
const isSupabaseConfigured = false;

console.log('Supabase temporarily disabled - using localStorage for demo');

export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  // Always throw SUPABASE_NOT_CONFIGURED for demo
  throw new Error('SUPABASE_NOT_CONFIGURED');
};