import { BaseRepository } from "../patterns/base-repository";
import { ActividadAuditoria } from "@/types/domain";

export class ActividadAuditoriaRepository extends BaseRepository<ActividadAuditoria> {
  async findByUsuario(usuarioId: string): Promise<ActividadAuditoria[]> {
    const all = await this.findAll();
    return all.filter((a) => a.usuarioId === usuarioId).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async findByEntidad(
    entidad: string,
    entidadId: string
  ): Promise<ActividadAuditoria[]> {
    const all = await this.findAll();
    return all
      .filter((a) => a.entidad === entidad && a.entidadId === entidadId)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<ActividadAuditoria[]> {
    const all = await this.findAll();
    return all
      .filter((a) => a.fecha >= fechaInicio && a.fecha <= fechaFin)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async findByAccion(accion: string): Promise<ActividadAuditoria[]> {
    const all = await this.findAll();
    return all
      .filter((a) => a.accion === accion)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }
}
