import { BaseRepository } from "../patterns/base-repository";
import { EntradaInventario } from "@/types/domain";

export class EntradaInventarioRepository extends BaseRepository<EntradaInventario> {
  async findByProveedor(proveedorId: string): Promise<EntradaInventario[]> {
    const all = await this.findAll();
    return all.filter((e) => e.proveedorId === proveedorId);
  }

  async findByInventarioItem(
    inventarioItemId: string
  ): Promise<EntradaInventario[]> {
    const all = await this.findAll();
    return all.filter((e) => e.inventarioItemId === inventarioItemId);
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<EntradaInventario[]> {
    const all = await this.findAll();
    return all.filter(
      (e) => e.fecha >= fechaInicio && e.fecha <= fechaFin
    );
  }
}
