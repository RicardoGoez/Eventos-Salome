-- ============================================
-- ESQUEMA COMPLETO DE BASE DE DATOS
-- EVENTOS SALOME - Sistema de Gestión
-- ============================================
-- Este archivo contiene TODO lo necesario para crear la base de datos
-- Ejecutar este archivo PRIMERO para crear la estructura completa

-- ============================================
-- EXTENSIONES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLAS
-- ============================================

-- TABLA: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'COCINA', 'MESERO', 'CLIENTE')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('COMIDA_RAPIDA', 'BEBIDA', 'SNACK', 'ACOMPANAMIENTO', 'PLATO_FUERTE')),
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    costo DECIMAL(10, 2) NOT NULL CHECK (costo >= 0),
    disponible BOOLEAN DEFAULT true,
    imagen TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: inventario_items
CREATE TABLE inventario_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad DECIMAL(10, 2) NOT NULL CHECK (cantidad >= 0),
    cantidad_minima DECIMAL(10, 2) NOT NULL CHECK (cantidad_minima >= 0),
    unidad VARCHAR(50) NOT NULL DEFAULT 'unidades',
    ubicacion VARCHAR(255),
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: entradas_inventario
CREATE TABLE entradas_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventario_item_id UUID NOT NULL REFERENCES inventario_items(id) ON DELETE CASCADE,
    proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
    cantidad DECIMAL(10, 2) NOT NULL CHECK (cantidad > 0),
    precio_compra DECIMAL(10, 2) NOT NULL CHECK (precio_compra >= 0),
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    numero_factura VARCHAR(100),
    notas TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: movimientos_inventario
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventario_item_id UUID NOT NULL REFERENCES inventario_items(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad DECIMAL(10, 2) NOT NULL,
    motivo TEXT,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: mesas
CREATE TABLE mesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INTEGER UNIQUE NOT NULL,
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    disponible BOOLEAN DEFAULT true,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: descuentos
CREATE TABLE descuentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PORCENTAJE', 'VALOR_FIJO')),
    valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
    activo BOOLEAN DEFAULT true,
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    cantidad_minima INTEGER,
    aplicado_a_pedidos INTEGER DEFAULT 0 CHECK (aplicado_a_pedidos >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(50) UNIQUE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO')),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    descuento DECIMAL(10, 2) CHECK (descuento >= 0),
    iva DECIMAL(10, 2) NOT NULL CHECK (iva >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA')),
    cliente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    cliente_nombre VARCHAR(255),
    mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
    descuento_id UUID REFERENCES descuentos(id) ON DELETE SET NULL,
    ticket_qr TEXT,
    notas TEXT,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: items_pedido
CREATE TABLE items_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: cierres_caja
CREATE TABLE cierres_caja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    total_ventas DECIMAL(10, 2) NOT NULL CHECK (total_ventas >= 0),
    total_efectivo DECIMAL(10, 2) NOT NULL CHECK (total_efectivo >= 0),
    total_tarjeta DECIMAL(10, 2) NOT NULL CHECK (total_tarjeta >= 0),
    total_transferencia DECIMAL(10, 2) NOT NULL CHECK (total_transferencia >= 0),
    numero_pedidos INTEGER NOT NULL CHECK (numero_pedidos >= 0),
    numero_pedidos_cancelados INTEGER NOT NULL CHECK (numero_pedidos_cancelados >= 0),
    diferencia_efectivo DECIMAL(10, 2),
    notas TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    cerrado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: actividades_auditoria
CREATE TABLE actividades_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id UUID NOT NULL,
    detalles TEXT,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip VARCHAR(45)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_disponible ON productos(disponible);
CREATE INDEX idx_inventario_items_producto_id ON inventario_items(producto_id);
CREATE INDEX idx_inventario_items_bajo_stock ON inventario_items(cantidad, cantidad_minima);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha);
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_mesa_id ON pedidos(mesa_id);
CREATE INDEX idx_items_pedido_pedido_id ON items_pedido(pedido_id);
CREATE INDEX idx_items_pedido_producto_id ON items_pedido(producto_id);
CREATE INDEX idx_entradas_inventario_fecha ON entradas_inventario(fecha);
CREATE INDEX idx_entradas_inventario_proveedor_id ON entradas_inventario(proveedor_id);
CREATE INDEX idx_movimientos_inventario_fecha ON movimientos_inventario(fecha);
CREATE INDEX idx_actividades_auditoria_fecha ON actividades_auditoria(fecha);
CREATE INDEX idx_actividades_auditoria_usuario_id ON actividades_auditoria(usuario_id);
CREATE INDEX idx_actividades_auditoria_entidad ON actividades_auditoria(entidad, entidad_id);
CREATE INDEX idx_cierres_caja_fecha ON cierres_caja(fecha);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventario_items_updated_at BEFORE UPDATE ON inventario_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mesas_updated_at BEFORE UPDATE ON mesas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_descuentos_updated_at BEFORE UPDATE ON descuentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de pedido único
CREATE OR REPLACE FUNCTION generate_pedido_numero()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_numero VARCHAR(50);
    counter INTEGER := 1;
BEGIN
    LOOP
        new_numero := 'PED-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM pedidos WHERE numero = new_numero) THEN
            RETURN new_numero;
        END IF;
        
        counter := counter + 1;
        
        IF counter > 9999 THEN
            RAISE EXCEPTION 'No se pudo generar un número de pedido único';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Habilitar RLS en todas las tablas
-- Las políticas específicas se definen en rls-policies.sql
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE descuentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE cierres_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades_auditoria ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STORAGE (Supabase Storage)
-- ============================================
-- Crear bucket para productos (si no existe)
-- Las políticas de Storage se definen en rls-policies.sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FIN DEL ESQUEMA
-- ============================================
-- Este archivo contiene:
-- ✅ 12 tablas principales
-- ✅ Índices para optimización
-- ✅ Triggers para actualización automática
-- ✅ Funciones auxiliares
-- ✅ Habilitación de RLS (las políticas están en rls-policies.sql)
-- ✅ Bucket de Storage (las políticas están en rls-policies.sql)
-- 
-- ORDEN DE EJECUCIÓN:
-- 1. schema.sql (este archivo)
-- 2. seed.sql (registros de prueba)
-- 3. rls-policies.sql (políticas de seguridad)
