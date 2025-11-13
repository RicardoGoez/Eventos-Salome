import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// PUT - Actualizar una variante
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar variables de entorno
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Configuración del servidor incompleta" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { nombre, descripcion, precio, costo, disponible, imagen, orden } = body;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("variantes_producto")
      .update({
        nombre,
        descripcion: descripcion || null,
        precio: parseFloat(precio),
        costo: parseFloat(costo || 0),
        disponible: disponible !== undefined ? disponible : true,
        imagen: imagen || null,
        orden: orden !== undefined ? orden : 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating variante:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

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

    return NextResponse.json(variante);
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe una variante con ese nombre para este producto" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar variante" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una variante
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar variables de entorno
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Configuración del servidor incompleta" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Obtener la variante para saber el producto_id
    const { data: variante, error: fetchError } = await supabase
      .from("variantes_producto")
      .select("producto_id")
      .eq("id", params.id)
      .single();

    if (fetchError) {
      console.error("Error fetching variante for delete:", {
        message: fetchError.message,
        details: fetchError.details,
        code: fetchError.code,
      });
      throw fetchError;
    }

    // Eliminar la variante
    const { error } = await supabase
      .from("variantes_producto")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting variante:", {
        message: error.message,
        details: error.details,
        code: error.code,
      });
      throw error;
    }

    // Verificar si quedan variantes para el producto
    if (variante) {
      const { data: variantesRestantes } = await supabase
        .from("variantes_producto")
        .select("id")
        .eq("producto_id", variante.producto_id)
        .limit(1);

      // Si no quedan variantes, actualizar el producto
      if (!variantesRestantes || variantesRestantes.length === 0) {
        await supabase
          .from("productos")
          .update({ tiene_variantes: false })
          .eq("id", variante.producto_id);
      }
    }

    return NextResponse.json({ message: "Variante eliminada correctamente" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar variante" },
      { status: 500 }
    );
  }
}

