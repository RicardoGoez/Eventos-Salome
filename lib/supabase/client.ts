import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Estas variables deben estar en el archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

// Solo crear el cliente si las variables están disponibles
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Error creating Supabase client:', error);
  }
}

// Cliente para operaciones del servidor (con service role key si es necesario)
export const createServerClient = (): SupabaseClient => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || (!supabaseAnonKey && !serviceRoleKey)) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  
  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  if (supabase) {
    return supabase;
  }
  
  // Fallback: crear cliente con anon key
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Exportar el cliente público si existe
export { supabase };

