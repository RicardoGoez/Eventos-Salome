-- ============================================
-- MIGRACIÓN COMPLETA DE PRODUCTOS Y CATEGORÍAS
-- ============================================
-- Este script realiza todas las operaciones necesarias:
--   1. Elimina productos INGREDIENTE y sus dependencias
--   2. Actualiza el CHECK constraint de categorías
--   3. Migra productos existentes a nuevas categorías
--   4. Elimina productos POSTRE
--   5. Inserta todos los nuevos productos (32 productos)
--
-- ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE
-- Se eliminarán:
--   - Productos con categoría 'INGREDIENTE' y 'POSTRE'
--   - Items de pedidos que contengan estos productos
--   - Items de inventario relacionados (CASCADE)
--   - Entradas de inventario relacionadas (CASCADE)
--   - Movimientos de inventario relacionados (CASCADE)
--
-- Ejecutar en Supabase SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- PASO 1: ELIMINAR PRODUCTOS INGREDIENTE
-- ============================================
DO $$
DECLARE
    productos_ingrediente_count INTEGER;
    inventario_count INTEGER;
    pedidos_count INTEGER;
BEGIN
    -- Contar productos INGREDIENTE
    SELECT COUNT(*) INTO productos_ingrediente_count
    FROM productos
    WHERE categoria = 'INGREDIENTE';
    
    -- Contar items de inventario relacionados
    SELECT COUNT(*) INTO inventario_count
    FROM inventario_items ii
    INNER JOIN productos p ON ii.producto_id = p.id
    WHERE p.categoria = 'INGREDIENTE';
    
    -- Contar items de pedidos relacionados
    SELECT COUNT(*) INTO pedidos_count
    FROM items_pedido ip
    INNER JOIN productos p ON ip.producto_id = p.id
    WHERE p.categoria = 'INGREDIENTE';
    
    IF productos_ingrediente_count > 0 THEN
        RAISE NOTICE '📊 Eliminando productos INGREDIENTE:';
        RAISE NOTICE '   - Productos INGREDIENTE: %', productos_ingrediente_count;
        RAISE NOTICE '   - Items de inventario: %', inventario_count;
        RAISE NOTICE '   - Items en pedidos: %', pedidos_count;
        
        -- Eliminar items de pedidos que contengan productos INGREDIENTE
        DELETE FROM items_pedido
        WHERE producto_id IN (
            SELECT id FROM productos WHERE categoria = 'INGREDIENTE'
        );
        
        -- Eliminar productos INGREDIENTE (esto eliminará en cascada inventario_items, entradas_inventario, movimientos_inventario)
        DELETE FROM productos
        WHERE categoria = 'INGREDIENTE';
        
        RAISE NOTICE '✅ Productos INGREDIENTE eliminados';
    ELSE
        RAISE NOTICE 'ℹ️ No hay productos INGREDIENTE para eliminar';
    END IF;
END $$;

-- ============================================
-- PASO 2: ACTUALIZAR CHECK CONSTRAINT
-- ============================================
-- Eliminar el constraint antiguo
ALTER TABLE productos 
DROP CONSTRAINT IF EXISTS productos_categoria_check;

-- Agregar el nuevo constraint con las nuevas categorías
ALTER TABLE productos 
ADD CONSTRAINT productos_categoria_check 
CHECK (categoria IN ('COMIDA_RAPIDA', 'BEBIDA', 'SNACK', 'ACOMPANAMIENTO', 'PLATO_FUERTE'));

DO $$
BEGIN
    RAISE NOTICE '✅ CHECK constraint actualizado';
END $$;

-- ============================================
-- PASO 3: MIGRAR PRODUCTOS EXISTENTES
-- ============================================
-- Convertir productos COMIDA a COMIDA_RAPIDA
UPDATE productos 
SET categoria = 'COMIDA_RAPIDA' 
WHERE categoria = 'COMIDA';

DO $$
DECLARE
    migrados_count INTEGER;
BEGIN
    GET DIAGNOSTICS migrados_count = ROW_COUNT;
    IF migrados_count > 0 THEN
        RAISE NOTICE '✅ Migrados % productos de COMIDA a COMIDA_RAPIDA', migrados_count;
    END IF;
