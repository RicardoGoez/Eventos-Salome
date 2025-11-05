import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const descuentoService = ServiceFactory.getDescuentoService();
    const descuento = await descuentoService.obtenerDescuento(params.id);

    if (!descuento) {
      return NextResponse.json(
        { error: "Descuento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(descuento);
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
    const descuentoService = ServiceFactory.getDescuentoService();
    const descuento = await descuentoService.actualizarDescuento(
      params.id,
      body
    );

    return NextResponse.json(descuento);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar descuento",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const descuentoService = ServiceFactory.getDescuentoService();
    
    // Verificar si el descuento existe
    const descuento = await descuentoService.obtenerDescuento(params.id);
    if (!descuento) {
      return NextResponse.json({ error: "Descuento no encontrado" }, { status: 404 });
    }

    // Intentar eliminar (puede hacer soft delete si está en pedidos)
    const eliminado = await descuentoService.eliminarDescuento(params.id);

    if (!eliminado) {
      return NextResponse.json({ error: "No se pudo eliminar el descuento" }, { status: 500 });
    }

    // Verificar si se hizo soft delete (marcado como inactivo)
    const descuentoActualizado = await descuentoService.obtenerDescuento(params.id);
    const fueSoftDelete = descuentoActualizado && !descuentoActualizado.activo;

    return NextResponse.json({ 
      message: fueSoftDelete 
        ? "Descuento marcado como inactivo (está asociado a pedidos existentes)" 
        : "Descuento eliminado correctamente" 
    });
  } catch (error) {
    // Mejorar mensaje de error para el usuario
    const errorMessage = error instanceof Error ? error.message : "Error al eliminar descuento";
    
    // Mensaje más amigable para errores de clave foránea
    if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key')) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar este descuento porque está asociado a pedidos existentes. El descuento ha sido marcado como inactivo.",
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
