import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";
import { TipoMovimientoInventario } from "@/types/domain";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { cantidad, tipo, motivo } = body;

    if (!cantidad || !tipo) {
      return NextResponse.json(
        { error: "Cantidad y tipo son requeridos" },
        { status: 400 }
      );
    }

    const inventarioService = ServiceFactory.getInventarioService();
    const resultado = await inventarioService.ajustarStock(
      params.id,
      cantidad,
      tipo as TipoMovimientoInventario,
      motivo
    );

    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al ajustar stock" },
      { status: 400 }
    );
  }
}
