import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { Usuario, RolUsuario } from '@/types/domain';

export class UsuarioRepositorySupabase extends BaseRepositorySupabase<Usuario> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'usuarios');
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error finding usuario by email: ${error.message}`);
    }

    return data ? dbToDomain<Usuario>(data) : null;
  }

  async findByRol(rol: RolUsuario): Promise<Usuario[]> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('rol', rol)
      .eq('activo', true);

    if (error) {
      throw new Error(`Error finding usuarios by rol: ${error.message}`);
    }

    return dbToDomain<Usuario[]>(data || []);
  }

  async findActivos(): Promise<Usuario[]> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('activo', true);

    if (error) {
      throw new Error(`Error finding usuarios activos: ${error.message}`);
    }

    return dbToDomain<Usuario[]>(data || []);
  }
}

