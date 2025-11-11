import { PedidoService } from "./pedido.service";
import { CierreCajaService } from "./cierre-caja.service";
import { KPIService } from "./kpi.service";
import { AlertaNegocio, Pedido, EstadoPedido } from "@/types/domain";
import { formatCOP } from "@/lib/utils";

export interface UmbralesAlerta {
  ventasMinimas: number; // % de la meta
  tiempoMaximoAtencion: number; // minutos
  diferenciaMaximaCaja: number; // %
  tasaErrorMaxima: number; // %
  satisfaccionMinima: number; // 0-5
}

export class AlertaNegocioService {
  private pedidoService: PedidoService;
  private cierreCajaService: CierreCajaService;
  private kpiService: KPIService;
  private alertas: Map<string, AlertaNegocio> = new Map();
  private umbrales: UmbralesAlerta = {
    ventasMinimas: 80, // 80% de la meta
    tiempoMaximoAtencion: 10, // 10 minutos
    diferenciaMaximaCaja: 5, // 5%
    tasaErrorMaxima: 5, // 5%
    satisfaccionMinima: 3.5, // 3.5/5
  };

  constructor(
    pedidoService: PedidoService,
    cierreCajaService: CierreCajaService,
    kpiService: KPIService
  ) {
    this.pedidoService = pedidoService;
    this.cierreCajaService = cierreCajaService;
    this.kpiService = kpiService;
  }

  /**
   * Verifica desviaciones en ventas
   */
  async verificarDesviacionesVentas(): Promise<AlertaNegocio[]> {
    const hoy = new Date();
    const inicioDia = new Date(hoy);
    inicioDia.setHours(0, 0, 0, 0);

    const pedidos = await this.pedidoService.listarPedidos();
    const pedidosHoy = pedidos.filter(
      (p) =>
        p.fecha >= inicioDia &&
        p.fecha <= hoy &&
        p.estado === "ENTREGADO"
    );

    const ventasHoy = pedidosHoy.reduce((sum, p) => sum + p.total, 0);

    // Calcular promedio de ventas de días anteriores (últimos 7 días)
    const ultimos7Dias: Date[] = [];
    for (let i = 1; i <= 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      fecha.setHours(0, 0, 0, 0);
      ultimos7Dias.push(fecha);
    }

    const ventasAnteriores = ultimos7Dias.map((fecha) => {
      const finDia = new Date(fecha);
      finDia.setHours(23, 59, 59, 999);
      return pedidos
        .filter(
          (p) =>
            p.fecha >= fecha &&
            p.fecha <= finDia &&
            p.estado === "ENTREGADO"
        )
        .reduce((sum, p) => sum + p.total, 0);
    });

    const promedioVentas =
      ventasAnteriores.reduce((sum, v) => sum + v, 0) / ventasAnteriores.length;

    const metaVentas = promedioVentas * (this.umbrales.ventasMinimas / 100);
    const desviacion = promedioVentas > 0
      ? ((ventasHoy - promedioVentas) / promedioVentas) * 100
      : 0;

    const alertas: AlertaNegocio[] = [];

    if (ventasHoy < metaVentas) {
      const severidad =
        desviacion < -30 ? "CRITICA" : desviacion < -15 ? "ALTA" : "MEDIA";

      const alerta: AlertaNegocio = {
        id: `ventas-${Date.now()}`,
        tipo: "VENTAS_BAJAS",
        severidad,
        mensaje: `Ventas del día están ${Math.abs(desviacion).toFixed(1)}% por debajo del promedio. Meta: ${formatCOP(metaVentas)}, Actual: ${formatCOP(ventasHoy)}`,
        valorActual: ventasHoy,
        valorEsperado: promedioVentas,
        desviacion,
        leida: false,
        fecha: new Date(),
        createdAt: new Date(),
      };

      this.alertas.set(alerta.id, alerta);
      alertas.push(alerta);
    }

    return alertas;
  }

  /**
   * Verifica tiempos de preparación excesivos
   */
  async verificarTiemposPreparacion(): Promise<AlertaNegocio[]> {
    const pedidos = await this.pedidoService.listarPedidos();
    const ahora = new Date();

    const pedidosActivos = pedidos.filter(
      (p) =>
        p.estado === EstadoPedido.PENDIENTE ||
        p.estado === EstadoPedido.EN_PREPARACION
    );

    const alertas: AlertaNegocio[] = [];

    pedidosActivos.forEach((pedido) => {
      const tiempoTranscurrido =
        (ahora.getTime() - pedido.fecha.getTime()) / (1000 * 60); // minutos

      if (tiempoTranscurrido > this.umbrales.tiempoMaximoAtencion) {
        const desviacion =
          ((tiempoTranscurrido - this.umbrales.tiempoMaximoAtencion) /
            this.umbrales.tiempoMaximoAtencion) *
          100;

        const severidad =
          desviacion > 100 ? "CRITICA" : desviacion > 50 ? "ALTA" : "MEDIA";

        const alerta: AlertaNegocio = {
          id: `tiempo-${pedido.id}-${Date.now()}`,
          tipo: "TIEMPO_EXCESIVO",
          severidad,
          mensaje: `Pedido #${pedido.numero} lleva ${tiempoTranscurrido.toFixed(1)} minutos en preparación (máximo: ${this.umbrales.tiempoMaximoAtencion} min)`,
          valorActual: tiempoTranscurrido,
          valorEsperado: this.umbrales.tiempoMaximoAtencion,
          desviacion,
          leida: false,
          fecha: new Date(),
          createdAt: new Date(),
        };

        this.alertas.set(alerta.id, alerta);
        alertas.push(alerta);
      }
    });

    return alertas;
  }

