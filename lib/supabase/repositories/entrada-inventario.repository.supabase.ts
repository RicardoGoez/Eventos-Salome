import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { EntradaInventario } from '@/types/domain';

export class EntradaInventarioRepositorySupabase extends BaseRepositorySupabase<EntradaInventario> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'entradas_inventario');
  }

  async findByProveedor(proveedorId: string): Promise<EntradaInventario[]> {
    const { data, error } = await this.supabase
      .from('entradas_inventario')
      .select('*')
      .eq('proveedor_id', proveedorId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding entradas by proveedor: ${error.message}`);
    }

    return dbToDomain<EntradaInventario[]>(data || []);
  }

  async findByInventarioItem(inventarioItemId: string): Promise<EntradaInventario[]> {
    const { data, error } = await this.supabase
      .from('entradas_inventario')
      .select('*')
      .eq('inventario_item_id', inventarioItemId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding entradas by inventario_item: ${error.message}`);
    }

    return dbToDomain<EntradaInventario[]>(data || []);
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<EntradaInventario[]> {
    const { data, error } = await this.supabase
      .from('entradas_inventario')
      .select('*')
      .gte('fecha', fechaInicio.toISOString())
      .lte('fecha', fechaFin.toISOString())
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding entradas by fecha: ${error.message}`);
    }

    return dbToDomain<EntradaInventario[]>(data || []);
  }
}

