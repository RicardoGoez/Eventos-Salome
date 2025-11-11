import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");

    const kpiService = ServiceFactory.getKPIService();

    // Si no se proporcionan fechas, usar últimos 30 días
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    const inicio = fechaInicio
      ? new Date(fechaInicio)
      : new Date(fin.getTime() - 30 * 24 * 60 * 60 * 1000);

    const periodo = {
      fechaInicio: inicio,
      fechaFin: fin,
    };

    const kpis = await kpiService.obtenerKPIs(periodo);

    return NextResponse.json(kpis);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener KPIs",
      },
      { status: 500 }
    );
  }
}

