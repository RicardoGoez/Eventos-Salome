import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET - Obtener variantes de un producto
export async function GET(request: NextRequest) {
  try {
    // Verificar variables de entorno
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Configuración del servidor incompleta" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const productoId = searchParams.get("productoId");

    if (!productoId) {
      return NextResponse.json(
        { error: "productoId es requerido" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("variantes_producto")
      .select("*")
      .eq("producto_id", productoId)
      .order("orden", { ascending: true });

    if (error) {
      console.error("Error loading variantes:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { 
          error: error.message || "Error al cargar variantes",
          details: error.details,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Convertir snake_case a camelCase
    const variantes = (data || []).map((v: any) => ({
      id: v.id,
      productoId: v.producto_id,
      nombre: v.nombre,
      descripcion: v.descripcion,
      precio: parseFloat(v.precio),
      costo: parseFloat(v.costo),
      disponible: v.disponible,
      imagen: v.imagen,
      orden: v.orden || 0,
      createdAt: v.created_at ? new Date(v.created_at) : new Date(),
      updatedAt: v.updated_at ? new Date(v.updated_at) : new Date(),
    }));

    return NextResponse.json(variantes);
  } catch (error: any) {
    console.error("Unexpected error in GET variantes:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Error desconocido",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva variante
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productoId, nombre, descripcion, precio, costo, disponible, imagen, orden } = body;

    if (!productoId || !nombre || precio === undefined) {
      return NextResponse.json(
        { error: "productoId, nombre y precio son requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Insertar la variante
    const { data, error } = await supabase
      .from("variantes_producto")
      .insert({
        producto_id: productoId,
        nombre,
        descripcion: descripcion || null,
        precio: parseFloat(precio),
        costo: parseFloat(costo || 0),
        disponible: disponible !== undefined ? disponible : true,
        imagen: imagen || null,
        orden: orden || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating variante:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    // Actualizar el producto para marcar que tiene variantes
    await supabase
      .from("productos")
      .update({ tiene_variantes: true })
      .eq("id", productoId);

    // Convertir snake_case a camelCase
    const variante = {
      id: data.id,
      productoId: data.producto_id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: parseFloat(data.precio),
      costo: parseFloat(data.costo),
      disponible: data.disponible,
      imagen: data.imagen,
      orden: data.orden || 0,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
    };

    return NextResponse.json(variante, { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe una variante con ese nombre para este producto" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear variante" },
      { status: 500 }
    );
  }
}

