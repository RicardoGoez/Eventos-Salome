import { BaseRepository } from "../patterns/base-repository";
import { Descuento } from "@/types/domain";

export class DescuentoRepository extends BaseRepository<Descuento> {
  async findActivos(): Promise<Descuento[]> {
    const all = await this.findAll();
    const ahora = new Date();
    return all.filter((d) => {
      if (!d.activo) return false;
      if (d.fechaInicio && d.fechaInicio > ahora) return false;
      if (d.fechaFin && d.fechaFin < ahora) return false;
      return true;
    });
  }

  async findAplicables(cantidadItems: number): Promise<Descuento[]> {
    const activos = await this.findActivos();
    return activos.filter((d) => {
      if (d.cantidadMinima && cantidadItems < d.cantidadMinima) return false;
      return true;
    });
  }
}
