import { InventarioService } from "./inventario.service";
import { PronosticoDemandaService } from "./pronostico-demanda.service";
import { PedidoService } from "./pedido.service";
import { PuntoReorden, InventarioItem, Pedido } from "@/types/domain";

export class PuntoReordenService {
  private inventarioService: InventarioService;
  private pronosticoService: PronosticoDemandaService;
  private pedidoService: PedidoService;
  private puntosReorden: Map<string, PuntoReorden> = new Map();

  constructor(
    inventarioService: InventarioService,
    pronosticoService: PronosticoDemandaService,
    pedidoService: PedidoService
  ) {
    this.inventarioService = inventarioService;
    this.pronosticoService = pronosticoService;
    this.pedidoService = pedidoService;
  }

  /**
   * Calcula punto de reorden (s) y cantidad de reorden (Q) usando modelo (s, Q)
   * Nivel de servicio objetivo: 95%
   */
  async calcularPuntoReorden(
    inventarioItemId: string,
    nivelServicio: number = 0.95
  ): Promise<PuntoReorden> {
    const item = await this.inventarioService.obtenerItem(inventarioItemId);
    if (!item) {
      throw new Error("Item de inventario no encontrado");
    }

    // Obtener demanda promedio y desviación estándar
    const { demandaPromedio, desviacionEstandar, tiempoEntrega } =
      await this.calcularEstadisticasDemanda(item.productoId);

    // Calcular punto de reorden (s) usando distribución normal
    // s = demanda_media * tiempo_entrega + z * desviacion_estandar * sqrt(tiempo_entrega)
    // z es el valor crítico para el nivel de servicio (95% = 1.645)
    const z = this.obtenerZScore(nivelServicio);
    const puntoReorden = Math.ceil(
      demandaPromedio * tiempoEntrega +
        z * desviacionEstandar * Math.sqrt(tiempoEntrega)
    );

    // Calcular cantidad de reorden (Q) usando modelo EOQ simplificado
    // Q = sqrt(2 * demanda_anual * costo_orden / costo_mantenimiento)
    // Simplificado: Q = sqrt(2 * demanda_promedio * tiempo_entrega * factor)
    const factorCosto = 10; // Factor simplificado (en producción usar costos reales)
    const cantidadReorden = Math.ceil(
      Math.sqrt(2 * demandaPromedio * tiempoEntrega * factorCosto)
    );

    const puntoReordenObj: PuntoReorden = {
      inventarioItemId: item.id,
      inventarioItem: item,
      puntoReorden,
      cantidadReorden,
      nivelServicio,
      tiempoEntrega,
      demandaPromedio,
      desviacionEstandar,
      actualizado: new Date(),
    };

    this.puntosReorden.set(inventarioItemId, puntoReordenObj);
    return puntoReordenObj;
  }

  /**
   * Actualiza punto de reorden automáticamente para todos los items
   */
  async actualizarPuntoReordenAutomatico(): Promise<PuntoReorden[]> {
    const items = await this.inventarioService.listarItems();
    const puntosActualizados: PuntoReorden[] = [];

    for (const item of items) {
      try {
        const puntoReorden = await this.calcularPuntoReorden(item.id);
        puntosActualizados.push(puntoReorden);
      } catch (error) {
        console.error(
          `Error al calcular punto de reorden para item ${item.id}:`,
          error
        );
      }
    }

    return puntosActualizados;
  }

  /**
   * Obtiene nivel de servicio actual para un producto
   */
  async obtenerNivelServicio(productoId: string): Promise<number> {
    const pedidos = await this.pedidoService.listarPedidos();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30); // Últimos 30 días

    const pedidosFiltrados = pedidos.filter(
      (p) =>
        p.fecha >= fechaInicio &&
        p.estado === "ENTREGADO" &&
        p.items.some((item) => item.productoId === productoId)
    );

    if (pedidosFiltrados.length === 0) {
      return 0;
    }

    // Calcular tasa de cumplimiento (pedidos completados sin problemas)
    const pedidosCompletados = pedidosFiltrados.length;
    const pedidosConProblemas = pedidosFiltrados.filter(
      (p) => p.estado === "CANCELADO"
    ).length;

    const nivelServicio =
      (pedidosCompletados - pedidosConProblemas) / pedidosCompletados;
    return Math.max(0, Math.min(1, nivelServicio));
  }

  /**
   * Calcula estadísticas de demanda para un producto
   */
  private async calcularEstadisticasDemanda(productoId: string): Promise<{
    demandaPromedio: number;
    desviacionEstandar: number;
    tiempoEntrega: number;
  }> {
    const pedidos = await this.pedidoService.listarPedidos();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 90); // Últimos 90 días

    const pedidosFiltrados = pedidos.filter(
      (p) =>
        p.fecha >= fechaInicio &&
        p.estado === "ENTREGADO" &&
        p.items.some((item) => item.productoId === productoId)
    );

    // Calcular demanda diaria
    const demandaDiaria: number[] = [];
    const demandaMap: Map<string, number> = new Map();

    pedidosFiltrados.forEach((pedido) => {
      const fechaStr = pedido.fecha.toISOString().split("T")[0];
      pedido.items.forEach((item) => {
        if (item.productoId === productoId) {
          const cantidad = demandaMap.get(fechaStr) || 0;
          demandaMap.set(fechaStr, cantidad + item.cantidad);
        }
      });
    });

    const valores = Array.from(demandaMap.values());
    if (valores.length === 0) {
      // Valores por defecto si no hay datos
      return {
        demandaPromedio: 1,
        desviacionEstandar: 0.5,
        tiempoEntrega: 7, // días
      };
    }

    // Calcular promedio
    const demandaPromedio =
      valores.reduce((sum, val) => sum + val, 0) / valores.length;

    // Calcular desviación estándar
    const varianza =
      valores.reduce(
        (sum, val) => sum + Math.pow(val - demandaPromedio, 2),
        0
      ) / valores.length;
    const desviacionEstandar = Math.sqrt(varianza);

    // Tiempo de entrega estimado (en producción, obtener de proveedores)
    const tiempoEntrega = 7; // días

    return {
      demandaPromedio: Math.max(0.1, demandaPromedio),
      desviacionEstandar: Math.max(0.1, desviacionEstandar),
      tiempoEntrega,
    };
  }

  /**
   * Obtiene valor Z-score para nivel de servicio dado
   */
  private obtenerZScore(nivelServicio: number): number {
    // Valores Z comunes para niveles de servicio
    const zScores: Record<number, number> = {
      0.8: 0.842,
      0.85: 1.036,
      0.9: 1.282,
      0.95: 1.645,
      0.99: 2.326,
    };

    // Encontrar el Z-score más cercano
    const niveles = Object.keys(zScores)
      .map(Number)
      .sort((a, b) => a - b);
    let zScore = 1.645; // Default 95%

    for (const nivel of niveles) {
      if (nivelServicio <= nivel) {
        zScore = zScores[nivel];
        break;
      }
    }

    return zScore;
  }

  /**
   * Obtiene punto de reorden para un item
   */
  async obtenerPuntoReorden(
    inventarioItemId: string
  ): Promise<PuntoReorden | null> {
    return this.puntosReorden.get(inventarioItemId) || null;
  }
}

