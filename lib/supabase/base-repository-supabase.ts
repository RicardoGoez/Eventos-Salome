import { SupabaseClient } from '@supabase/supabase-js';
import { IRepository } from '../patterns/repository.interface';

// Mapeo de nombres de tablas (snake_case en DB a camelCase en TypeScript)
type TableNameMap = {
  usuarios: 'usuarios';
  productos: 'productos';
  inventario_items: 'inventario_items';
  proveedores: 'proveedores';
  entradas_inventario: 'entradas_inventario';
  movimientos_inventario: 'movimientos_inventario';
  mesas: 'mesas';
  descuentos: 'descuentos';
  pedidos: 'pedidos';
  items_pedido: 'items_pedido';
  cierres_caja: 'cierres_caja';
  actividades_auditoria: 'actividades_auditoria';
};

// Mapeo especial para campos que tienen abreviaciones en camelCase
const SPECIAL_CAMEL_TO_SNAKE: Record<string, string> = {
  ticketQR: 'ticket_qr',
  ticketQr: 'ticket_qr',
  clienteNombre: 'cliente_nombre',
  metodoPago: 'metodo_pago',
  descuentoId: 'descuento_id',
  clienteId: 'cliente_id',
  mesaId: 'mesa_id',
  productoId: 'producto_id',
  inventarioItemId: 'inventario_item_id',
  proveedorId: 'proveedor_id',
  usuarioId: 'usuario_id',
  precioUnitario: 'precio_unitario',
  cantidadMinima: 'cantidad_minima',
  fechaVencimiento: 'fecha_vencimiento',
  fechaInicio: 'fecha_inicio',
  fechaFin: 'fecha_fin',
  precioCompra: 'precio_compra',
  numeroFactura: 'numero_factura',
  aplicadoAPedidos: 'aplicado_a_pedidos',
  totalVentas: 'total_ventas',
  totalEfectivo: 'total_efectivo',
  totalTarjeta: 'total_tarjeta',
  totalTransferencia: 'total_transferencia',
  numeroPedidos: 'numero_pedidos',
  numeroPedidosCancelados: 'numero_pedidos_cancelados',
  diferenciaEfectivo: 'diferencia_efectivo',
  entidadId: 'entidad_id',
};

// Mapeo inverso para convertir snake_case a camelCase
const SPECIAL_SNAKE_TO_CAMEL: Record<string, string> = {
  ticket_qr: 'ticketQR',
  cliente_nombre: 'clienteNombre',
  metodo_pago: 'metodoPago',
  descuento_id: 'descuentoId',
  cliente_id: 'clienteId',
  mesa_id: 'mesaId',
  producto_id: 'productoId',
  inventario_item_id: 'inventarioItemId',
  proveedor_id: 'proveedorId',
  usuario_id: 'usuarioId',
  precio_unitario: 'precioUnitario',
  cantidad_minima: 'cantidadMinima',
  fecha_vencimiento: 'fechaVencimiento',
  fecha_inicio: 'fechaInicio',
  fecha_fin: 'fechaFin',
  precio_compra: 'precioCompra',
  numero_factura: 'numeroFactura',
  aplicado_a_pedidos: 'aplicadoAPedidos',
  total_ventas: 'totalVentas',
  total_efectivo: 'totalEfectivo',
  total_tarjeta: 'totalTarjeta',
  total_transferencia: 'totalTransferencia',
  numero_pedidos: 'numeroPedidos',
  numero_pedidos_cancelados: 'numeroPedidosCancelados',
  diferencia_efectivo: 'diferenciaEfectivo',
  entidad_id: 'entidadId',
};

