import { ProductoRepositorySupabase } from "../supabase/repositories/producto.repository.supabase";
import { Producto, CategoriaProducto } from "@/types/domain";

// Servicio de aplicación - Patrón Service
export class ProductoService {
  private repository: ProductoRepositorySupabase;

  constructor(repository: ProductoRepositorySupabase) {
    this.repository = repository;
  }

  async obtenerProducto(id: string): Promise<Producto | null> {
    return this.repository.findById(id);
  }

  async listarProductos(): Promise<Producto[]> {
    return this.repository.findAll();
  }

  async listarPorCategoria(categoria: CategoriaProducto): Promise<Producto[]> {
    return this.repository.findByCategoria(categoria);
  }

  async buscarProductos(query: string): Promise<Producto[]> {
    return this.repository.search(query);
  }

  async crearProducto(
    datos: Omit<Producto, "id" | "createdAt" | "updatedAt">
  ): Promise<Producto> {
    // Validaciones de negocio
    if (datos.precio < 0) {
      throw new Error("El precio no puede ser negativo");
    }
    if (datos.costo < 0) {
      throw new Error("El costo no puede ser negativo");
    }
    if (!datos.nombre.trim()) {
      throw new Error("El nombre es requerido");
    }

    return this.repository.create(datos);
  }

  async actualizarProducto(
    id: string,
    datos: Partial<Producto>
  ): Promise<Producto> {
    if (datos.precio !== undefined && datos.precio < 0) {
      throw new Error("El precio no puede ser negativo");
    }
    if (datos.costo !== undefined && datos.costo < 0) {
      throw new Error("El costo no puede ser negativo");
    }

    return this.repository.update(id, datos);
  }

  async eliminarProducto(id: string): Promise<boolean> {
    // Intentar eliminación física primero
    try {
      const eliminado = await this.repository.delete(id);
      return eliminado;
    } catch (error: any) {
      // Si falla por restricción de clave foránea (producto en pedidos)
      if (error?.message?.includes('foreign key constraint') || 
          error?.message?.includes('violates foreign key') ||
          error?.code === '23503') {
        // Soft delete: marcar como no disponible en lugar de eliminar
        // Esto preserva la integridad histórica de los pedidos
        await this.cambiarDisponibilidad(id, false);
        return true; // Retornamos true porque el producto fue "eliminado" (soft delete)
      }
      // Si es otro tipo de error, relanzarlo
      throw error;
    }
  }

  async cambiarDisponibilidad(
    id: string,
    disponible: boolean
  ): Promise<Producto> {
    return this.repository.update(id, { disponible });
  }
}
