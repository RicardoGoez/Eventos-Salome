import { ProductoService } from "./producto.service";
import { PedidoService } from "./pedido.service";
import { ClasificacionABC, Producto, Pedido } from "@/types/domain";

export interface PeriodoAnalisis {
  fechaInicio: Date;
  fechaFin: Date;
}

export class AnalisisABCService {
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
   * Clasifica productos según análisis ABC (Pareto 80/20)
   */
  async clasificarProductos(
    periodo?: PeriodoAnalisis
  ): Promise<ClasificacionABC[]> {
    const productos = await this.productoService.listarProductos();
    const pedidos = await this.pedidoService.listarPedidos();

    // Filtrar pedidos por período si se especifica
    let pedidosFiltrados = pedidos;
    if (periodo) {
      pedidosFiltrados = pedidos.filter(
        (p) => p.fecha >= periodo.fechaInicio && p.fecha <= periodo.fechaFin
      );
    }

    // Calcular valor de rotación por producto
    const valorRotacion: Map<
      string,
      { cantidad: number; ingresos: number; producto: Producto }
    > = new Map();

    pedidosFiltrados
      .filter((p) => p.estado === "ENTREGADO")
      .forEach((pedido) => {
        pedido.items.forEach((item) => {
          const productoId = item.productoId;
          const producto = productos.find((p) => p.id === productoId);

          if (producto) {
            const valor = valorRotacion.get(productoId) || {
              cantidad: 0,
              ingresos: 0,
              producto,
            };

            valor.cantidad += item.cantidad;
            valor.ingresos += item.subtotal;
            valorRotacion.set(productoId, valor);
          }
        });
      });

    // Convertir a array y calcular valor total de rotación
    const productosConRotacion = Array.from(valorRotacion.values()).map(
      (valor) => ({
        productoId: valor.producto.id,
        producto: valor.producto,
        valorRotacion: valor.ingresos, // Usar ingresos como valor de rotación
        cantidadVendida: valor.cantidad,
        ingresos: valor.ingresos,
      })
    );

    // Ordenar por valor de rotación descendente
    productosConRotacion.sort((a, b) => b.valorRotacion - a.valorRotacion);

    // Calcular valor total acumulado
    const valorTotal = productosConRotacion.reduce(
      (sum, p) => sum + p.valorRotacion,
      0
    );

    // Clasificar según Pareto 80/20
    let acumulado = 0;
    const clasificaciones: ClasificacionABC[] = productosConRotacion.map(
      (item) => {
        acumulado += item.valorRotacion;
        const porcentajeAcumulado = (acumulado / valorTotal) * 100;

        let categoria: "A" | "B" | "C";
        if (porcentajeAcumulado <= 80) {
          categoria = "A"; // 80% del valor
        } else if (porcentajeAcumulado <= 95) {
          categoria = "B"; // 15% del valor
        } else {
          categoria = "C"; // 5% del valor
        }

        return {
          productoId: item.productoId,
          producto: item.producto,
          categoria,
          valorRotacion: item.valorRotacion,
          porcentajeAcumulado,
          cantidadVendida: item.cantidadVendida,
          ingresos: item.ingresos,
        };
      }
    );

    return clasificaciones;
  }

  /**
   * Obtiene productos de categoría A (alta rotación)
   */
  async obtenerProductosCategoriaA(
    periodo?: PeriodoAnalisis
  ): Promise<ClasificacionABC[]> {
    const clasificaciones = await this.clasificarProductos(periodo);
    return clasificaciones.filter((c) => c.categoria === "A");
  }

  /**
   * Genera reporte de análisis ABC
   */
  async generarReporteABC(
    periodo?: PeriodoAnalisis
  ): Promise<{
    total: number;
    categoriaA: number;
    categoriaB: number;
    categoriaC: number;
    valorTotalA: number;
    valorTotalB: number;
    valorTotalC: number;
    clasificaciones: ClasificacionABC[];
  }> {
    const clasificaciones = await this.clasificarProductos(periodo);

    const categoriaA = clasificaciones.filter((c) => c.categoria === "A");
    const categoriaB = clasificaciones.filter((c) => c.categoria === "B");
    const categoriaC = clasificaciones.filter((c) => c.categoria === "C");

    const valorTotalA = categoriaA.reduce((sum, c) => sum + c.valorRotacion, 0);
    const valorTotalB = categoriaB.reduce((sum, c) => sum + c.valorRotacion, 0);
    const valorTotalC = categoriaC.reduce((sum, c) => sum + c.valorRotacion, 0);

    return {
      total: clasificaciones.length,
      categoriaA: categoriaA.length,
      categoriaB: categoriaB.length,
      categoriaC: categoriaC.length,
      valorTotalA,
      valorTotalB,
      valorTotalC,
      clasificaciones,
    };
  }
}

