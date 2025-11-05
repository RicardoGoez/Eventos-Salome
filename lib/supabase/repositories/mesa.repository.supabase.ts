import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain } from '../base-repository-supabase';
import { Mesa } from '@/types/domain';

export class MesaRepositorySupabase extends BaseRepositorySupabase<Mesa> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'mesas');
  }

  async findByNumero(numero: number): Promise<Mesa | null> {
    const { data, error } = await this.supabase
      .from('mesas')
      .select('*')
      .eq('numero', numero)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error finding mesa by numero: ${error.message}`);
    }

    return data ? dbToDomain<Mesa>(data) : null;
  }

  async findDisponibles(): Promise<Mesa[]> {
    const { data, error } = await this.supabase
      .from('mesas')
      .select('*')
      .eq('disponible', true);

    if (error) {
      throw new Error(`Error finding mesas disponibles: ${error.message}`);
    }

    return dbToDomain<Mesa[]>(data || []);
  }

  async findOcupadas(): Promise<Mesa[]> {
    const { data, error } = await this.supabase
      .from('mesas')
      .select('*')
      .eq('disponible', false);

    if (error) {
      throw new Error(`Error finding mesas ocupadas: ${error.message}`);
    }

    return dbToDomain<Mesa[]>(data || []);
  }
}

