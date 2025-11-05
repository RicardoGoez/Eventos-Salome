import { CierreCajaRepository } from "../repositories/cierre-caja.repository";
import { PedidoRepository } from "../repositories/pedido.repository";
import { CierreCaja, MetodoPago, EstadoPedido } from "@/types/domain";

export class CierreCajaService {
  private cierreRepository: CierreCajaRepository;
  private pedidoRepository: PedidoRepository;

  constructor(
    cierreRepository: CierreCajaRepository,
    pedidoRepository: PedidoRepository
  ) {
    this.cierreRepository = cierreRepository;
    this.pedidoRepository = pedidoRepository;
  }

  async iniciarCierre(
    fechaInicio: Date,
    usuarioId: string
  ): Promise<CierreCaja> {
    // Verificar si ya existe un cierre abierto para hoy
    const cierreExistente = await this.cierreRepository.findByFecha(
      fechaInicio
    );
    if (cierreExistente) {
      throw new Error("Ya existe un cierre de caja abierto para esta fecha");
    }

    return this.cierreRepository.create({
      fecha: fechaInicio,
      fechaInicio,
      fechaFin: fechaInicio,
      totalVentas: 0,
      totalEfectivo: 0,
      totalTarjeta: 0,
      totalTransferencia: 0,
      numeroPedidos: 0,
      numeroPedidosCancelados: 0,
      usuarioId,
      cerrado: false,
    });
  }

  async calcularCierre(
    fechaInicio: Date,
    fechaFin: Date,
    usuarioId: string,
    diferenciaEfectivo?: number,
    notas?: string
  ): Promise<CierreCaja> {
    // Obtener todos los pedidos del período
    const pedidos = await this.pedidoRepository.findByFecha(
      fechaInicio,
      fechaFin
    );

    const pedidosEntregados = pedidos.filter(
      (p) => p.estado === EstadoPedido.ENTREGADO
    );
    const pedidosCancelados = pedidos.filter(
      (p) => p.estado === EstadoPedido.CANCELADO
    );

    // Calcular totales por método de pago
    let totalVentas = 0;
    let totalEfectivo = 0;
    let totalTarjeta = 0;
    let totalTransferencia = 0;

    pedidosEntregados.forEach((pedido) => {
      totalVentas += pedido.total;
      switch (pedido.metodoPago) {
        case MetodoPago.EFECTIVO:
          totalEfectivo += pedido.total;
          break;
        case MetodoPago.TARJETA:
          totalTarjeta += pedido.total;
          break;
        case MetodoPago.TRANSFERENCIA:
          totalTransferencia += pedido.total;
          break;
      }
    });

    const cierre: CierreCaja = {
      id: "",
      fecha: fechaFin,
      fechaInicio,
      fechaFin,
      totalVentas,
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      numeroPedidos: pedidosEntregados.length,
      numeroPedidosCancelados: pedidosCancelados.length,
      diferenciaEfectivo,
      notas,
      usuarioId,
      cerrado: true,
      createdAt: new Date(),
    };

    return this.cierreRepository.create(cierre);
  }

  async cerrarCaja(
    cierreId: string,
    diferenciaEfectivo?: number,
    notas?: string
  ): Promise<CierreCaja> {
    const cierre = await this.cierreRepository.findById(cierreId);
    if (!cierre) {
      throw new Error("Cierre de caja no encontrado");
    }
    if (cierre.cerrado) {
      throw new Error("El cierre de caja ya está cerrado");
    }

    // Recalcular
    const pedidos = await this.pedidoRepository.findByFecha(
      cierre.fechaInicio,
      cierre.fechaFin
    );

    const pedidosEntregados = pedidos.filter(
      (p) => p.estado === EstadoPedido.ENTREGADO
    );
    const pedidosCancelados = pedidos.filter(
      (p) => p.estado === EstadoPedido.CANCELADO
    );

    let totalVentas = 0;
    let totalEfectivo = 0;
    let totalTarjeta = 0;
    let totalTransferencia = 0;

    pedidosEntregados.forEach((pedido) => {
      totalVentas += pedido.total;
      switch (pedido.metodoPago) {
        case MetodoPago.EFECTIVO:
          totalEfectivo += pedido.total;
          break;
        case MetodoPago.TARJETA:
          totalTarjeta += pedido.total;
          break;
        case MetodoPago.TRANSFERENCIA:
          totalTransferencia += pedido.total;
          break;
      }
    });

    return this.cierreRepository.update(cierreId, {
      fechaFin: new Date(),
      totalVentas,
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      numeroPedidos: pedidosEntregados.length,
      numeroPedidosCancelados: pedidosCancelados.length,
      diferenciaEfectivo,
      notas,
      cerrado: true,
    });
  }

  async obtenerCierres(): Promise<CierreCaja[]> {
    return this.cierreRepository.findCerrados();
  }

  async obtenerCierrePorFecha(fecha: Date): Promise<CierreCaja | null> {
    return this.cierreRepository.findByFecha(fecha);
  }

  async obtenerCierresPorRango(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<CierreCaja[]> {
    return this.cierreRepository.findByRangoFechas(fechaInicio, fechaFin);
  }
}
