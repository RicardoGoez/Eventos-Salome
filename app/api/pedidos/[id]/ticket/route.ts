import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";
import { TicketGenerator } from "@/lib/utils/ticket-generator";

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

    // Generar PDF y devolver URL
    const pdfUrl = await TicketGenerator.generarPDF(pedido);

    return NextResponse.json({ pdfUrl, pedido });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al generar ticket",
      },
      { status: 500 }
    );
  }
}
