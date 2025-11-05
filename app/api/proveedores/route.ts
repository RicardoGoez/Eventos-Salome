import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const soloActivos = searchParams.get("activos") === "true";

    const proveedorService = ServiceFactory.getProveedorService();

    let proveedores;
    if (query) {
      proveedores = await proveedorService.buscarProveedores(query);
    } else if (soloActivos) {
      proveedores = await proveedorService.listarActivos();
    } else {
      proveedores = await proveedorService.listarProveedores();
    }

    return NextResponse.json(proveedores);
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
    const proveedorService = ServiceFactory.getProveedorService();
    const proveedor = await proveedorService.crearProveedor(body);

    return NextResponse.json(proveedor, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear proveedor" },
      { status: 400 }
    );
  }
}
