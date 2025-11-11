import { PedidoService } from "./pedido.service";
import { InventarioService } from "./inventario.service";
import { CierreCajaService } from "./cierre-caja.service";
import { KPI, Pedido, EstadoPedido } from "@/types/domain";

export interface PeriodoKPI {
  fechaInicio: Date;
  fechaFin: Date;
}

export class KPIService {
  private pedidoService: PedidoService;
  private inventarioService: InventarioService;
  private cierreCajaService: CierreCajaService;

  constructor(
    pedidoService: PedidoService,
    inventarioService: InventarioService,
    cierreCajaService: CierreCajaService
  ) {
    this.pedidoService = pedidoService;
    this.inventarioService = inventarioService;
    this.cierreCajaService = cierreCajaService;
  }

  /**
   * Obtiene todos los KPIs para un período
   */
  async obtenerKPIs(periodo: PeriodoKPI): Promise<KPI[]> {
    const kpis: KPI[] = [];

    // Obtener datos base
    const pedidos = await this.pedidoService.listarPedidos();
    const pedidosFiltrados = pedidos.filter(
      (p) => p.fecha >= periodo.fechaInicio && p.fecha <= periodo.fechaFin
    );

    // Calcular KPIs
    kpis.push(...(await this.calcularKPIsVentas(pedidosFiltrados, periodo)));
    kpis.push(...(await this.calcularKPIsOperativos(pedidosFiltrados, periodo)));
    kpis.push(...(await this.calcularKPIsInventario(periodo)));
    kpis.push(...(await this.calcularKPIsCalidad(pedidosFiltrados, periodo)));

    return kpis;
  }

  /**
   * Calcula KPIs relacionados con ventas
   */
  private async calcularKPIsVentas(
    pedidos: Pedido[],
    periodo: PeriodoKPI
  ): Promise<KPI[]> {
    const pedidosEntregados = pedidos.filter(
      (p) => p.estado === "ENTREGADO"
    );
    const totalVentas = pedidosEntregados.reduce(
      (sum, p) => sum + p.total,
      0
    );
    const promedioPorPedido =
      pedidosEntregados.length > 0
        ? totalVentas / pedidosEntregados.length
        : 0;

    // Calcular período anterior para comparación
    const diasPeriodo =
      (periodo.fechaFin.getTime() - periodo.fechaInicio.getTime()) /
      (1000 * 60 * 60 * 24);
    const periodoAnterior: PeriodoKPI = {
      fechaInicio: new Date(
        periodo.fechaInicio.getTime() - diasPeriodo * 24 * 60 * 60 * 1000
      ),
      fechaFin: periodo.fechaInicio,
    };

    const pedidosAnteriores = await this.pedidoService.listarPedidos();
    const pedidosAnterioresFiltrados = pedidosAnteriores.filter(
      (p) =>
        p.fecha >= periodoAnterior.fechaInicio &&
        p.fecha <= periodoAnterior.fechaFin &&
        p.estado === "ENTREGADO"
    );
    const totalVentasAnterior = pedidosAnterioresFiltrados.reduce(
      (sum, p) => sum + p.total,
      0
    );

    const comparativoVentas =
      totalVentasAnterior > 0
        ? ((totalVentas - totalVentasAnterior) / totalVentasAnterior) * 100
        : 0;

    return [
      {
        id: "kpi-total-ventas",
        nombre: "Total Ventas",
        valor: totalVentas,
        unidad: "COP",
        tendencia: comparativoVentas > 0 ? "up" : comparativoVentas < 0 ? "down" : "stable",
        comparativo: comparativoVentas,
        periodo: periodo.fechaFin,
      },
      {
        id: "kpi-promedio-pedido",
        nombre: "Promedio por Pedido",
        valor: promedioPorPedido,
        unidad: "COP",
        tendencia: "stable",
        comparativo: 0,
        periodo: periodo.fechaFin,
      },
      {
        id: "kpi-numero-pedidos",
        nombre: "Número de Pedidos",
        valor: pedidosEntregados.length,
        unidad: "unidades",
        tendencia: "stable",
        comparativo: 0,
        periodo: periodo.fechaFin,
      },
    ];
  }

