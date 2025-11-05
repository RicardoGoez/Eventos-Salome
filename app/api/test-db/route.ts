import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Probar conexión con productos
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .limit(5);

    // Probar conexión con usuarios
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol')
      .limit(5);

    // Probar conexión con pedidos
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*')
      .limit(5);

    return NextResponse.json({
      success: true,
      productos: {
        count: productos?.length || 0,
        error: productosError?.message || null,
        sample: productos?.[0] || null
      },
      usuarios: {
        count: usuarios?.length || 0,
        error: usuariosError?.message || null,
        sample: usuarios?.[0] || null
      },
      pedidos: {
        count: pedidos?.length || 0,
        error: pedidosError?.message || null,
        sample: pedidos?.[0] || null
      },
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'NOT SET'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

