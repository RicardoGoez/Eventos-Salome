import { DescuentoRepositorySupabase } from "../supabase/repositories/descuento.repository.supabase";
import { Descuento, TipoDescuento } from "@/types/domain";

export class DescuentoService {
  private repository: DescuentoRepositorySupabase;

  constructor(repository: DescuentoRepositorySupabase) {
    this.repository = repository;
  }

  async obtenerDescuento(id: string): Promise<Descuento | null> {
    return this.repository.findById(id);
  }

  async listarDescuentos(): Promise<Descuento[]> {
    return this.repository.findAll();
  }

  async listarActivos(): Promise<Descuento[]> {
    return this.repository.findActivos();
  }

  async listarAplicables(cantidadItems: number): Promise<Descuento[]> {
    return this.repository.findAplicables(cantidadItems);
  }

  async crearDescuento(
    datos: Omit<Descuento, "id" | "createdAt" | "updatedAt" | "aplicadoAPedidos">
  ): Promise<Descuento> {
    if (!datos.nombre.trim()) {
      throw new Error("El nombre es requerido");
    }
    if (datos.valor <= 0) {
      throw new Error("El valor del descuento debe ser mayor a cero");
    }
    if (
      datos.tipo === TipoDescuento.PORCENTAJE &&
      datos.valor > 100
    ) {
      throw new Error("El porcentaje no puede ser mayor a 100");
    }

    return this.repository.create({
      ...datos,
      aplicadoAPedidos: 0,
    });
  }

  async actualizarDescuento(
    id: string,
    datos: Partial<Descuento>
  ): Promise<Descuento> {
    return this.repository.update(id, datos);
  }

  async aplicarDescuento(
    id: string,
    subtotal: number
  ): Promise<{ descuentoAplicado: number; totalConDescuento: number }> {
    const descuento = await this.repository.findById(id);
    if (!descuento || !descuento.activo) {
      throw new Error("Descuento no válido");
    }

    let descuentoAplicado = 0;
    if (descuento.tipo === TipoDescuento.PORCENTAJE) {
      descuentoAplicado = (subtotal * descuento.valor) / 100;
    } else {
      descuentoAplicado = descuento.valor;
    }

    // No permitir que el descuento sea mayor al subtotal
    if (descuentoAplicado > subtotal) {
      descuentoAplicado = subtotal;
    }

    const totalConDescuento = subtotal - descuentoAplicado;

    // Incrementar contador
    await this.repository.update(id, {
      aplicadoAPedidos: (descuento.aplicadoAPedidos || 0) + 1,
    });

    return { descuentoAplicado, totalConDescuento };
  }

  async eliminarDescuento(id: string): Promise<boolean> {
    // Intentar eliminación física primero
    try {
      const eliminado = await this.repository.delete(id);
      return eliminado;
    } catch (error: any) {
      // Si falla por restricción de clave foránea (descuento en pedidos)
      // Nota: Aunque el schema usa SET NULL, es mejor práctica usar soft delete
      if (error?.message?.includes('foreign key constraint') || 
          error?.message?.includes('violates foreign key') ||
          error?.code === '23503') {
        // Soft delete: marcar como inactivo en lugar de eliminar
        // Esto preserva la integridad histórica de los pedidos
        await this.repository.update(id, { activo: false });
        return true; // Retornamos true porque el descuento fue "eliminado" (soft delete)
      }
      // Si es otro tipo de error, relanzarlo
      throw error;
    }
  }
}
