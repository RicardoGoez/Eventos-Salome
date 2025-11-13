-- ============================================
-- TABLA DE VARIANTES DE PRODUCTOS
-- ============================================
-- Esta tabla permite que un producto tenga múltiples variantes
-- Ejemplo: Gaseosa puede tener variantes de 1L, 2L, 3L o diferentes marcas
-- Ejemplo: Empanada puede tener variantes de carne, pollo, queso
-- Ejemplo: Jugos naturales pueden tener variantes de mora, naranja, etc.
-- ============================================

CREATE TABLE IF NOT EXISTS variantes_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    costo DECIMAL(10, 2) NOT NULL CHECK (costo >= 0),
    disponible BOOLEAN DEFAULT true,
    imagen TEXT,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(producto_id, nombre)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_variantes_producto_id ON variantes_producto(producto_id);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_disponible ON variantes_producto(disponible);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_variantes_producto_updated_at 
BEFORE UPDATE ON variantes_producto
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Agregar columna para indicar si un producto tiene variantes
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS tiene_variantes BOOLEAN DEFAULT false;

-- Índice para productos con variantes
CREATE INDEX IF NOT EXISTS idx_productos_tiene_variantes ON productos(tiene_variantes);

-- Comentarios
COMMENT ON TABLE variantes_producto IS 'Variantes de productos (ej: Gaseosa 1L, 2L, 3L; Empanada de carne, pollo; Jugo de mora, naranja)';
COMMENT ON COLUMN variantes_producto.producto_id IS 'ID del producto padre';
COMMENT ON COLUMN variantes_producto.nombre IS 'Nombre de la variante (ej: "1 Litro", "De Carne", "De Mora")';
COMMENT ON COLUMN variantes_producto.orden IS 'Orden de visualización de la variante';

