import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { diferenciaEfectivo, notas } = body;

    const cierreService = ServiceFactory.getCierreCajaService();
    const cierre = await cierreService.cerrarCaja(
      params.id,
      diferenciaEfectivo,
      notas
    );

    return NextResponse.json(cierre);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al cerrar caja",
      },
      { status: 400 }
    );
  }
}
