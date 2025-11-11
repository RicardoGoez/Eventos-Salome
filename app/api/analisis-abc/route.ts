import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");
    const categoria = searchParams.get("categoria"); // A, B, C

    const analisisService = ServiceFactory.getAnalisisABCService();

    let periodo;
    if (fechaInicio && fechaFin) {
      periodo = {
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
      };
    }

    let resultado;
    if (categoria) {
      // Obtener productos de una categoría específica
      if (categoria === "A") {
        resultado = await analisisService.obtenerProductosCategoriaA(periodo);
      } else {
        const clasificaciones = await analisisService.clasificarProductos(periodo);
        resultado = clasificaciones.filter((c) => c.categoria === categoria);
      }
    } else {
      // Generar reporte completo
      resultado = await analisisService.generarReporteABC(periodo);
    }

    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al generar análisis ABC",
      },
      { status: 500 }
    );
  }
}

