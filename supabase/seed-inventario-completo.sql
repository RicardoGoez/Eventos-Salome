-- ============================================
-- REGISTROS DE INVENTARIO Y ENTRADAS
-- EVENTOS SALOME - Sistema de Gestión
-- ============================================
-- Este script crea registros completos de inventario
-- y entradas de inventario para todos los productos
-- Ejecutar DESPUÉS de seed.sql
-- ============================================

-- ============================================
-- INVENTARIO ITEMS - Para TODOS los productos
-- ============================================
-- Crear registros de inventario para productos que no tienen inventario
INSERT INTO inventario_items (producto_id, cantidad, cantidad_minima, unidad, ubicacion, fecha_vencimiento)
SELECT 
    p.id,
    -- Cantidad inicial basada en el tipo de producto
    CASE 
        WHEN p.categoria = 'BEBIDA' THEN (100 + (random() * 200)::int)::numeric(10,2)
        WHEN p.categoria = 'SNACK' THEN (50 + (random() * 100)::int)::numeric(10,2)
        WHEN p.categoria = 'COMIDA_RAPIDA' THEN (30 + (random() * 70)::int)::numeric(10,2)
        WHEN p.categoria = 'ACOMPANAMIENTO' THEN (40 + (random() * 80)::int)::numeric(10,2)
        WHEN p.categoria = 'PLATO_FUERTE' THEN (20 + (random() * 50)::int)::numeric(10,2)
        ELSE (30 + (random() * 70)::int)::numeric(10,2)
    END as cantidad,
    -- Cantidad mínima (20% de la cantidad inicial)
    CASE 
        WHEN p.categoria = 'BEBIDA' THEN 20::numeric(10,2)
        WHEN p.categoria = 'SNACK' THEN 10::numeric(10,2)
        WHEN p.categoria = 'COMIDA_RAPIDA' THEN 10::numeric(10,2)
        WHEN p.categoria = 'ACOMPANAMIENTO' THEN 8::numeric(10,2)
        WHEN p.categoria = 'PLATO_FUERTE' THEN 5::numeric(10,2)
        ELSE 10::numeric(10,2)
    END as cantidad_minima,
    -- Unidad según el tipo de producto
    CASE 
        WHEN p.categoria = 'BEBIDA' THEN 'unidades'
        WHEN p.categoria = 'SNACK' THEN 'unidades'
        WHEN p.categoria = 'COMIDA_RAPIDA' THEN 'unidades'
        WHEN p.categoria = 'ACOMPANAMIENTO' THEN 'porciones'
        WHEN p.categoria = 'PLATO_FUERTE' THEN 'porciones'
        ELSE 'unidades'
    END as unidad,
    -- Ubicación aleatoria en estantes
    'Estante ' || (ARRAY['A', 'B', 'C', 'D', 'E', 'F'])[1 + (MOD((row_number() OVER())::int, 6))] || 
    ' - Nivel ' || (1 + (MOD((row_number() OVER())::int, 3)))::text as ubicacion,
    -- Fecha de vencimiento solo para productos perecederos (30-60 días)
    CASE 
        WHEN p.categoria IN ('COMIDA_RAPIDA', 'ACOMPANAMIENTO', 'PLATO_FUERTE') 
        THEN NOW() + (30 + (random() * 30)::int)::integer * INTERVAL '1 day'
        ELSE NULL
    END as fecha_vencimiento
FROM productos p
WHERE p.id NOT IN (
    SELECT producto_id 
    FROM inventario_items 
    WHERE producto_id IS NOT NULL
)
ORDER BY p.categoria, p.nombre;

-- ============================================
-- ENTRADAS DE INVENTARIO
-- ============================================
-- Crear entradas de inventario para los items creados
-- Cada item tendrá entre 2 y 5 entradas históricas
INSERT INTO entradas_inventario (
    inventario_item_id, 
    proveedor_id, 
    cantidad, 
    precio_compra, 
    fecha, 
    numero_factura, 
    notas, 
    usuario_id
)
SELECT 
    ii.id as inventario_item_id,
    -- Proveedor aleatorio
    (SELECT id FROM proveedores WHERE activo = true ORDER BY random() LIMIT 1) as proveedor_id,
    -- Cantidad de entrada (entre 10 y 50 unidades)
    (10 + (random() * 40)::int)::numeric(10,2) as cantidad,
    -- Precio de compra basado en el costo del producto (70-90% del costo)
    (p.costo * (0.7 + random() * 0.2))::numeric(10,2) as precio_compra,
    -- Fecha aleatoria en los últimos 60 días
    NOW() - (random() * 60)::integer * INTERVAL '1 day' as fecha,
    -- Número de factura
    'FAC-' || TO_CHAR(NOW() - (random() * 60)::integer * INTERVAL '1 day', 'YYYYMMDD') || 
    '-' || LPAD((random() * 9999)::int::text, 4, '0') as numero_factura,
    -- Notas ocasionales
    CASE 
        WHEN random() < 0.2 THEN 'Lote especial'
        WHEN random() < 0.3 THEN 'Compra mayorista'
        WHEN random() < 0.4 THEN 'Promoción proveedor'
        ELSE NULL
    END as notas,
    -- Usuario ADMIN
    (SELECT id FROM usuarios WHERE rol = 'ADMIN' LIMIT 1) as usuario_id
FROM inventario_items ii
INNER JOIN productos p ON ii.producto_id = p.id
CROSS JOIN generate_series(1, (2 + (random() * 3)::int)) as entrada_num
ORDER BY ii.id, entrada_num;

-- ============================================
-- ACTUALIZAR CANTIDADES DE INVENTARIO
-- basadas en las entradas realizadas
-- ============================================
-- Sumar todas las entradas para cada item de inventario
UPDATE inventario_items ii
SET cantidad = (
    SELECT COALESCE(SUM(ei.cantidad), ii.cantidad)
    FROM entradas_inventario ei
    WHERE ei.inventario_item_id = ii.id
)
WHERE EXISTS (
    SELECT 1 
    FROM entradas_inventario ei 
    WHERE ei.inventario_item_id = ii.id
);

-- ============================================
-- MOVIMIENTOS DE INVENTARIO
-- Crear movimientos de ENTRADA para cada entrada de inventario
-- ============================================
INSERT INTO movimientos_inventario (
    inventario_item_id,
    tipo,
    cantidad,
    motivo,
    fecha,
    usuario_id
)
SELECT 
    ei.inventario_item_id,
    'ENTRADA' as tipo,
    ei.cantidad,
    'Entrada de inventario - Factura: ' || COALESCE(ei.numero_factura, 'N/A') as motivo,
    ei.fecha,
    ei.usuario_id
FROM entradas_inventario ei
WHERE NOT EXISTS (
    SELECT 1 
    FROM movimientos_inventario mi 
    WHERE mi.inventario_item_id = ei.inventario_item_id 
    AND mi.fecha = ei.fecha
    AND mi.cantidad = ei.cantidad
    AND mi.tipo = 'ENTRADA'
);

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
DECLARE
    total_items INTEGER;
    total_entradas INTEGER;
    total_movimientos INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_items FROM inventario_items;
    SELECT COUNT(*) INTO total_entradas FROM entradas_inventario;
    SELECT COUNT(*) INTO total_movimientos FROM movimientos_inventario WHERE tipo = 'ENTRADA';
    
    RAISE NOTICE '✅ Registros de inventario creados:';
    RAISE NOTICE '   - Items de inventario: %', total_items;
    RAISE NOTICE '   - Entradas de inventario: %', total_entradas;
    RAISE NOTICE '   - Movimientos de entrada: %', total_movimientos;
END $$;

