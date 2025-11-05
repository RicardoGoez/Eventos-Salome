import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bajoStock = searchParams.get("bajoStock") === "true";

    const inventarioService = ServiceFactory.getInventarioService();

    let items;
    if (bajoStock) {
      items = await inventarioService.listarBajoStock();
    } else {
      items = await inventarioService.listarItems();
    }

    console.log(`[API Inventario] Encontrados ${items?.length || 0} items`);
    return NextResponse.json(items || []);
  } catch (error) {
    console.error('[API Inventario] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inventarioService = ServiceFactory.getInventarioService();
    const item = await inventarioService.crearItem(body);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear item" },
      { status: 400 }
    );
  }
}
