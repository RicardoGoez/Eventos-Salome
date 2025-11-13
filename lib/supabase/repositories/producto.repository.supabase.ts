import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { Producto, CategoriaProducto, VarianteProducto } from '@/types/domain';

export class ProductoRepositorySupabase extends BaseRepositorySupabase<Producto> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'productos');
  }

  async findById(id: string): Promise<Producto | null> {
    const { data, error } = await this.supabase
      .from('productos')
      .select(`
        *,
        variantes:variantes_producto(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error finding producto: ${error.message}`);
    }

    if (!data) return null;

    const producto = dbToDomain<Producto>(data);
    
    // Procesar variantes si existen
    if (data.variantes && Array.isArray(data.variantes)) {
      const variantes = data.variantes.map((v: any) => dbToDomain<VarianteProducto>(v));
      producto.variantes = variantes;
      producto.tieneVariantes = variantes.length > 0;
    } else {
      producto.tieneVariantes = false;
      producto.variantes = [];
    }

    return producto;
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

