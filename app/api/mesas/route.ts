import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const disponibles = searchParams.get("disponibles") === "true";
    const ocupadas = searchParams.get("ocupadas") === "true";

    const mesaService = ServiceFactory.getMesaService();

    let mesas;
    if (disponibles) {
      mesas = await mesaService.listarDisponibles();
    } else if (ocupadas) {
      mesas = await mesaService.listarOcupadas();
    } else {
      mesas = await mesaService.listarMesas();
    }

    return NextResponse.json(mesas);
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
    const mesaService = ServiceFactory.getMesaService();
    const mesa = await mesaService.crearMesa(body);

    return NextResponse.json(mesa, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear mesa" },
      { status: 400 }
    );
  }
}
