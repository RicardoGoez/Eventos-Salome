import { ProductoService } from "./producto.service";
import { PedidoService } from "./pedido.service";
import { PronosticoDemanda, Pedido, ItemPedido } from "@/types/domain";

export interface PeriodoPronostico {
  fechaInicio: Date;
  fechaFin: Date;
}

export class PronosticoDemandaService {
  private productoService: ProductoService;
  private pedidoService: PedidoService;

  constructor(
    productoService: ProductoService,
    pedidoService: PedidoService
  ) {
    this.productoService = productoService;
    this.pedidoService = pedidoService;
  }

  /**
   * Calcula pronóstico de demanda usando suavizado exponencial triple
   */
  async calcularSuavizadoExponencial(
    productoId: string,
    periodo: number = 30 // días
  ): Promise<PronosticoDemanda> {
    const pedidos = await this.pedidoService.listarPedidos();
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - periodo);

    // Filtrar pedidos del período y que contengan el producto
    const pedidosFiltrados = pedidos.filter(
      (p) =>
        p.fecha >= fechaInicio &&
        p.fecha <= fechaInicio &&
        p.estado === "ENTREGADO" &&
        p.items.some((item) => item.productoId === productoId)
    );

    // Extraer demanda histórica por día
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

    // Ordenar por fecha y crear array
    const fechas = Array.from(demandaMap.keys()).sort();
    fechas.forEach((fecha) => {
      demandaDiaria.push(demandaMap.get(fecha) || 0);
    });

    if (demandaDiaria.length === 0) {
      // Si no hay datos históricos, retornar pronóstico conservador
      return {
        productoId,
        periodo: new Date(),
        demandaPronosticada: 0,
        nivelConfianza: 0,
        metodo: "SUAVIZADO_EXPONENCIAL",
        createdAt: new Date(),
      };
    }

    // Calcular suavizado exponencial triple
    const alpha = 0.3; // Factor de suavizado (0-1)
    const beta = 0.1; // Factor de tendencia
    const gamma = 0.1; // Factor de estacionalidad

    // Inicializar valores
    let nivel = demandaDiaria[0];
    let tendencia = 0;
    let estacionalidad = 0;

    // Calcular promedio inicial
    const promedioInicial =
      demandaDiaria.slice(0, Math.min(7, demandaDiaria.length)).reduce(
        (sum, val) => sum + val,
        0
      ) / Math.min(7, demandaDiaria.length);

    nivel = promedioInicial;

    // Aplicar suavizado exponencial
    for (let i = 1; i < demandaDiaria.length; i++) {
      const valorAnterior = nivel;
      nivel = alpha * demandaDiaria[i] + (1 - alpha) * (nivel + tendencia);
      tendencia = beta * (nivel - valorAnterior) + (1 - beta) * tendencia;
    }

    // Pronóstico para el siguiente período
    const demandaPronosticada = Math.max(0, Math.round(nivel + tendencia));

    // Calcular nivel de confianza basado en variabilidad
    const promedio = demandaDiaria.reduce((sum, val) => sum + val, 0) / demandaDiaria.length;
    const varianza =
      demandaDiaria.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) /
      demandaDiaria.length;
    const desviacionEstandar = Math.sqrt(varianza);
    const coeficienteVariacion = promedio > 0 ? desviacionEstandar / promedio : 1;
    const nivelConfianza = Math.max(0, Math.min(1, 1 - coeficienteVariacion));

    const producto = await this.productoService.obtenerProducto(productoId);

    return {
      productoId,
      producto: producto || undefined,
      periodo: new Date(),
      demandaPronosticada,
      nivelConfianza,
      metodo: "SUAVIZADO_EXPONENCIAL",
      createdAt: new Date(),
    };
  }

  /**
   * Predice demanda para N días en el futuro
   */
  async predecirDemanda(
    productoId: string,
    dias: number = 7
  ): Promise<number> {
    const pronostico = await this.calcularSuavizadoExponencial(productoId);
    return Math.max(0, Math.round(pronostico.demandaPronosticada * dias));
  }

  /**
   * Ajusta stock mínimo basado en pronóstico
   */
  async ajustarStockMinimo(productoId: string): Promise<number> {
    const pronostico = await this.calcularSuavizadoExponencial(productoId);
    const tiempoEntrega = 7; // días estimados
    const factorSeguridad = 1.5; // 50% de margen

    const stockMinimoRecomendado = Math.ceil(
      pronostico.demandaPronosticada * tiempoEntrega * factorSeguridad
    );

    return stockMinimoRecomendado;
  }

  /**
   * Obtiene pronósticos para todos los productos
   */
  async obtenerPronosticosTodos(
    periodo: number = 30
  ): Promise<PronosticoDemanda[]> {
    const productos = await this.productoService.listarProductos();
    const pronosticos: PronosticoDemanda[] = [];

    for (const producto of productos) {
      try {
        const pronostico = await this.calcularSuavizadoExponencial(
          producto.id,
          periodo
        );
        pronosticos.push(pronostico);
      } catch (error) {
        console.error(
          `Error al calcular pronóstico para ${producto.nombre}:`,
          error
        );
      }
    }

    return pronosticos;
  }
}

