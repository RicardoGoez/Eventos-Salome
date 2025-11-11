import { InventarioService } from "./inventario.service";
import { ProductoService } from "./producto.service";
import { AlertaInventario, InventarioItem } from "@/types/domain";

export class AlertaInventarioService {
  private inventarioService: InventarioService;
  private productoService: ProductoService;
  private alertas: Map<string, AlertaInventario> = new Map();

  constructor(
    inventarioService: InventarioService,
    productoService: ProductoService
  ) {
    this.inventarioService = inventarioService;
    this.productoService = productoService;
  }

  /**
   * Verifica y genera alertas automáticas para items con stock bajo
   */
  async verificarYNotificarStockBajo(): Promise<AlertaInventario[]> {
    const itemsBajoStock = await this.inventarioService.listarBajoStock();
    const nuevasAlertas: AlertaInventario[] = [];

    for (const item of itemsBajoStock) {
      // Verificar si ya existe una alerta activa para este item
      const alertaExistente = Array.from(this.alertas.values()).find(
        (a) => a.inventarioItemId === item.id && !a.leida
      );

      if (!alertaExistente) {
        const producto = await this.productoService.obtenerProducto(
          item.productoId
        );
        const porcentajeStock = (item.cantidad / item.cantidadMinima) * 100;

        let severidad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
        let tipo: "STOCK_BAJO" | "PROXIMO_VENCIMIENTO" | "SIN_STOCK";

        if (item.cantidad === 0) {
          severidad = "CRITICA";
          tipo = "SIN_STOCK";
        } else if (porcentajeStock <= 25) {
          severidad = "ALTA";
          tipo = "STOCK_BAJO";
        } else if (porcentajeStock <= 50) {
          severidad = "MEDIA";
          tipo = "STOCK_BAJO";
        } else {
          severidad = "BAJA";
          tipo = "STOCK_BAJO";
        }

        const alerta: AlertaInventario = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          inventarioItemId: item.id,
          inventarioItem: item,
          tipo,
          severidad,
          mensaje: this.generarMensajeAlerta(item, producto?.nombre || "Producto", tipo, severidad),
          leida: false,
          fecha: new Date(),
          createdAt: new Date(),
        };

        this.alertas.set(alerta.id, alerta);
        nuevasAlertas.push(alerta);
      }
    }

    return nuevasAlertas;
  }

  /**
   * Verifica productos próximos a vencer
   */
  async verificarProximosVencimiento(dias: number = 7): Promise<AlertaInventario[]> {
    const items = await this.inventarioService.listarItems();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const nuevasAlertas: AlertaInventario[] = [];

    for (const item of items) {
      if (item.fechaVencimiento) {
        const fechaVenc = new Date(item.fechaVencimiento);
        fechaVenc.setHours(0, 0, 0, 0);

        if (fechaVenc <= fechaLimite && fechaVenc >= hoy) {
          const diasRestantes = Math.ceil(
            (fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
          );

          const alertaExistente = Array.from(this.alertas.values()).find(
            (a) =>
              a.inventarioItemId === item.id &&
              a.tipo === "PROXIMO_VENCIMIENTO" &&
              !a.leida
          );

          if (!alertaExistente) {
            const producto = await this.productoService.obtenerProducto(
              item.productoId
            );

            let severidad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
            if (diasRestantes <= 2) {
              severidad = "CRITICA";
            } else if (diasRestantes <= 4) {
              severidad = "ALTA";
            } else {
              severidad = "MEDIA";
            }

            const alerta: AlertaInventario = {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              inventarioItemId: item.id,
              inventarioItem: item,
              tipo: "PROXIMO_VENCIMIENTO",
              severidad,
              mensaje: `${producto?.nombre || "Producto"} vence en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}. Cantidad: ${item.cantidad} ${item.unidad}`,
              leida: false,
              fecha: new Date(),
              createdAt: new Date(),
            };

            this.alertas.set(alerta.id, alerta);
            nuevasAlertas.push(alerta);
          }
        }
      }
    }

    return nuevasAlertas;
  }

  /**
   * Obtiene todas las alertas activas (no leídas)
   */
  async obtenerAlertasActivas(): Promise<AlertaInventario[]> {
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

  /**
   * Configura umbral inteligente basado en histórico
   */
  async configurarUmbralInteligente(productoId: string): Promise<number> {
    // Por ahora, retorna un cálculo simple basado en demanda promedio
    // En producción, esto debería usar datos históricos reales
    const item = await this.inventarioService.obtenerItemByProductoId(productoId);
    if (!item) {
      throw new Error("Item de inventario no encontrado");
    }

    // Calcular demanda promedio (simplificado)
    // En producción, esto debería analizar ventas históricas
    const demandaPromedio = item.cantidadMinima * 0.3; // Estimación conservadora
    const tiempoEntrega = 7; // días estimados
    const factorSeguridad = 1.5; // 50% de margen de seguridad

    return Math.ceil(demandaPromedio * tiempoEntrega * factorSeguridad);
  }

  private generarMensajeAlerta(
    item: InventarioItem,
    nombreProducto: string,
    tipo: string,
    severidad: string
  ): string {
    const porcentaje = ((item.cantidad / item.cantidadMinima) * 100).toFixed(0);

    if (tipo === "SIN_STOCK") {
      return `⚠️ CRÍTICO: ${nombreProducto} está sin stock. Reorden urgente requerido.`;
    }

    return `Stock bajo de ${nombreProducto}: ${item.cantidad} ${item.unidad} (${porcentaje}% del mínimo). Stock mínimo: ${item.cantidadMinima} ${item.unidad}`;
  }
}

