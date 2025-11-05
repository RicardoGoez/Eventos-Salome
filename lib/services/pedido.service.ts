import { PedidoRepository } from "../repositories/pedido.repository";
import { PedidoRepositorySupabase } from "../supabase/repositories/pedido.repository.supabase";
import { InventarioService } from "./inventario.service";
import { ProductoService } from "./producto.service";
import { DescuentoService } from "./descuento.service";
import { Pedido, ItemPedido, EstadoPedido, MetodoPago, TipoMovimientoInventario, Descuento } from "@/types/domain";
import QRCode from "qrcode";

// Servicio de aplicación - Patrón Service
export class PedidoService {
  private pedidoRepository: PedidoRepository;
  private inventarioService: InventarioService;
  private productoService: ProductoService;
  private descuentoService: DescuentoService;
  private IVA_PORCENTAJE = 0.16; // 16% IVA

  constructor(
    pedidoRepository: PedidoRepository,
    inventarioService: InventarioService,
    productoService: ProductoService,
    descuentoService: DescuentoService
  ) {
    this.pedidoRepository = pedidoRepository;
    this.inventarioService = inventarioService;
    this.productoService = productoService;
    this.descuentoService = descuentoService;
  }

  async obtenerPedido(id: string): Promise<Pedido | null> {
    return this.pedidoRepository.findById(id);
  }

  async listarPedidos(): Promise<Pedido[]> {
    return this.pedidoRepository.findAll();
  }

  async listarPorEstado(estado: EstadoPedido): Promise<Pedido[]> {
    return this.pedidoRepository.findByEstado(estado);
  }

  async crearPedido(datos: {
    items: Array<{
      productoId: string;
      cantidad: number;
      notas?: string;
    }>;
    clienteId?: string;
    clienteNombre?: string;
    mesaId?: string;
    descuentoId?: string;
    metodoPago?: MetodoPago;
    notas?: string;
  }): Promise<Pedido> {
    if (!datos.items || datos.items.length === 0) {
      throw new Error("El pedido debe tener al menos un item");
    }

    // Validar productos, stock y calcular totales
    const items: ItemPedido[] = [];
    let subtotal = 0;

    for (const itemData of datos.items) {
      const producto = await this.productoService.obtenerProducto(
        itemData.productoId
      );
      if (!producto) {
        throw new Error(`Producto ${itemData.productoId} no encontrado`);
      }
      if (!producto.disponible) {
        throw new Error(`Producto ${producto.nombre} no está disponible`);
      }

      // Validar stock disponible
      const inventarioItem = await this.inventarioService.obtenerItemByProductoId(itemData.productoId);
      if (inventarioItem && inventarioItem.cantidad < itemData.cantidad) {
        throw new Error(
          `Stock insuficiente para ${producto.nombre}. Disponible: ${inventarioItem.cantidad}`
        );
      }

      const itemSubtotal = producto.precio * itemData.cantidad;
      subtotal += itemSubtotal;

      items.push({
        id: `${Date.now()}-${Math.random()}`,
        pedidoId: "",
        productoId: producto.id,
        producto,
        cantidad: itemData.cantidad,
        precioUnitario: producto.precio,
        subtotal: itemSubtotal,
        notas: itemData.notas,
      });
    }

    // Aplicar descuento si existe
    let descuento = 0;
    let descuentoAplicado: Descuento | undefined = undefined;
    if (datos.descuentoId) {
      const resultado = await this.descuentoService.aplicarDescuento(
        datos.descuentoId,
        subtotal
      );
      descuento = resultado.descuentoAplicado;
      subtotal = resultado.totalConDescuento;
      const d = await this.descuentoService.obtenerDescuento(
        datos.descuentoId
      );
      descuentoAplicado = d || undefined;
    }

    // Calcular IVA
    const iva = subtotal * this.IVA_PORCENTAJE;
    const total = subtotal + iva;

    // Crear pedido (el repositorio ya maneja los items)
    const numero = await this.pedidoRepository.generateNumero();
    
    const pedido = await this.pedidoRepository.create({
      numero,
      items,
      estado: EstadoPedido.PENDIENTE,
      subtotal,
      descuento,
      iva,
      total,
      metodoPago: datos.metodoPago,
      clienteId: datos.clienteId,
      clienteNombre: datos.clienteNombre,
      mesaId: datos.mesaId,
      descuentoId: datos.descuentoId,
      descuentoAplicado,
      notas: datos.notas,
      fecha: new Date(),
    });

    // Generar código QR para el ticket después de tener el ID
    const ticketQR = await this.generarQR(pedido.id);
    
    if (ticketQR) {
      await this.pedidoRepository.update(pedido.id, {
        ticketQR,
      });
    }

    // Recargar el pedido completo con el QR actualizado
    const pedidoCompleto = await this.pedidoRepository.findById(pedido.id);
    return pedidoCompleto || { ...pedido, ticketQR };
  }

  private async generarQR(pedidoId: string): Promise<string> {
    try {
      const qrData = JSON.stringify({
        pedidoId,
        fecha: new Date().toISOString(),
      });
      return await QRCode.toDataURL(qrData);
    } catch (error) {
      console.error("Error generando QR:", error);
      return "";
    }
  }

  async listarPorCliente(clienteId: string): Promise<Pedido[]> {
    if (this.pedidoRepository instanceof PedidoRepositorySupabase) {
      return (this.pedidoRepository as PedidoRepositorySupabase).findByCliente(clienteId);
    }
    const all = await this.pedidoRepository.findAll();
    return all.filter((p) => p.clienteId === clienteId);
  }

  async listarPorMesa(mesaId: string): Promise<Pedido[]> {
    if (this.pedidoRepository instanceof PedidoRepositorySupabase) {
      return (this.pedidoRepository as PedidoRepositorySupabase).findByMesa(mesaId);
    }
    const all = await this.pedidoRepository.findAll();
    return all.filter((p) => p.mesaId === mesaId);
  }

  async actualizarEstado(
    id: string,
    nuevoEstado: EstadoPedido
  ): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findById(id);
    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }

    // Si el pedido cambia a ENTREGADO, actualizar inventario
    if (nuevoEstado === EstadoPedido.ENTREGADO && pedido.estado !== EstadoPedido.ENTREGADO) {
      for (const item of pedido.items) {
        const inventarioItem = await this.inventarioService.obtenerItemByProductoId(
          item.productoId
        );
        if (inventarioItem) {
          await this.inventarioService.ajustarStock(
            inventarioItem.id,
            item.cantidad,
            TipoMovimientoInventario.SALIDA,
            `Venta - Pedido ${pedido.numero}`
          );
        }
      }
    }

    return this.pedidoRepository.update(id, { estado: nuevoEstado });
  }

  async cancelarPedido(id: string): Promise<Pedido> {
    return this.actualizarEstado(id, EstadoPedido.CANCELADO);
  }
}
