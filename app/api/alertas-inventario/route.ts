import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accion = searchParams.get("accion") || "activas";

    const alertaService = ServiceFactory.getAlertaInventarioService();

    let alertas;
    if (accion === "verificar") {
      // Verificar y generar nuevas alertas
      await alertaService.verificarYNotificarStockBajo();
      await alertaService.verificarProximosVencimiento();
      alertas = await alertaService.obtenerAlertasActivas();
    } else {
      // Obtener alertas activas
      alertas = await alertaService.obtenerAlertasActivas();
    }

    return NextResponse.json(alertas);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener alertas de inventario",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertaId, accion } = body;

    const alertaService = ServiceFactory.getAlertaInventarioService();

    if (accion === "marcar-leida" && alertaId) {
      await alertaService.marcarComoLeida(alertaId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al procesar alerta",
      },
      { status: 500 }
    );
  }
}

