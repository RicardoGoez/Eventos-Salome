import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { InventarioItem } from '@/types/domain';

export class InventarioRepositorySupabase extends BaseRepositorySupabase<InventarioItem> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'inventario_items');
  }

  async findByProductoId(productoId: string): Promise<InventarioItem | null> {
    const { data, error } = await this.supabase
      .from('inventario_items')
      .select('*')
      .eq('producto_id', productoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error finding inventario item by producto_id: ${error.message}`);
    }

    return data ? dbToDomain<InventarioItem>(data) : null;
  }

  async findBajoStock(): Promise<InventarioItem[]> {
    // Como Supabase no permite comparaciones entre columnas directamente en la query,
    // obtenemos todos los items y filtramos en memoria
    const all = await this.findAll();
    return all.filter((item) => item.cantidad <= item.cantidadMinima);
  }

  async findByUbicacion(ubicacion: string): Promise<InventarioItem[]> {
    const { data, error } = await this.supabase
      .from('inventario_items')
      .select('*')
      .eq('ubicacion', ubicacion);

    if (error) {
      throw new Error(`Error finding inventario items by ubicacion: ${error.message}`);
    }

    return dbToDomain<InventarioItem[]>(data || []);
  }

  async findProximosVencimiento(dias: number = 7): Promise<InventarioItem[]> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);
    const ahora = new Date();

    const { data, error } = await this.supabase
      .from('inventario_items')
      .select('*')
      .not('fecha_vencimiento', 'is', null)
      .gte('fecha_vencimiento', ahora.toISOString())
      .lte('fecha_vencimiento', fechaLimite.toISOString());

    if (error) {
      throw new Error(`Error finding inventario items proximos vencimiento: ${error.message}`);
    }

    return dbToDomain<InventarioItem[]>(data || []);
  }
}

