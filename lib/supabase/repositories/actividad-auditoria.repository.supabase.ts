import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { ActividadAuditoria } from '@/types/domain';

export class ActividadAuditoriaRepositorySupabase extends BaseRepositorySupabase<ActividadAuditoria> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'actividades_auditoria');
  }

  async findByUsuario(usuarioId: string): Promise<ActividadAuditoria[]> {
    const { data, error } = await this.supabase
      .from('actividades_auditoria')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding actividades by usuario: ${error.message}`);
    }

    return dbToDomain<ActividadAuditoria[]>(data || []);
  }

  async findByEntidad(entidad: string, entidadId: string): Promise<ActividadAuditoria[]> {
    const { data, error } = await this.supabase
      .from('actividades_auditoria')
      .select('*')
      .eq('entidad', entidad)
      .eq('entidad_id', entidadId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding actividades by entidad: ${error.message}`);
    }

    return dbToDomain<ActividadAuditoria[]>(data || []);
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<ActividadAuditoria[]> {
    const { data, error } = await this.supabase
      .from('actividades_auditoria')
      .select('*')
      .gte('fecha', fechaInicio.toISOString())
      .lte('fecha', fechaFin.toISOString())
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding actividades by fecha: ${error.message}`);
    }

    return dbToDomain<ActividadAuditoria[]>(data || []);
  }

  async findByAccion(accion: string): Promise<ActividadAuditoria[]> {
    const { data, error } = await this.supabase
      .from('actividades_auditoria')
      .select('*')
      .eq('accion', accion)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding actividades by accion: ${error.message}`);
    }

    return dbToDomain<ActividadAuditoria[]>(data || []);
  }
}

