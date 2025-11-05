import { BaseRepository } from "../patterns/base-repository";
import { MovimientoInventario } from "@/types/domain";

export class MovimientoInventarioRepository extends BaseRepository<MovimientoInventario> {
  async findByInventarioItemId(
    inventarioItemId: string
  ): Promise<MovimientoInventario[]> {
    const all = await this.findAll();
    return all.filter((m) => m.inventarioItemId === inventarioItemId);
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<MovimientoInventario[]> {
    const all = await this.findAll();
    return all.filter(
      (m) => m.fecha >= fechaInicio && m.fecha <= fechaFin
    );
  }
}
