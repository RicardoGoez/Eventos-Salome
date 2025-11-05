import { BaseRepository } from "../patterns/base-repository";
import { Mesa } from "@/types/domain";

export class MesaRepository extends BaseRepository<Mesa> {
  async findByNumero(numero: number): Promise<Mesa | null> {
    const all = await this.findAll();
    return all.find((m) => m.numero === numero) || null;
  }

  async findDisponibles(): Promise<Mesa[]> {
    const all = await this.findAll();
    return all.filter((m) => m.disponible);
  }

  async findOcupadas(): Promise<Mesa[]> {
    const all = await this.findAll();
    return all.filter((m) => !m.disponible);
  }
}
