import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { Producto, CategoriaProducto } from '@/types/domain';

export class ProductoRepositorySupabase extends BaseRepositorySupabase<Producto> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'productos');
  }

  async findByCategoria(categoria: CategoriaProducto): Promise<Producto[]> {
    const { data, error } = await this.supabase
      .from('productos')
      .select('*')
      .eq('categoria', categoria);

    if (error) {
      throw new Error(`Error finding productos by categoria: ${error.message}`);
    }

    return dbToDomain<Producto[]>(data || []);
  }

  async findByDisponible(disponible: boolean): Promise<Producto[]> {
    const { data, error } = await this.supabase
      .from('productos')
      .select('*')
      .eq('disponible', disponible);

    if (error) {
      throw new Error(`Error finding productos by disponible: ${error.message}`);
    }

    return dbToDomain<Producto[]>(data || []);
  }

  async search(query: string): Promise<Producto[]> {
    const { data, error } = await this.supabase
      .from('productos')
      .select('*')
      .or(`nombre.ilike.%${query}%,descripcion.ilike.%${query}%`);

    if (error) {
      throw new Error(`Error searching productos: ${error.message}`);
    }

    return dbToDomain<Producto[]>(data || []);
  }
}

