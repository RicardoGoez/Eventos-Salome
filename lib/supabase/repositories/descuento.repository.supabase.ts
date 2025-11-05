import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { Descuento } from '@/types/domain';

export class DescuentoRepositorySupabase extends BaseRepositorySupabase<Descuento> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'descuentos');
  }

  async findActivos(): Promise<Descuento[]> {
    const ahora = new Date().toISOString();
    
    const { data, error } = await this.supabase
      .from('descuentos')
      .select('*')
      .eq('activo', true)
      .or(`fecha_inicio.is.null,fecha_inicio.lte.${ahora}`)
      .or(`fecha_fin.is.null,fecha_fin.gte.${ahora}`);

    if (error) {
      throw new Error(`Error finding descuentos activos: ${error.message}`);
    }

    // Filtrar en memoria por fechas ya que Supabase no maneja bien las condiciones complejas
    const descuentos = dbToDomain<Descuento[]>(data || []);
    return descuentos.filter((d) => {
      if (!d.activo) return false;
      if (d.fechaInicio && d.fechaInicio > new Date()) return false;
      if (d.fechaFin && d.fechaFin < new Date()) return false;
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

