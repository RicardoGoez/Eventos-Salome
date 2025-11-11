import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productoId = searchParams.get("productoId");
    const periodo = searchParams.get("periodo") || "30";
    const dias = searchParams.get("dias") || "7";

    const pronosticoService = ServiceFactory.getPronosticoDemandaService();

    if (productoId) {
      // Pronóstico para un producto específico
      const pronostico = await pronosticoService.calcularSuavizadoExponencial(
        productoId,
        parseInt(periodo)
      );

      if (dias) {
        const demandaFutura = await pronosticoService.predecirDemanda(
          productoId,
          parseInt(dias)
        );
        return NextResponse.json({
          ...pronostico,
          demandaFutura,
        });
      }

      return NextResponse.json(pronostico);
    } else {
      // Pronósticos para todos los productos
      const pronosticos = await pronosticoService.obtenerPronosticosTodos(
        parseInt(periodo)
      );
      return NextResponse.json(pronosticos);
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al calcular pronóstico de demanda",
      },
      { status: 500 }
    );
  }
}

