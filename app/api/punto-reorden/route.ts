import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const inventarioItemId = searchParams.get("inventarioItemId");
    const nivelServicio = searchParams.get("nivelServicio") || "0.95";
    const accion = searchParams.get("accion") || "obtener";

    const puntoReordenService = ServiceFactory.getPuntoReordenService();

    if (accion === "actualizar-todos") {
      // Actualizar puntos de reorden para todos los items
      const puntos = await puntoReordenService.actualizarPuntoReordenAutomatico();
      return NextResponse.json(puntos);
    }

    if (inventarioItemId) {
      // Calcular punto de reorden para un item específico
      const puntoReorden = await puntoReordenService.calcularPuntoReorden(
        inventarioItemId,
        parseFloat(nivelServicio)
      );
      return NextResponse.json(puntoReorden);
    }

    return NextResponse.json(
      { error: "inventarioItemId es requerido" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al calcular punto de reorden",
      },
      { status: 500 }
    );
  }
}

