import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fecha = searchParams.get("fecha");
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");

    const cierreService = ServiceFactory.getCierreCajaService();

    if (fecha) {
      const cierre = await cierreService.obtenerCierrePorFecha(new Date(fecha));
      return NextResponse.json(cierre);
    } else if (fechaInicio && fechaFin) {
      const cierres = await cierreService.obtenerCierresPorRango(
        new Date(fechaInicio),
        new Date(fechaFin)
      );
      return NextResponse.json(cierres);
    } else {
      const cierres = await cierreService.obtenerCierres();
      return NextResponse.json(cierres);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fechaInicio, fechaFin, usuarioId, diferenciaEfectivo, notas } =
      body;

    if (!fechaInicio || !fechaFin || !usuarioId) {
      return NextResponse.json(
        { error: "fechaInicio, fechaFin y usuarioId son requeridos" },
        { status: 400 }
      );
    }

    const cierreService = ServiceFactory.getCierreCajaService();
    const cierre = await cierreService.calcularCierre(
      new Date(fechaInicio),
      new Date(fechaFin),
      usuarioId,
      diferenciaEfectivo,
      notas
    );

    return NextResponse.json(cierre, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al crear cierre de caja",
      },
      { status: 400 }
    );
  }
}
