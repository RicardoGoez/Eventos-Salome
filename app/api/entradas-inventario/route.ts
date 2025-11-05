import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const proveedorId = searchParams.get("proveedorId");
    const inventarioItemId = searchParams.get("inventarioItemId");
    const fechaInicio = searchParams.get("fechaInicio");
    const fechaFin = searchParams.get("fechaFin");

    const entradaService = ServiceFactory.getEntradaInventarioService();

    let entradas;
    if (proveedorId) {
      entradas = await entradaService.listarPorProveedor(proveedorId);
    } else if (inventarioItemId) {
      entradas = await entradaService.listarPorInventarioItem(inventarioItemId);
    } else if (fechaInicio && fechaFin) {
      entradas = await entradaService.listarPorFecha(
        new Date(fechaInicio),
        new Date(fechaFin)
      );
    } else {
      entradas = await entradaService.listarEntradas();
    }

    return NextResponse.json(entradas);
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
    const entradaService = ServiceFactory.getEntradaInventarioService();
    const resultado = await entradaService.registrarEntrada(body);

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al registrar entrada",
      },
      { status: 400 }
    );
  }
}
