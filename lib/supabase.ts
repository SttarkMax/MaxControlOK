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
  // Handle network errors gracefully with better logging
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    console.warn('🔌 Supabase Connection Issue:', {
      message: 'Cannot connect to Supabase database',
      possibleCauses: [
        'Internet connection issue',
        'Supabase project not accessible',
        'CORS configuration issue',
        'Invalid Supabase URL or API key'
      ],
      troubleshooting: [
        'Check internet connection',
        'Verify Supabase project is active',
        'Check CORS settings include http://localhost:5173',
        'Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
      ]
    });
    throw new Error('Conexão com o banco de dados falhou. Verifique sua conexão com a internet.');
  }
  
  console.error('Supabase error:', error);
  
  throw new Error(error.message || 'Operação no banco de dados falhou');
};