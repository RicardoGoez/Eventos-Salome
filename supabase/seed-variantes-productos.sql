-- ============================================
-- SCRIPT DE VARIANTES (OPCIONES) DE PRODUCTOS
-- ============================================
-- Este script inserta variantes (opciones) para productos que tienen
-- múltiples opciones como tamaños, sabores, tipos, etc.
--
-- Ejecutar en Supabase SQL Editor después de ejecutar seed.sql
-- ============================================

BEGIN;

-- ============================================
-- GASEOSA - Variantes por tamaño
-- ============================================
INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    '1 Litro',
    'Gaseosa de 1 litro',
    3000,
    1200,
    true,
    'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=1200&auto=format&fit=crop',
    1
FROM productos p
WHERE p.nombre = 'Gaseosa'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    '2 Litros',
    'Gaseosa de 2 litros',
    5000,
    2000,
    true,
    'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=1200&auto=format&fit=crop',
    2
FROM productos p
WHERE p.nombre = 'Gaseosa'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    '3 Litros',
    'Gaseosa de 3 litros',
    7000,
    2800,
    true,
    'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=1200&auto=format&fit=crop',
    3
FROM productos p
WHERE p.nombre = 'Gaseosa'
LIMIT 1;

-- ============================================
-- JUGOS NATURALES - Variantes por sabor
-- ============================================
INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Mora',
    'Jugo natural de mora recién exprimido',
    2500,
    1000,
    true,
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1200&auto=format&fit=crop',
    1
FROM productos p
WHERE p.nombre = 'Jugos Naturales'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Naranja',
    'Jugo natural de naranja recién exprimido',
    2500,
    1000,
    true,
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1200&auto=format&fit=crop',
    2
FROM productos p
WHERE p.nombre = 'Jugos Naturales'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Fresa',
    'Jugo natural de fresa recién exprimido',
    2500,
    1000,
    true,
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1200&auto=format&fit=crop',
    3
FROM productos p
WHERE p.nombre = 'Jugos Naturales'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Maracuyá',
    'Jugo natural de maracuyá recién exprimido',
    2500,
    1000,
    true,
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1200&auto=format&fit=crop',
    4
FROM productos p
WHERE p.nombre = 'Jugos Naturales'
LIMIT 1;

-- ============================================
-- SOPAS - Variantes por tipo
-- ============================================
INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'Sopa de Gallina',
    'Sopa de gallina con verduras, deliciosa y nutritiva',
    4000,
    1800,
    true,
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1200&auto=format&fit=crop',
    1
FROM productos p
WHERE p.nombre = 'Sopas'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'Sopa de Frijol',
    'Sopa de frijol tradicional con verduras',
    4000,
    1800,
    true,
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1200&auto=format&fit=crop',
    2
FROM productos p
WHERE p.nombre = 'Sopas'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'Sopa de Lentejas',
    'Sopa de lentejas con verduras y carne',
    4000,
    1800,
    true,
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1200&auto=format&fit=crop',
    3
FROM productos p
WHERE p.nombre = 'Sopas'
LIMIT 1;

-- ============================================
-- PASTELITOS DE POLLO - Variantes por tipo
-- ============================================
INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Pollo',
    'Pastelito de pollo frito, porción individual',
    3000,
    1200,
    true,
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=1200&auto=format&fit=crop',
    1
FROM productos p
WHERE p.nombre = 'Pastelitos de Pollo'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Carne',
    'Pastelito de carne frito, porción individual',
    3000,
    1200,
    true,
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=1200&auto=format&fit=crop',
    2
FROM productos p
WHERE p.nombre = 'Pastelitos de Pollo'
LIMIT 1;

-- ============================================
-- CARIMAÑOLAS - Variantes por tipo
-- ============================================
INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Carne',
    'Carimañola de yuca rellena de carne',
    2000,
    800,
    true,
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1200&auto=format&fit=crop',
    1
FROM productos p
WHERE p.nombre = 'Carimañolas'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Pollo',
    'Carimañola de yuca rellena de pollo',
    2000,
    800,
    true,
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1200&auto=format&fit=crop',
    2
FROM productos p
WHERE p.nombre = 'Carimañolas'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Queso',
    'Carimañola de yuca rellena de queso',
    2000,
    800,
    true,
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1200&auto=format&fit=crop',
    3
FROM productos p
WHERE p.nombre = 'Carimañolas'
LIMIT 1;

-- ============================================
-- KIBBES - Variantes por tipo
-- ============================================
INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Carne',
    'Kibbe de carne, porción individual',
    4500,
    2000,
    true,
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=1200&auto=format&fit=crop',
    1
FROM productos p
WHERE p.nombre = 'Kibbes'
LIMIT 1;

INSERT INTO variantes_producto (producto_id, nombre, descripcion, precio, costo, disponible, imagen, orden)
SELECT 
    p.id,
    'De Pollo',
    'Kibbe de pollo, porción individual',
    4500,
    2000,
    true,
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=1200&auto=format&fit=crop',
    2
FROM productos p
WHERE p.nombre = 'Kibbes'
LIMIT 1;

-- ============================================
-- ACTUALIZAR PRODUCTOS PARA MARCAR QUE TIENEN VARIANTES
-- ============================================
UPDATE productos 
SET tiene_variantes = true 
WHERE nombre IN (
    'Gaseosa',
    'Jugos Naturales',
    'Sopas',
    'Pastelitos de Pollo',
    'Carimañolas',
    'Kibbes'
);

-- Verificar que se insertaron las variantes
DO $$
DECLARE
    total_variantes INTEGER;
    productos_con_variantes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_variantes FROM variantes_producto;
    SELECT COUNT(*) INTO productos_con_variantes FROM productos WHERE tiene_variantes = true;
    
    RAISE NOTICE '✅ Resumen de variantes insertadas:';
    RAISE NOTICE '   - Total variantes: %', total_variantes;
    RAISE NOTICE '   - Productos con variantes: %', productos_con_variantes;
END $$;

COMMIT;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

