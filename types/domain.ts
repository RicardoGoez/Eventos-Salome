// Entidades del dominio - Cafetería

export enum CategoriaProducto {
  COMIDA_RAPIDA = "COMIDA_RAPIDA",
  BEBIDA = "BEBIDA",
  SNACK = "SNACK",
  ACOMPANAMIENTO = "ACOMPANAMIENTO",
  PLATO_FUERTE = "PLATO_FUERTE",
}

export enum EstadoPedido {
  PENDIENTE = "PENDIENTE",
  EN_PREPARACION = "EN_PREPARACION",
  LISTO = "LISTO",
  ENTREGADO = "ENTREGADO",
  CANCELADO = "CANCELADO",
}

export enum TipoMovimientoInventario {
  ENTRADA = "ENTRADA",
  SALIDA = "SALIDA",
  AJUSTE = "AJUSTE",
}

export enum RolUsuario {
  ADMIN = "ADMIN",
  COCINA = "COCINA",
  MESERO = "MESERO",
  CLIENTE = "CLIENTE",
}

export enum MetodoPago {
  EFECTIVO = "EFECTIVO",
  TARJETA = "TARJETA",
  TRANSFERENCIA = "TRANSFERENCIA",
}

export enum TipoDescuento {
  PORCENTAJE = "PORCENTAJE",
  VALOR_FIJO = "VALOR_FIJO",
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaProducto;
  precio: number;
  costo: number;
  disponible: boolean;
  imagen?: string;
  tieneVariantes?: boolean;
  variantes?: VarianteProducto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VarianteProducto {
  id: string;
  productoId: string;
  producto?: Producto;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo: number;
  disponible: boolean;
  imagen?: string;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventarioItem {
  id: string;
  productoId: string;
  producto?: Producto;
  cantidad: number;
  cantidadMinima: number;
  unidad: string; // "kg", "litros", "unidades", etc.
  ubicacion?: string;
  fechaVencimiento?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovimientoInventario {
  id: string;
  inventarioItemId: string;
  inventarioItem?: InventarioItem;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo?: string;
  fecha: Date;
  usuarioId?: string;
  createdAt: Date;
}

export interface ItemPedido {
  id: string;
  pedidoId: string;
  productoId: string;
  producto?: Producto;
  varianteId?: string;
  variante?: VarianteProducto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password: string; // En producción, debe estar hasheado
  rol: RolUsuario;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proveedor {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntradaInventario {
  id: string;
  inventarioItemId: string;
  inventarioItem?: InventarioItem;
  proveedorId: string;
  proveedor?: Proveedor;
  cantidad: number;
  precioCompra: number;
  fecha: Date;
  numeroFactura?: string;
  notas?: string;
  usuarioId: string;
  createdAt: Date;
}

export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  disponible: boolean;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Descuento {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoDescuento;
  valor: number; // Porcentaje o valor fijo según el tipo
  activo: boolean;
  fechaInicio?: Date;
  fechaFin?: Date;
  cantidadMinima?: number; // Para descuentos por cantidad
  aplicadoAPedidos: number; // Contador de veces aplicado
  createdAt: Date;
  updatedAt: Date;
}

export interface ActividadAuditoria {
  id: string;
  usuarioId: string;
  usuario?: Usuario;
  accion: string; // "CREAR_PRODUCTO", "ELIMINAR_PEDIDO", etc.
  entidad: string; // "PRODUCTO", "PEDIDO", etc.
  entidadId: string;
  detalles?: string;
  fecha: Date;
  ip?: string;
}

export interface CierreCaja {
  id: string;
  fecha: Date;
  fechaInicio: Date;
  fechaFin: Date;
  totalVentas: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  numeroPedidos: number;
  numeroPedidosCancelados: number;
  diferenciaEfectivo?: number; // Diferencia entre lo esperado y lo real
  notas?: string;
  usuarioId: string;
  usuario?: Usuario;
  cerrado: boolean;
  createdAt: Date;
}

export interface Pedido {
  id: string;
  numero: string;
  items: ItemPedido[];
  estado: EstadoPedido;
  subtotal: number;
  descuento?: number;
  iva: number;
  total: number;
  metodoPago?: MetodoPago;
  clienteId?: string;
  cliente?: Usuario;
  clienteNombre?: string; // Para clientes no registrados
  mesaId?: string;
  mesa?: Mesa;
  descuentoId?: string;
  descuentoAplicado?: Descuento;
  ticketQR?: string; // Código QR del ticket
  notas?: string;
  fecha: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para nuevas funcionalidades avanzadas

export interface AlertaInventario {
  id: string;
  inventarioItemId: string;
  inventarioItem?: InventarioItem;
  tipo: "STOCK_BAJO" | "PROXIMO_VENCIMIENTO" | "SIN_STOCK";
  severidad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  mensaje: string;
  leida: boolean;
  fecha: Date;
  createdAt: Date;
}

export interface ClasificacionABC {
  productoId: string;
  producto?: Producto;
  categoria: "A" | "B" | "C";
  valorRotacion: number;
  porcentajeAcumulado: number;
  cantidadVendida: number;
  ingresos: number;
}

export interface PronosticoDemanda {
  productoId: string;
  producto?: Producto;
  periodo: Date;
  demandaPronosticada: number;
  nivelConfianza: number; // 0-1
  metodo: "SUAVIZADO_EXPONENCIAL" | "PROMEDIO_MOVIL" | "REGRESION";
  createdAt: Date;
}

export interface PuntoReorden {
  inventarioItemId: string;
  inventarioItem?: InventarioItem;
  puntoReorden: number; // s
  cantidadReorden: number; // Q
  nivelServicio: number; // 0-1 (ej: 0.95 = 95%)
  tiempoEntrega: number; // días
  demandaPromedio: number;
  desviacionEstandar: number;
  actualizado: Date;
}

export interface KPI {
  id: string;
  nombre: string;
  valor: number;
  unidad: string;
  tendencia: "up" | "down" | "stable";
  comparativo: number; // % vs período anterior
  meta?: number;
  periodo: Date;
}

export interface AlertaNegocio {
  id: string;
  tipo: "VENTAS_BAJAS" | "TIEMPO_EXCESIVO" | "DIFERENCIA_CAJA" | "ERROR_ALTO" | "SATISFACCION_BAJA";
  severidad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  mensaje: string;
  valorActual: number;
  valorEsperado: number;
  desviacion: number; // %
  leida: boolean;
  fecha: Date;
  createdAt: Date;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: "PUSH" | "EMAIL" | "SMS" | "IN_APP";
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: Date;
  createdAt: Date;
}
