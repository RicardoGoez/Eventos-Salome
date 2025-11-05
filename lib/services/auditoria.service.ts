import { ActividadAuditoriaRepositorySupabase } from "../supabase/repositories/actividad-auditoria.repository.supabase";
import { ActividadAuditoria } from "@/types/domain";

export class AuditoriaService {
  private repository: ActividadAuditoriaRepositorySupabase;

  constructor(repository: ActividadAuditoriaRepositorySupabase) {
    this.repository = repository;
  }

  async registrarActividad(
    datos: Omit<
      ActividadAuditoria,
      "id" | "fecha"
    >
  ): Promise<ActividadAuditoria> {
    return this.repository.create({
      ...datos,
      fecha: new Date(),
    });
  }

  async obtenerHistorialPorUsuario(usuarioId: string): Promise<ActividadAuditoria[]> {
    return this.repository.findByUsuario(usuarioId);
  }

  async obtenerHistorialPorEntidad(
    entidad: string,
    entidadId: string
  ): Promise<ActividadAuditoria[]> {
    return this.repository.findByEntidad(entidad, entidadId);
  }

  async obtenerHistorialPorFecha(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<ActividadAuditoria[]> {
    return this.repository.findByFecha(fechaInicio, fechaFin);
  }

  async obtenerHistorialPorAccion(accion: string): Promise<ActividadAuditoria[]> {
    return this.repository.findByAccion(accion);
  }
}