END $$;

-- Eliminar productos POSTRE
DELETE FROM productos WHERE categoria = 'POSTRE';

DO $$
DECLARE
    eliminados_count INTEGER;
BEGIN
    GET DIAGNOSTICS eliminados_count = ROW_COUNT;
    IF eliminados_count > 0 THEN
        RAISE NOTICE '✅ Eliminados % productos POSTRE', eliminados_count;
    END IF;
END $$;

-- ============================================
-- PASO 4: ELIMINAR TODOS LOS PRODUCTOS EXISTENTES
-- (Para empezar limpio con los nuevos productos)
-- ============================================
-- Primero eliminar items de pedidos de productos existentes
DELETE FROM items_pedido
WHERE producto_id IN (
    SELECT id FROM productos
);

-- Luego eliminar todos los productos (esto eliminará en cascada inventario_items, etc.)
DELETE FROM productos;

DO $$
BEGIN
    RAISE NOTICE '✅ Productos existentes eliminados para empezar limpio';
END $$;

-- ============================================
-- PASO 5: INSERTAR NUEVOS PRODUCTOS
-- ============================================

-- COMIDAS RÁPIDAS (7 productos)
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen) 
SELECT * FROM (VALUES
('Panzerotti', 'Panzerotti relleno, delicioso y crujiente', 'COMIDA_RAPIDA', 3500, 1500, true, 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?q=80&w=1200&auto=format&fit=crop'),
('Pastelitos de Pollo', 'Pastelitos de pollo fritos, porción individual', 'COMIDA_RAPIDA', 3000, 1200, true, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=1200&auto=format&fit=crop'),
('Carimañolas', 'Carimañolas de yuca rellenas, porción individual', 'COMIDA_RAPIDA', 2000, 800, true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1200&auto=format&fit=crop'),
('Buñuelos', 'Buñuelos de maíz, porción de 3 unidades', 'COMIDA_RAPIDA', 2000, 800, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop'),
('Kibbes', 'Kibbes de carne, porción individual', 'COMIDA_RAPIDA', 4500, 2000, true, 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=1200&auto=format&fit=crop'),
('Sándwich Jamón con Queso', 'Sándwich de jamón y queso, pan fresco', 'COMIDA_RAPIDA', 3000, 1200, true, 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?q=80&w=1200&auto=format&fit=crop'),
('Cubanitos', 'Cubanitos de jamón y queso, porción individual', 'COMIDA_RAPIDA', 5000, 2200, true, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop')
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen);

-- BEBIDAS (7 productos)
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen) 
SELECT * FROM (VALUES
('Capuchinos', 'Capuchino caliente con espuma de leche', 'BEBIDA', 4000, 1500, true, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=1200&auto=format&fit=crop'),
('Café con Leche', 'Café con leche caliente, taza mediana', 'BEBIDA', 2000, 800, true, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=1200&auto=format&fit=crop'),
('Café', 'Café colombiano tradicional, taza mediana', 'BEBIDA', 1500, 600, true, 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200&auto=format&fit=crop'),
('Jugos Hit', 'Jugos Hit envasados, variedad de sabores', 'BEBIDA', 3000, 1200, true, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1200&auto=format&fit=crop'),
('Jugos Naturales', 'Jugos naturales recién exprimidos, vaso 350ml', 'BEBIDA', 2500, 1000, true, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1200&auto=format&fit=crop'),
('Gaseosa', 'Gaseosa en lata o botella, variedad de sabores', 'BEBIDA', 3000, 1200, true, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=1200&auto=format&fit=crop'),
('Agua', 'Agua embotellada, 500ml', 'BEBIDA', 2500, 1000, true, 'https://images.unsplash.com/photo-1548839140-5a941b7567a4?q=80&w=1200&auto=format&fit=crop')
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen);

-- SNACKS (1 producto)
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen) 
SELECT * FROM (VALUES
('Mekatos', 'Mekatos, paquete individual', 'SNACK', 2500, 1000, true, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1200&auto=format&fit=crop')
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen);

-- ACOMPAÑAMIENTOS (12 productos)
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen) 
SELECT * FROM (VALUES
('Yuca', 'Yuca cocida, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop'),
('Queso', 'Queso fresco, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=1200&auto=format&fit=crop'),
('Arepa', 'Arepa de maíz, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1200&auto=format&fit=crop'),
('Chorizo', 'Chorizo frito, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=1200&auto=format&fit=crop'),
('Auyama', 'Auyama cocida, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop'),
('Berenjena', 'Berenjena cocida, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop'),
('Patacón', 'Patacón frito, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop'),
('Habichuelas', 'Habichuelas guisadas, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop'),
('Papa Cocida', 'Papa cocida, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop'),
('Cabeza de Gato', 'Cabeza de gato, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop'),
('Plátano Amarillo', 'Plátano amarillo cocido, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop'),
('Huevos (revueltos o cocidos)', 'Huevos revueltos o cocidos, porción individual', 'ACOMPANAMIENTO', 2500, 1000, true, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?q=80&w=1200&auto=format&fit=crop')
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen);

-- PLATOS FUERTES (5 productos)
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen) 
SELECT * FROM (VALUES
('Sopas', 'Sopa del día, porción individual', 'PLATO_FUERTE', 4000, 1800, true, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1200&auto=format&fit=crop'),
('Desvare', 'Desvare completo, plato fuerte', 'PLATO_FUERTE', 6000, 2800, true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop'),
('Corrientes', 'Plato corriente completo, plato fuerte', 'PLATO_FUERTE', 10000, 4500, true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop'),
('Porción de Arroz', 'Porción de arroz, acompañamiento', 'PLATO_FUERTE', 2000, 800, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=1200&auto=format&fit=crop'),
('Porción de Proteína', 'Porción de proteína (carne, pollo o pescado)', 'PLATO_FUERTE', 4000, 1800, true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop')
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen);

-- ============================================
-- PASO 6: VERIFICACIÓN FINAL
-- ============================================
DO $$
DECLARE
    total_productos INTEGER;
    comida_rapida_count INTEGER;
    bebida_count INTEGER;
    snack_count INTEGER;
    acompanamiento_count INTEGER;
    plato_fuerte_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_productos FROM productos;
    SELECT COUNT(*) INTO comida_rapida_count FROM productos WHERE categoria = 'COMIDA_RAPIDA';
    SELECT COUNT(*) INTO bebida_count FROM productos WHERE categoria = 'BEBIDA';
    SELECT COUNT(*) INTO snack_count FROM productos WHERE categoria = 'SNACK';
    SELECT COUNT(*) INTO acompanamiento_count FROM productos WHERE categoria = 'ACOMPANAMIENTO';
    SELECT COUNT(*) INTO plato_fuerte_count FROM productos WHERE categoria = 'PLATO_FUERTE';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Resumen de productos:';
    RAISE NOTICE '   - Total productos: %', total_productos;
    RAISE NOTICE '   - Comidas Rápidas: %', comida_rapida_count;
    RAISE NOTICE '   - Bebidas: %', bebida_count;
    RAISE NOTICE '   - Snacks: %', snack_count;
    RAISE NOTICE '   - Acompañamientos: %', acompanamiento_count;
    RAISE NOTICE '   - Platos Fuertes: %', plato_fuerte_count;
    RAISE NOTICE '========================================';
    
    IF total_productos = 32 THEN
        RAISE NOTICE '✅ Todos los productos fueron insertados correctamente';
    ELSE
        RAISE WARNING '⚠️ Advertencia: Se esperaban 32 productos, pero se encontraron %', total_productos;
    END IF;
END $$;

COMMIT;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Este script ha realizado:
-- ✅ Eliminación de productos INGREDIENTE y POSTRE
-- ✅ Actualización del CHECK constraint de categorías
-- ✅ Migración de productos COMIDA a COMIDA_RAPIDA
-- ✅ Inserción de 32 productos nuevos:
--    - 7 Comidas Rápidas
--    - 7 Bebidas
--    - 1 Snack
--    - 12 Acompañamientos
--    - 5 Platos Fuertes
-- ============================================