  /**
   * Verifica diferencias en cierre de caja
   */
  async verificarDiferenciasCaja(): Promise<AlertaNegocio[]> {
    const cierres = await this.cierreCajaService.obtenerCierres();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const cierresHoy = cierres.filter((c) => {
      const fechaCierre = new Date(c.fecha);
      fechaCierre.setHours(0, 0, 0, 0);
      return fechaCierre.getTime() === hoy.getTime();
    });

    const alertas: AlertaNegocio[] = [];

    cierresHoy.forEach((cierre) => {
      if (cierre.diferenciaEfectivo !== undefined) {
        const diferenciaAbsoluta = Math.abs(cierre.diferenciaEfectivo);
        const diferenciaPorcentual =
          cierre.totalEfectivo > 0
            ? (diferenciaAbsoluta / cierre.totalEfectivo) * 100
            : 0;

        if (diferenciaPorcentual > this.umbrales.diferenciaMaximaCaja) {
          const severidad =
            diferenciaPorcentual > 10
              ? "CRITICA"
              : diferenciaPorcentual > 7
              ? "ALTA"
              : "MEDIA";

          const alerta: AlertaNegocio = {
            id: `caja-${cierre.id}-${Date.now()}`,
            tipo: "DIFERENCIA_CAJA",
            severidad,
            mensaje: `Diferencia en cierre de caja: ${formatCOP(diferenciaAbsoluta)} (${diferenciaPorcentual.toFixed(2)}%). Máximo permitido: ${this.umbrales.diferenciaMaximaCaja}%`,
            valorActual: diferenciaPorcentual,
            valorEsperado: this.umbrales.diferenciaMaximaCaja,
            desviacion: diferenciaPorcentual - this.umbrales.diferenciaMaximaCaja,
            leida: false,
            fecha: new Date(),
            createdAt: new Date(),
          };

          this.alertas.set(alerta.id, alerta);
          alertas.push(alerta);
        }
      }
    });

    return alertas;
  }

  /**
   * Verifica tasa de error alta
   */
  async verificarTasaError(): Promise<AlertaNegocio[]> {
    const hoy = new Date();
    const inicioDia = new Date(hoy);
    inicioDia.setHours(0, 0, 0, 0);

    const pedidos = await this.pedidoService.listarPedidos();
    const pedidosHoy = pedidos.filter(
      (p) => p.fecha >= inicioDia && p.fecha <= hoy
    );

    if (pedidosHoy.length === 0) return [];

    const pedidosCancelados = pedidosHoy.filter(
      (p) => p.estado === "CANCELADO"
    ).length;

    const tasaError = (pedidosCancelados / pedidosHoy.length) * 100;

    const alertas: AlertaNegocio[] = [];

    if (tasaError > this.umbrales.tasaErrorMaxima) {
      const desviacion = tasaError - this.umbrales.tasaErrorMaxima;
      const severidad =
        tasaError > 15 ? "CRITICA" : tasaError > 10 ? "ALTA" : "MEDIA";

      const alerta: AlertaNegocio = {
        id: `error-${Date.now()}`,
        tipo: "ERROR_ALTO",
        severidad,
        mensaje: `Tasa de error del ${tasaError.toFixed(1)}% supera el umbral del ${this.umbrales.tasaErrorMaxima}%. Pedidos cancelados: ${pedidosCancelados}/${pedidosHoy.length}`,
        valorActual: tasaError,
        valorEsperado: this.umbrales.tasaErrorMaxima,
        desviacion,
        leida: false,
        fecha: new Date(),
        createdAt: new Date(),
      };

      this.alertas.set(alerta.id, alerta);
      alertas.push(alerta);
    }

    return alertas;
  }

  /**
   * Configura umbrales de alerta
   */
  async configurarUmbrales(umbrales: Partial<UmbralesAlerta>): Promise<void> {
    this.umbrales = { ...this.umbrales, ...umbrales };
  }

  /**
   * Obtiene todas las alertas activas
   */
  async obtenerAlertasActivas(): Promise<AlertaNegocio[]> {
    return Array.from(this.alertas.values()).filter((a) => !a.leida);
  }

  /**
   * Marca una alerta como leída
   */
  async marcarComoLeida(alertaId: string): Promise<void> {
    const alerta = this.alertas.get(alertaId);
    if (alerta) {
      alerta.leida = true;
      this.alertas.set(alertaId, alerta);
    }
  }
}

