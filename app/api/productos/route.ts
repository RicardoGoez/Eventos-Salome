import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";
import { CategoriaProducto } from "@/types/domain";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoria = searchParams.get("categoria");
    const query = searchParams.get("query");

    const productoService = ServiceFactory.getProductoService();

    let productos;
    if (categoria) {
      productos = await productoService.listarPorCategoria(
        categoria as CategoriaProducto
      );
    } else if (query) {
      productos = await productoService.buscarProductos(query);
    } else {
      productos = await productoService.listarProductos();
    }

    console.log(`[API Productos] Encontrados ${productos?.length || 0} productos`);
    return NextResponse.json(productos || []);
  } catch (error) {
    console.error('[API Productos] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productoService = ServiceFactory.getProductoService();
    const producto = await productoService.crearProducto(body);

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear producto" },
      { status: 400 }
    );
  }
}
