import { BaseRepository } from "../patterns/base-repository";
import { Proveedor } from "@/types/domain";

export class ProveedorRepository extends BaseRepository<Proveedor> {
  async findActivos(): Promise<Proveedor[]> {
    const all = await this.findAll();
    return all.filter((p) => p.activo);
  }

  async search(query: string): Promise<Proveedor[]> {
    const all = await this.findAll();
    const lowerQuery = query.toLowerCase();
    return all.filter(
      (p) =>
        p.nombre.toLowerCase().includes(lowerQuery) ||
        p.telefono.includes(query) ||
        p.email?.toLowerCase().includes(lowerQuery)
    );
  }
}
