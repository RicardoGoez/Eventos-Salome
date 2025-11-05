import { InventarioRepositorySupabase } from "../supabase/repositories/inventario.repository.supabase";
import { MovimientoInventarioRepositorySupabase } from "../supabase/repositories/movimiento-inventario.repository.supabase";
import {
  InventarioItem,
  MovimientoInventario,
  TipoMovimientoInventario,
} from "@/types/domain";

// Servicio de aplicación - Patrón Service
export class InventarioService {
  private inventarioRepository: InventarioRepositorySupabase;
  private movimientoRepository: MovimientoInventarioRepositorySupabase;

  constructor(
    inventarioRepository: InventarioRepositorySupabase,
    movimientoRepository: MovimientoInventarioRepositorySupabase
  ) {
    this.inventarioRepository = inventarioRepository;
    this.movimientoRepository = movimientoRepository;
  }

  async obtenerItem(id: string): Promise<InventarioItem | null> {
    return this.inventarioRepository.findById(id);
  }

  async obtenerItemByProductoId(productoId: string): Promise<InventarioItem | null> {
    return this.inventarioRepository.findByProductoId(productoId);
  }

  async listarItems(): Promise<InventarioItem[]> {
    return this.inventarioRepository.findAll();
  }

  async listarBajoStock(): Promise<InventarioItem[]> {
    return this.inventarioRepository.findBajoStock();
  }

  async crearItem(
    datos: Omit<InventarioItem, "id" | "createdAt" | "updatedAt">
  ): Promise<InventarioItem> {
    if (datos.cantidad < 0) {
      throw new Error("La cantidad no puede ser negativa");
    }
    if (datos.cantidadMinima < 0) {
      throw new Error("La cantidad mínima no puede ser negativa");
    }

    const item = await this.inventarioRepository.create(datos);

    // Registrar movimiento inicial
    await this.movimientoRepository.create({
      inventarioItemId: item.id,
      tipo: TipoMovimientoInventario.ENTRADA,
      cantidad: datos.cantidad,
      motivo: "Inventario inicial",
      fecha: new Date(),
    });

    return item;
  }

  async actualizarCantidad(
    itemId: string,
    nuevaCantidad: number,
    tipo: TipoMovimientoInventario,
    motivo?: string
  ): Promise<{ item: InventarioItem; movimiento: MovimientoInventario }> {
    const item = await this.inventarioRepository.findById(itemId);
    if (!item) {
      throw new Error("Item de inventario no encontrado");
    }

    if (nuevaCantidad < 0) {
      throw new Error("La cantidad no puede ser negativa");
    }

    // Calcular diferencia
    const diferencia = nuevaCantidad - item.cantidad;

    // Actualizar item
    const itemActualizado = await this.inventarioRepository.update(itemId, {
      cantidad: nuevaCantidad,
    });

    // Registrar movimiento
    const movimiento = await this.movimientoRepository.create({
      inventarioItemId: itemId,
      tipo,
      cantidad: Math.abs(diferencia),
      motivo: motivo || "Ajuste de inventario",
      fecha: new Date(),
    });

    return { item: itemActualizado, movimiento };
  }

  async ajustarStock(
    itemId: string,
    cantidad: number,
    tipo: TipoMovimientoInventario,
    motivo?: string
  ): Promise<{ item: InventarioItem; movimiento: MovimientoInventario }> {
    const item = await this.inventarioRepository.findById(itemId);
    if (!item) {
      throw new Error("Item de inventario no encontrado");
    }

    let nuevaCantidad: number;
    if (tipo === TipoMovimientoInventario.ENTRADA) {
      nuevaCantidad = item.cantidad + cantidad;
    } else if (tipo === TipoMovimientoInventario.SALIDA) {
      nuevaCantidad = item.cantidad - cantidad;
      if (nuevaCantidad < 0) {
        throw new Error("No hay suficiente stock disponible");
      }
    } else {
      nuevaCantidad = cantidad;
    }

    return this.actualizarCantidad(itemId, nuevaCantidad, tipo, motivo);
  }
}
