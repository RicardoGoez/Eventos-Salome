import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { Proveedor } from '@/types/domain';

export class ProveedorRepositorySupabase extends BaseRepositorySupabase<Proveedor> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'proveedores');
  }

  async findActivos(): Promise<Proveedor[]> {
    const { data, error } = await this.supabase
      .from('proveedores')
      .select('*')
      .eq('activo', true);

    if (error) {
      throw new Error(`Error finding proveedores activos: ${error.message}`);
    }

    return dbToDomain<Proveedor[]>(data || []);
  }

  async search(query: string): Promise<Proveedor[]> {
    const { data, error } = await this.supabase
      .from('proveedores')
      .select('*')
      .or(`nombre.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`);

    if (error) {
      throw new Error(`Error searching proveedores: ${error.message}`);
    }

    return dbToDomain<Proveedor[]>(data || []);
  }
}