// Función para convertir camelCase a snake_case
function toSnakeCase(str: string): string {
  // Verificar si hay un mapeo especial primero
  if (SPECIAL_CAMEL_TO_SNAKE[str]) {
    return SPECIAL_CAMEL_TO_SNAKE[str];
  }
  
  // Conversión estándar: agregar _ antes de cada mayúscula excepto la primera
  return str.replace(/[A-Z]/g, (letter, index) => index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`)
            .replace(/^_/, ''); // Eliminar _ inicial si existe
}

// Función para convertir snake_case a camelCase
function toCamelCase(str: string): string {
  // Verificar si hay un mapeo especial primero
  if (SPECIAL_SNAKE_TO_CAMEL[str]) {
    return SPECIAL_SNAKE_TO_CAMEL[str];
  }
  
  // Conversión estándar
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Función para convertir objeto de DB (snake_case) a objeto de dominio (camelCase)
export function dbToDomain<T>(dbObj: any): T {
  if (!dbObj) return dbObj;
  
  if (Array.isArray(dbObj)) {
    return dbObj.map(item => dbToDomain<T>(item)) as unknown as T;
  }
  
  if (typeof dbObj !== 'object') return dbObj;
  
  const result: any = {};
  for (const key in dbObj) {
    if (dbObj.hasOwnProperty(key)) {
      // Ignorar relaciones anidadas que vienen de Supabase (se manejan por separado)
      if (key === 'items_pedido' || key === 'producto' || key === 'cliente' || key === 'mesa' || key === 'descuento_aplicado' || key === 'inventario_item' || key === 'proveedor' || key === 'usuario') {
        continue;
      }
      
      const camelKey = toCamelCase(key);
      // Manejar fechas
      if (key.includes('_at') || key === 'fecha' || key === 'fecha_inicio' || key === 'fecha_fin' || key === 'fecha_vencimiento') {
        result[camelKey] = dbObj[key] ? new Date(dbObj[key]) : dbObj[key];
      } else {
        result[camelKey] = dbObj[key];
      }
    }
  }
  return result as T;
}

// Función para convertir objeto de dominio (camelCase) a objeto de DB (snake_case)
export function domainToDb<T>(domainObj: any): any {
  if (!domainObj) return domainObj;
  
  if (Array.isArray(domainObj)) {
    return domainObj.map(item => domainToDb(item));
  }
  
  if (typeof domainObj !== 'object') return domainObj;
  
  const result: any = {};
  for (const key in domainObj) {
    if (domainObj.hasOwnProperty(key) && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
      const snakeKey = toSnakeCase(key);
      // Convertir fechas a ISO string
      if (domainObj[key] instanceof Date) {
        result[snakeKey] = domainObj[key].toISOString();
      } else {
        result[snakeKey] = domainObj[key];
      }
    }
  }
  return result;
}

// Clase base para repositorios que usan Supabase
export abstract class BaseRepositorySupabase<T extends { id: string }> implements IRepository<T> {
  protected supabase: SupabaseClient;
  protected tableName: string;

  constructor(supabase: SupabaseClient, tableName: keyof TableNameMap) {
    this.supabase = supabase;
    this.tableName = tableName as string;
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') return null; // Not found or table doesn't exist
      console.error(`Error finding ${this.tableName} by id:`, error);
      throw new Error(`Error finding ${this.tableName}: ${error.message}`);
    }

    return data ? dbToDomain<T>(data) : null;
  }

  async findAll(): Promise<T[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*');

      if (error) {
        console.error(`Error finding all ${this.tableName}:`, error);
        throw new Error(`Error finding all ${this.tableName}: ${error.message}`);
      }

      return dbToDomain<T[]>(data || []);
    } catch (error) {
      console.error(`Exception in findAll for ${this.tableName}:`, error);
      throw error;
    }
  }

  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const dbEntity = domainToDb(entity);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(dbEntity)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating ${this.tableName}: ${error.message}`);
    }

    return dbToDomain<T>(data);
  }

  async update(id: string, entity: Partial<T>): Promise<T> {
    const dbEntity = domainToDb(entity);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(dbEntity)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating ${this.tableName}: ${error.message}`);
    }

    if (!data) {
      throw new Error(`${this.tableName} with id ${id} not found`);
    }

    return dbToDomain<T>(data);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting ${this.tableName}: ${error.message}`);
    }

    return true;
  }

  protected generateId(): string {
    // Supabase usa UUIDs automáticamente, pero mantenemos esta función por compatibilidad
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

