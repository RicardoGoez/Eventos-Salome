import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";
import { EstadoPedido } from "@/types/domain";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pedidoService = ServiceFactory.getPedidoService();
    const pedido = await pedidoService.obtenerPedido(params.id);

    if (!pedido) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    return NextResponse.json(pedido);
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
    const { estado, mesaId } = body as { estado?: EstadoPedido; mesaId?: string };

    const pedidoService = ServiceFactory.getPedidoService();

    // Asignación de mesa (drag & drop)
    if (typeof mesaId !== "undefined") {
      // Permitir string vacío para dejar sin mesa
      const updated = await (pedidoService as any).pedidoRepository.update(params.id, {
        mesaId: mesaId || null,
      });
      return NextResponse.json(updated);
    }

    if (!estado) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const pedido = await pedidoService.actualizarEstado(
      params.id,
      estado as EstadoPedido
    );

    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar pedido" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pedidoService = ServiceFactory.getPedidoService();
    const pedido = await pedidoService.cancelarPedido(params.id);

    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al cancelar pedido" },
      { status: 400 }
    );
  }
}
