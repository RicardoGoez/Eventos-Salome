import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { MovimientoInventario } from '@/types/domain';

export class MovimientoInventarioRepositorySupabase extends BaseRepositorySupabase<MovimientoInventario> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'movimientos_inventario');
  }

  async findByInventarioItemId(inventarioItemId: string): Promise<MovimientoInventario[]> {
    const { data, error } = await this.supabase
      .from('movimientos_inventario')
      .select('*')
      .eq('inventario_item_id', inventarioItemId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding movimientos by inventario_item_id: ${error.message}`);
    }

    return dbToDomain<MovimientoInventario[]>(data || []);
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<MovimientoInventario[]> {
    const { data, error } = await this.supabase
      .from('movimientos_inventario')
      .select('*')
      .gte('fecha', fechaInicio.toISOString())
      .lte('fecha', fechaFin.toISOString())
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding movimientos by fecha: ${error.message}`);
    }

    return dbToDomain<MovimientoInventario[]>(data || []);
  }
}

