import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";
import { EstadoPedido } from "@/types/domain";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const estado = searchParams.get("estado");
    const clienteId = searchParams.get("clienteId");
    const mesaId = searchParams.get("mesaId");

    const pedidoService = ServiceFactory.getPedidoService();

    let pedidos: any[] = [];
    
    // Priorizar filtros específicos
    const isUuid = (v: string | null) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

    if (clienteId && isUuid(clienteId)) {
      pedidos = await pedidoService.listarPorCliente(clienteId);
      // Si además hay estado, filtrar
      if (estado) {
        pedidos = pedidos.filter(p => p.estado === estado);
      }
    } else if (clienteId && !isUuid(clienteId)) {
      // ClienteId no válido: devolver lista vacía en vez de error
      pedidos = [];
      // Filtrar por estado si también se proporciona
      if (estado) {
        pedidos = pedidos.filter(p => p.estado === estado);
      }
    } else if (mesaId) {
      pedidos = await pedidoService.listarPorMesa(mesaId);
      if (estado) {
        pedidos = pedidos.filter(p => p.estado === estado);
      }
    } else if (estado) {
      pedidos = await pedidoService.listarPorEstado(estado as EstadoPedido);
    } else {
      pedidos = await pedidoService.listarPedidos();
    }

    console.log(`[API Pedidos] Encontrados ${pedidos?.length || 0} pedidos`);
    return NextResponse.json(pedidos || []);
  } catch (error) {
    console.error('[API Pedidos] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pedidoService = ServiceFactory.getPedidoService();
    
    // Asegurar que los datos estén en el formato correcto
    const datosPedido = {
      items: body.items,
      clienteId: body.clienteId,
      clienteNombre: body.clienteNombre,
      mesaId: body.mesaId,
      descuentoId: body.descuentoId,
      metodoPago: body.metodoPago,
      notas: body.notas,
    };
    
    const pedido = await pedidoService.crearPedido(datosPedido);

    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear pedido" },
      { status: 400 }
    );
  }
}
