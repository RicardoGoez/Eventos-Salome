-- ============================================
-- SCRIPT PARA ELIMINAR PRODUCTOS INGREDIENTE
-- ============================================
-- Este script elimina todos los productos con categoría 'INGREDIENTE'
-- y todos los registros relacionados en cascada.
--
-- ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE
-- Se eliminarán:
--   - Productos con categoría 'INGREDIENTE'
--   - Items de inventario relacionados (CASCADE)
--   - Entradas de inventario relacionadas (CASCADE)
--   - Movimientos de inventario relacionados (CASCADE)
--   - Items de pedidos que contengan estos productos (se eliminan primero)
--
-- Ejecutar en Supabase SQL Editor
-- ============================================

BEGIN;

-- Mostrar información antes de eliminar
DO $$
DECLARE
    productos_count INTEGER;
    inventario_count INTEGER;
    pedidos_count INTEGER;
BEGIN
    -- Contar productos INGREDIENTE
    SELECT COUNT(*) INTO productos_count
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
    
    RAISE NOTICE '📊 Resumen antes de eliminar:';
    RAISE NOTICE '   - Productos INGREDIENTE: %', productos_count;
    RAISE NOTICE '   - Items de inventario: %', inventario_count;
    RAISE NOTICE '   - Items en pedidos: %', pedidos_count;
END $$;

-- Paso 1: Eliminar items de pedidos que contengan productos INGREDIENTE
-- (Necesario porque items_pedido tiene ON DELETE RESTRICT con productos)
DELETE FROM items_pedido
WHERE producto_id IN (
    SELECT id FROM productos WHERE categoria = 'INGREDIENTE'
);

-- Mostrar cuántos items de pedidos se eliminaron
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Eliminados % items de pedidos', deleted_count;
END $$;

-- Paso 2: Eliminar productos INGREDIENTE
-- Esto eliminará automáticamente (CASCADE):
--   - inventario_items relacionados
--   - entradas_inventario relacionadas (a través de inventario_items)
--   - movimientos_inventario relacionados (a través de inventario_items)
DELETE FROM productos
WHERE categoria = 'INGREDIENTE';

-- Mostrar cuántos productos se eliminaron
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Eliminados % productos INGREDIENTE', deleted_count;
END $$;

-- Verificar que no queden productos INGREDIENTE
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM productos
    WHERE categoria = 'INGREDIENTE';
    
    IF remaining_count = 0 THEN
        RAISE NOTICE '✅ Verificación: No quedan productos INGREDIENTE en la base de datos';
    ELSE
        RAISE WARNING '⚠️ Advertencia: Aún quedan % productos INGREDIENTE', remaining_count;
    END IF;
END $$;

COMMIT;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Si necesitas revertir los cambios, deberás:
-- 1. Restaurar desde un backup
-- 2. O volver a ejecutar el seed.sql (solo creará productos, no restaurará pedidos eliminados)
-- ============================================

