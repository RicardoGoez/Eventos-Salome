import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mesaService = ServiceFactory.getMesaService();
    const mesa = await mesaService.obtenerMesa(params.id);

    if (!mesa) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    return NextResponse.json(mesa);
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
    const { accion } = body; // 'ocupar' o 'liberar'

    const mesaService = ServiceFactory.getMesaService();

    if (accion === "ocupar") {
      const mesa = await mesaService.ocuparMesa(params.id);
      return NextResponse.json(mesa);
    } else if (accion === "liberar") {
      const mesa = await mesaService.liberarMesa(params.id);
      return NextResponse.json(mesa);
    } else {
      const mesa = await mesaService.actualizarMesa(params.id, body);
      return NextResponse.json(mesa);
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al actualizar mesa",
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
    const mesaService = ServiceFactory.getMesaService();
    await mesaService.eliminarMesa(params.id);

    return NextResponse.json({ message: "Mesa eliminada correctamente" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar mesa" },
      { status: 500 }
    );
  }
}
