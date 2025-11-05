import { NextRequest, NextResponse } from "next/server";
import { ServiceFactory } from "@/lib/factories/service-factory";

export async function GET(_req: NextRequest) {
  try {
    const pedidoService = ServiceFactory.getPedidoService();

    // Últimos 7 días
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    // Si el repositorio no tiene un método específico, usamos listar y agregamos
    const pedidos = await pedidoService.listarPedidos();
    const ultimos7 = pedidos.filter((p: any) => new Date(p.fecha) >= start);

    const porDia: Record<string, { total: number; ventas: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      porDia[key] = { total: 0, ventas: 0 };
    }

    let totalGeneral = 0;
    let ventas = 0;

    ultimos7.forEach((p: any) => {
      const key = new Date(p.fecha).toISOString().slice(0, 10);
      if (!porDia[key]) porDia[key] = { total: 0, ventas: 0 };
      porDia[key].total += p.total;
      porDia[key].ventas += 1;
      totalGeneral += p.total;
      ventas += 1;
    });

    const promedioDiario = totalGeneral / 7;

    return NextResponse.json({
      rango: { desde: start.toISOString().slice(0, 10), hasta: now.toISOString().slice(0, 10) },
      resumen: { totalGeneral, ventas, promedioDiario },
      porDia,
      // TODO: Generar y devolver PDF/Excel (opcional): pdfUrl, excelUrl
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error generando reporte semanal" },
      { status: 500 }
    );
  }
}
