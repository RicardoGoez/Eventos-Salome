import { ProveedorRepositorySupabase } from "../supabase/repositories/proveedor.repository.supabase";
import { Proveedor } from "@/types/domain";

export class ProveedorService {
  private repository: ProveedorRepositorySupabase;

  constructor(repository: ProveedorRepositorySupabase) {
    this.repository = repository;
  }

  async obtenerProveedor(id: string): Promise<Proveedor | null> {
    return this.repository.findById(id);
  }

  async listarProveedores(): Promise<Proveedor[]> {
    return this.repository.findAll();
  }

  async listarActivos(): Promise<Proveedor[]> {
    return this.repository.findActivos();
  }

  async buscarProveedores(query: string): Promise<Proveedor[]> {
    return this.repository.search(query);
  }

  async crearProveedor(
    datos: Omit<Proveedor, "id" | "createdAt" | "updatedAt">
  ): Promise<Proveedor> {
    if (!datos.nombre.trim()) {
      throw new Error("El nombre es requerido");
    }
    if (!datos.telefono.trim()) {
      throw new Error("El teléfono es requerido");
    }

    return this.repository.create(datos);
  }

  async actualizarProveedor(
    id: string,
    datos: Partial<Proveedor>
  ): Promise<Proveedor> {
    return this.repository.update(id, datos);
  }

  async eliminarProveedor(id: string): Promise<boolean> {
    // Intentar eliminación física primero
    try {
      const eliminado = await this.repository.delete(id);
      return eliminado;
    } catch (error: any) {
      // Si falla por restricción de clave foránea (proveedor en entradas de inventario)
      if (error?.message?.includes('foreign key constraint') || 
          error?.message?.includes('violates foreign key') ||
          error?.code === '23503') {
        // Soft delete: marcar como inactivo en lugar de eliminar
        // Esto preserva la integridad histórica de las entradas de inventario
        await this.repository.update(id, { activo: false });
        return true; // Retornamos true porque el proveedor fue "eliminado" (soft delete)
      }
      // Si es otro tipo de error, relanzarlo
      throw error;
    }
  }
}
