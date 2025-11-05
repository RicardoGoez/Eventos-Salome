import { BaseRepository } from "../patterns/base-repository";
import { CierreCaja } from "@/types/domain";

export class CierreCajaRepository extends BaseRepository<CierreCaja> {
  async findByFecha(fecha: Date): Promise<CierreCaja | null> {
    const all = await this.findAll();
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    return (
      all.find(
        (c) =>
          c.fecha >= inicioDia &&
          c.fecha <= finDia &&
          !c.cerrado
      ) || null
    );
  }

  async findCerrados(): Promise<CierreCaja[]> {
    const all = await this.findAll();
    return all.filter((c) => c.cerrado).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async findByUsuario(usuarioId: string): Promise<CierreCaja[]> {
    const all = await this.findAll();
    return all.filter((c) => c.usuarioId === usuarioId);
  }

  async findByRangoFechas(fechaInicio: Date, fechaFin: Date): Promise<CierreCaja[]> {
    const all = await this.findAll();
    return all.filter((c) => c.fecha >= fechaInicio && c.fecha <= fechaFin);
  }
}