  /**
   * Calcula KPIs operativos
   */
  private async calcularKPIsOperativos(
    pedidos: Pedido[],
    periodo: PeriodoKPI
  ): Promise<KPI[]> {
    const pedidosEntregados = pedidos.filter(
      (p) => p.estado === "ENTREGADO"
    );

    // Tiempo promedio de atención
    const tiemposAtencion: number[] = [];
    pedidosEntregados.forEach((pedido) => {
      const tiempo =
        (pedido.updatedAt.getTime() - pedido.fecha.getTime()) / (1000 * 60); // minutos
      tiemposAtencion.push(tiempo);
    });

    const tiempoPromedioAtencion =
      tiemposAtencion.length > 0
        ? tiemposAtencion.reduce((sum, t) => sum + t, 0) /
          tiemposAtencion.length
        : 0;

    // Tasa de error (pedidos cancelados)
    const pedidosCancelados = pedidos.filter(
      (p) => p.estado === "CANCELADO"
    ).length;
    const tasaError =
      pedidos.length > 0 ? (pedidosCancelados / pedidos.length) * 100 : 0;

    // Rotación de inventario (simplificado)
    const items = await this.inventarioService.listarItems();
    const rotacionInventario = items.length > 0 ? pedidosEntregados.length / items.length : 0;

    return [
      {
        id: "kpi-tiempo-atencion",
        nombre: "Tiempo Promedio de Atención",
        valor: tiempoPromedioAtencion,
        unidad: "minutos",
        tendencia: "stable",
        comparativo: 0,
        periodo: periodo.fechaFin,
      },
      {
        id: "kpi-tasa-error",
        nombre: "Tasa de Error",
        valor: tasaError,
        unidad: "%",
        tendencia: tasaError < 5 ? "stable" : "down",
        comparativo: 0,
        periodo: periodo.fechaFin,
      },
      {
        id: "kpi-rotacion-inventario",
        nombre: "Rotación de Inventario",
        valor: rotacionInventario,
        unidad: "veces",
        tendencia: "stable",
        comparativo: 0,
        periodo: periodo.fechaFin,
      },
    ];
  }

  /**
   * Calcula KPIs de inventario
   */
  private async calcularKPIsInventario(periodo: PeriodoKPI): Promise<KPI[]> {
    const items = await this.inventarioService.listarItems();
    const itemsBajoStock = await this.inventarioService.listarBajoStock();

    const exactitudInventario =
      items.length > 0
        ? ((items.length - itemsBajoStock.length) / items.length) * 100
        : 100;

    return [
      {
        id: "kpi-exactitud-inventario",
        nombre: "Exactitud de Inventario",
        valor: exactitudInventario,
        unidad: "%",
        tendencia: exactitudInventario > 95 ? "up" : "down",
        comparativo: 0,
        meta: 95,
        periodo: periodo.fechaFin,
      },
      {
        id: "kpi-items-bajo-stock",
        nombre: "Items con Stock Bajo",
        valor: itemsBajoStock.length,
        unidad: "unidades",
        tendencia: itemsBajoStock.length > 0 ? "down" : "up",
        comparativo: 0,
        periodo: periodo.fechaFin,
      },
    ];
  }

  /**
   * Calcula KPIs de calidad
   */
  private async calcularKPIsCalidad(
    pedidos: Pedido[],
    periodo: PeriodoKPI
  ): Promise<KPI[]> {
    const pedidosEntregados = pedidos.filter(
      (p) => p.estado === "ENTREGADO"
    );
    const pedidosCancelados = pedidos.filter(
      (p) => p.estado === "CANCELADO"
    );

    const tasaCompletitud =
      pedidos.length > 0
        ? (pedidosEntregados.length / pedidos.length) * 100
        : 100;

    return [
      {
        id: "kpi-tasa-completitud",
        nombre: "Tasa de Completitud",
        valor: tasaCompletitud,
        unidad: "%",
        tendencia: tasaCompletitud > 90 ? "up" : "down",
        comparativo: 0,
        meta: 95,
        periodo: periodo.fechaFin,
      },
    ];
  }

  /**
   * Calcula tiempo promedio de atención
   */
  async calcularTiempoPromedioAtencion(periodo: PeriodoKPI): Promise<number> {
    const pedidos = await this.pedidoService.listarPedidos();
    const pedidosFiltrados = pedidos.filter(
      (p) =>
        p.fecha >= periodo.fechaInicio &&
        p.fecha <= periodo.fechaFin &&
        p.estado === "ENTREGADO"
    );

    if (pedidosFiltrados.length === 0) return 0;

    const tiempos = pedidosFiltrados.map(
      (p) => (p.updatedAt.getTime() - p.fecha.getTime()) / (1000 * 60)
    );
    return tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
  }

  /**
   * Calcula tasa de error
   */
  async calcularTasaError(periodo: PeriodoKPI): Promise<number> {
    const pedidos = await this.pedidoService.listarPedidos();
    const pedidosFiltrados = pedidos.filter(
      (p) => p.fecha >= periodo.fechaInicio && p.fecha <= periodo.fechaFin
    );

    if (pedidosFiltrados.length === 0) return 0;

    const pedidosCancelados = pedidosFiltrados.filter(
      (p) => p.estado === "CANCELADO"
    ).length;

    return (pedidosCancelados / pedidosFiltrados.length) * 100;
  }

  /**
   * Calcula rotación de inventario
   */
  async calcularRotacionInventario(periodo: PeriodoKPI): Promise<number> {
    const items = await this.inventarioService.listarItems();
    const pedidos = await this.pedidoService.listarPedidos();
    const pedidosFiltrados = pedidos.filter(
      (p) =>
        p.fecha >= periodo.fechaInicio &&
        p.fecha <= periodo.fechaFin &&
        p.estado === "ENTREGADO"
    );

    if (items.length === 0) return 0;

    return pedidosFiltrados.length / items.length;
  }
}

