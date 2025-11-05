import { BaseRepository } from "../patterns/base-repository";
import { Producto } from "@/types/domain";

export class ProductoRepository extends BaseRepository<Producto> {
  async findByCategoria(categoria: Producto["categoria"]): Promise<Producto[]> {
    const all = await this.findAll();
    return all.filter((p) => p.categoria === categoria);
  }

  async findByDisponible(disponible: boolean): Promise<Producto[]> {
    const all = await this.findAll();
    return all.filter((p) => p.disponible === disponible);
  }

  async search(query: string): Promise<Producto[]> {
    const all = await this.findAll();
    const lowerQuery = query.toLowerCase();
    return all.filter(
      (p) =>
        p.nombre.toLowerCase().includes(lowerQuery) ||
        p.descripcion?.toLowerCase().includes(lowerQuery)
    );
  }
}
