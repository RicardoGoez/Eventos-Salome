import { MesaRepositorySupabase } from "../supabase/repositories/mesa.repository.supabase";
import { Mesa } from "@/types/domain";

export class MesaService {
  private repository: MesaRepositorySupabase;

  constructor(repository: MesaRepositorySupabase) {
    this.repository = repository;
  }

  async obtenerMesa(id: string): Promise<Mesa | null> {
    return this.repository.findById(id);
  }

  async obtenerPorNumero(numero: number): Promise<Mesa | null> {
    return this.repository.findByNumero(numero);
  }

  async listarMesas(): Promise<Mesa[]> {
    return this.repository.findAll();
  }

  async listarDisponibles(): Promise<Mesa[]> {
    return this.repository.findDisponibles();
  }

  async listarOcupadas(): Promise<Mesa[]> {
    return this.repository.findOcupadas();
  }

  async crearMesa(
    datos: Omit<Mesa, "id" | "createdAt" | "updatedAt">
  ): Promise<Mesa> {
    // Verificar que no exista otra mesa con el mismo número
    const existe = await this.repository.findByNumero(datos.numero);
    if (existe) {
      throw new Error(`Ya existe una mesa con el número ${datos.numero}`);
    }

    if (datos.capacidad <= 0) {
      throw new Error("La capacidad debe ser mayor a cero");
    }

    return this.repository.create(datos);
  }

  async actualizarMesa(id: string, datos: Partial<Mesa>): Promise<Mesa> {
    return this.repository.update(id, datos);
  }

  async ocuparMesa(id: string): Promise<Mesa> {
    return this.repository.update(id, { disponible: false });
  }

  async liberarMesa(id: string): Promise<Mesa> {
    return this.repository.update(id, { disponible: true });
  }

  async eliminarMesa(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
