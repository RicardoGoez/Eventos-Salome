import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { CierreCaja } from '@/types/domain';

export class CierreCajaRepositorySupabase extends BaseRepositorySupabase<CierreCaja> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'cierres_caja');
  }

  async findByFecha(fecha: Date): Promise<CierreCaja | null> {
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const { data, error } = await this.supabase
      .from('cierres_caja')
      .select('*')
      .gte('fecha', inicioDia.toISOString())
      .lte('fecha', finDia.toISOString())
      .eq('cerrado', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error finding cierre by fecha: ${error.message}`);
    }

    return data ? dbToDomain<CierreCaja>(data) : null;
  }

  async findCerrados(): Promise<CierreCaja[]> {
    const { data, error } = await this.supabase
      .from('cierres_caja')
      .select('*')
      .eq('cerrado', true)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding cierres cerrados: ${error.message}`);
    }

    return dbToDomain<CierreCaja[]>(data || []);
  }

  async findByUsuario(usuarioId: string): Promise<CierreCaja[]> {
    const { data, error } = await this.supabase
      .from('cierres_caja')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding cierres by usuario: ${error.message}`);
    }

    return dbToDomain<CierreCaja[]>(data || []);
  }

  async findByRangoFechas(fechaInicio: Date, fechaFin: Date): Promise<CierreCaja[]> {
    const { data, error } = await this.supabase
      .from('cierres_caja')
      .select('*')
      .gte('fecha', fechaInicio.toISOString())
      .lte('fecha', fechaFin.toISOString())
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding cierres by rango fechas: ${error.message}`);
    }

    return dbToDomain<CierreCaja[]>(data || []);
  }
}

