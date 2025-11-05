// Archivo temporal para probar la conexión a Supabase
import { createServerClient } from './client';

export async function testSupabaseConnection() {
  try {
    const supabase = createServerClient();
    
    // Intentar hacer una consulta simple
    const { data, error } = await supabase
      .from('productos')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error de conexión a Supabase:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Conexión a Supabase exitosa');
    return { success: true, data };
  } catch (error) {
    console.error('Excepción al conectar a Supabase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

