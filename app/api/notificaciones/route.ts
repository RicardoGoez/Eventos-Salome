import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const usuarioId = searchParams.get("usuarioId");

    if (!usuarioId) {
      return NextResponse.json(
        { error: "usuarioId es requerido" },
        { status: 400 }
      );
    }

    const notificacionService = ServiceFactory.getNotificacionService();
    const notificaciones = await notificacionService.obtenerNotificacionesNoLeidas(
      usuarioId
    );

    return NextResponse.json(notificaciones);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener notificaciones",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificacionId, usuarioId, accion } = body;

    const notificacionService = ServiceFactory.getNotificacionService();

    if (accion === "marcar-leida" && notificacionId) {
      await notificacionService.marcarComoLeida(notificacionId);
      return NextResponse.json({ success: true });
    }

    if (accion === "marcar-todas-leidas" && usuarioId) {
      await notificacionService.marcarTodasComoLeidas(usuarioId);
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
            : "Error al procesar notificación",
      },
      { status: 500 }
    );
  }
}

