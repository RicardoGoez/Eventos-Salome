import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accion = searchParams.get("accion") || "activas";

    const alertaService = ServiceFactory.getAlertaNegocioService();

    let alertas;
    if (accion === "verificar") {
      // Verificar todas las desviaciones
      const ventas = await alertaService.verificarDesviacionesVentas();
      const tiempos = await alertaService.verificarTiemposPreparacion();
      const caja = await alertaService.verificarDiferenciasCaja();
      const errores = await alertaService.verificarTasaError();

      alertas = [...ventas, ...tiempos, ...caja, ...errores];
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
            : "Error al obtener alertas de negocio",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertaId, accion, umbrales } = body;

    const alertaService = ServiceFactory.getAlertaNegocioService();

    if (accion === "marcar-leida" && alertaId) {
      await alertaService.marcarComoLeida(alertaId);
      return NextResponse.json({ success: true });
    }

    if (accion === "configurar-umbrales" && umbrales) {
      await alertaService.configurarUmbrales(umbrales);
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

