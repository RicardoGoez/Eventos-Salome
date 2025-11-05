import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productoService = ServiceFactory.getProductoService();
    const producto = await productoService.obtenerProducto(params.id);

    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(producto);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const productoService = ServiceFactory.getProductoService();
    const producto = await productoService.actualizarProducto(params.id, body);

    return NextResponse.json(producto);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar producto" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productoService = ServiceFactory.getProductoService();
    
    // Verificar si el producto existe
    const producto = await productoService.obtenerProducto(params.id);
    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Intentar eliminar (puede hacer soft delete si está en pedidos)
    const eliminado = await productoService.eliminarProducto(params.id);

    if (!eliminado) {
      return NextResponse.json({ error: "No se pudo eliminar el producto" }, { status: 500 });
    }

    // Verificar si se hizo soft delete (marcado como no disponible)
    const productoActualizado = await productoService.obtenerProducto(params.id);
    const fueSoftDelete = productoActualizado && !productoActualizado.disponible;

    return NextResponse.json({ 
      message: fueSoftDelete 
        ? "Producto marcado como no disponible (está incluido en pedidos existentes)" 
        : "Producto eliminado correctamente" 
    });
  } catch (error) {
    // Mejorar mensaje de error para el usuario
    const errorMessage = error instanceof Error ? error.message : "Error al eliminar producto";
    
    // Mensaje más amigable para errores de clave foránea
    if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key')) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar este producto porque está incluido en pedidos existentes. El producto ha sido marcado como no disponible.",
          softDeleted: true
        },
        { status: 200 } // Cambiamos a 200 porque se hizo soft delete exitosamente
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
