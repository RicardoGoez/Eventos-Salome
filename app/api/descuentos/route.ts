import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activos = searchParams.get("activos") === "true";
    const aplicables = searchParams.get("aplicables") === "true";
    const cantidadItems = searchParams.get("cantidadItems");

    const descuentoService = ServiceFactory.getDescuentoService();

    let descuentos;
    if (aplicables && cantidadItems) {
      descuentos = await descuentoService.listarAplicables(
        parseInt(cantidadItems)
      );
    } else if (activos) {
      descuentos = await descuentoService.listarActivos();
    } else {
      descuentos = await descuentoService.listarDescuentos();
    }

    return NextResponse.json(descuentos);
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
    const descuentoService = ServiceFactory.getDescuentoService();
    const descuento = await descuentoService.crearDescuento(body);

    return NextResponse.json(descuento, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al crear descuento",
      },
      { status: 400 }
    );
  }
}
