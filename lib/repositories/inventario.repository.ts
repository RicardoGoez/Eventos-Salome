import { BaseRepository } from "../patterns/base-repository";
import { InventarioItem } from "@/types/domain";

export class InventarioRepository extends BaseRepository<InventarioItem> {
  async findByProductoId(productoId: string): Promise<InventarioItem | null> {
    const all = await this.findAll();
    return all.find((item) => item.productoId === productoId) || null;
  }

  async findBajoStock(): Promise<InventarioItem[]> {
    const all = await this.findAll();
    return all.filter((item) => item.cantidad <= item.cantidadMinima);
  }

  async findByUbicacion(ubicacion: string): Promise<InventarioItem[]> {
    const all = await this.findAll();
    return all.filter((item) => item.ubicacion === ubicacion);
  }

  async findProximosVencimiento(dias: number = 7): Promise<InventarioItem[]> {
    const all = await this.findAll();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);
    return all.filter(
      (item) =>
        item.fechaVencimiento &&
        item.fechaVencimiento <= fechaLimite &&
        item.fechaVencimiento >= new Date()
    );
  }
}
