import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proveedorService = ServiceFactory.getProveedorService();
    const proveedor = await proveedorService.obtenerProveedor(params.id);

    if (!proveedor) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(proveedor);
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
    const proveedorService = ServiceFactory.getProveedorService();
    const proveedor = await proveedorService.actualizarProveedor(
      params.id,
      body
    );

    return NextResponse.json(proveedor);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar proveedor",
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
    const proveedorService = ServiceFactory.getProveedorService();
    
    // Verificar si el proveedor existe
    const proveedor = await proveedorService.obtenerProveedor(params.id);
    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
    }

    // Intentar eliminar (puede hacer soft delete si tiene entradas de inventario)
    const eliminado = await proveedorService.eliminarProveedor(params.id);

    if (!eliminado) {
      return NextResponse.json({ error: "No se pudo eliminar el proveedor" }, { status: 500 });
    }

    // Verificar si se hizo soft delete (marcado como inactivo)
    const proveedorActualizado = await proveedorService.obtenerProveedor(params.id);
    const fueSoftDelete = proveedorActualizado && !proveedorActualizado.activo;

    return NextResponse.json({ 
      message: fueSoftDelete 
        ? "Proveedor marcado como inactivo (tiene entradas de inventario asociadas)" 
        : "Proveedor eliminado correctamente" 
    });
  } catch (error) {
    // Mejorar mensaje de error para el usuario
    const errorMessage = error instanceof Error ? error.message : "Error al eliminar proveedor";
    
    // Mensaje más amigable para errores de clave foránea
    if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key')) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar este proveedor porque tiene entradas de inventario asociadas. El proveedor ha sido marcado como inactivo.",
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
