import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepositorySupabase, dbToDomain, domainToDb } from '../base-repository-supabase';
import { Pedido, EstadoPedido, ItemPedido, Producto } from '@/types/domain';

export class PedidoRepositorySupabase extends BaseRepositorySupabase<Pedido> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'pedidos');
  }

  async create(entity: Omit<Pedido, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pedido> {
    // Extraer items antes de crear el pedido
    const items = entity.items || [];
    const pedidoSinItems = { ...entity };
    delete (pedidoSinItems as any).items;

    // Generar número de pedido si no existe
    if (!pedidoSinItems.numero) {
      pedidoSinItems.numero = await this.generateNumero();
    }

    const dbEntity = domainToDb(pedidoSinItems);
    
    // Crear el pedido
    const { data: pedidoData, error: pedidoError } = await this.supabase
      .from('pedidos')
      .insert(dbEntity)
      .select()
      .single();

    if (pedidoError) {
      throw new Error(`Error creating pedido: ${pedidoError.message}`);
    }

    const pedido = dbToDomain<Pedido>(pedidoData);

    // Crear los items del pedido
    if (items.length > 0) {
      const itemsDb = items.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.productoId,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        subtotal: item.subtotal,
        notas: item.notas || null
      }));

      const { error: itemsError } = await this.supabase
        .from('items_pedido')
        .insert(itemsDb);

      if (itemsError) {
        // Si falla la inserción de items, eliminar el pedido creado
        await this.supabase.from('pedidos').delete().eq('id', pedido.id);
        throw new Error(`Error creating items_pedido: ${itemsError.message}`);
      }

      // Recargar el pedido con los items
      return this.findById(pedido.id) as Promise<Pedido>;
    }

    return { ...pedido, items: [] };
  }

  async findByEstado(estado: EstadoPedido): Promise<Pedido[]> {
    const { data, error } = await this.supabase
      .from('pedidos')
      .select(`
        *,
        items_pedido (
          id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          notas,
          productos (
            id,
            nombre,
            descripcion,
            categoria,
            precio,
            imagen
          )
        )
      `)
      .eq('estado', estado)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding pedidos by estado: ${error.message}`);
    }

    return this.mapPedidosWithItems(data || []);
  }

  async findByFecha(fechaInicio: Date, fechaFin: Date): Promise<Pedido[]> {
    const { data, error } = await this.supabase
      .from('pedidos')
      .select(`
        *,
        items_pedido (
          id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          notas,
          productos (
            id,
            nombre,
            descripcion,
            categoria,
            precio,
            imagen
          )
        )
      `)
      .gte('fecha', fechaInicio.toISOString())
      .lte('fecha', fechaFin.toISOString())
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding pedidos by fecha: ${error.message}`);
    }

    return this.mapPedidosWithItems(data || []);
  }

  async findByCliente(clienteId: string): Promise<Pedido[]> {
    const { data, error } = await this.supabase
      .from('pedidos')
      .select(`
        *,
        items_pedido (
          id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          notas,
          productos (
            id,
            nombre,
            descripcion,
            categoria,
            precio,
            imagen
          )
        )
      `)
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding pedidos by cliente: ${error.message}`);
    }

    return this.mapPedidosWithItems(data || []);
  }

  async findByMesa(mesaId: string): Promise<Pedido[]> {
    const { data, error } = await this.supabase
      .from('pedidos')
      .select(`
        *,
        items_pedido (
          id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          notas,
          productos (
            id,
            nombre,
            descripcion,
            categoria,
            precio,
            imagen
          )
        )
      `)
      .eq('mesa_id', mesaId)
      .order('fecha', { ascending: false });

    if (error) {
      throw new Error(`Error finding pedidos by mesa: ${error.message}`);
    }

    return this.mapPedidosWithItems(data || []);
  }

  async generateNumero(): Promise<string> {
    // Intentar usar la función SQL
    try {
      const { data, error } = await this.supabase.rpc('generate_pedido_numero');
      
      if (!error && data) {
        return data;
      }
    } catch (e) {
      // Si falla, usar fallback
    }

    // Fallback: generar número manualmente
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const { data: ultimoPedido } = await this.supabase
      .from('pedidos')
      .select('numero')
      .like('numero', `PED-${fecha}-%`)
      .order('numero', { ascending: false })
      .limit(1)
      .single();

    let counter = 1;
    if (ultimoPedido?.numero) {
      const match = ultimoPedido.numero.match(/-(\d+)$/);
      if (match) {
        counter = parseInt(match[1]) + 1;
      }
    }

    return `PED-${fecha}-${String(counter).padStart(4, '0')}`;
  }

  async findAll(): Promise<Pedido[]> {
    const { data, error } = await this.supabase
      .from('pedidos')
      .select(`
        *,
        items_pedido (
          id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          notas,
          productos (
            id,
            nombre,
            descripcion,
            categoria,
            precio,
            imagen
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding all pedidos: ${error.message}`);
    }

    return this.mapPedidosWithItems(data || []);
  }

  async findById(id: string): Promise<Pedido | null> {
    const { data, error } = await this.supabase
      .from('pedidos')
      .select(`
        *,
        items_pedido (
          id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          notas,
          productos (
            id,
            nombre,
            descripcion,
            categoria,
            precio,
            imagen
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error finding pedido: ${error.message}`);
    }

    if (!data) return null;

    const pedidos = this.mapPedidosWithItems([data]);
    return pedidos[0] || null;
  }

  private mapPedidosWithItems(data: any[]): Pedido[] {
    return data.map((dbPedido: any) => {
      const pedido = dbToDomain<Pedido>(dbPedido);
      const items = (dbPedido.items_pedido || []).map((item: any) => {
        // Mapear producto si existe
        let producto = undefined;
        if (item.productos) {
          producto = dbToDomain<Producto>(item.productos);
        }
        
        return {
          id: item.id,
          pedidoId: pedido.id,
          productoId: item.producto_id,
          producto,
          cantidad: item.cantidad,
          precioUnitario: item.precio_unitario,
          subtotal: item.subtotal,
          notas: item.notas || undefined
        };
      });
      
      return {
        ...pedido,
        items
      };
    });
  }
}
