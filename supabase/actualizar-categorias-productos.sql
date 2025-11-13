-- ============================================
-- SCRIPT PARA ACTUALIZAR CATEGORÍAS DE PRODUCTOS
-- ============================================
-- Este script actualiza las categorías de productos en la base de datos
-- y crea los nuevos productos según la lista proporcionada.
--
-- ⚠️ ADVERTENCIA: Esta operación modificará productos existentes
--
-- Ejecutar en Supabase SQL Editor
-- ============================================

BEGIN;

-- Paso 1: Actualizar el CHECK constraint de la tabla productos
-- Primero eliminamos el constraint antiguo
ALTER TABLE productos 
DROP CONSTRAINT IF EXISTS productos_categoria_check;

-- Agregamos el nuevo constraint con las nuevas categorías
ALTER TABLE productos 
ADD CONSTRAINT productos_categoria_check 
CHECK (categoria IN ('COMIDA_RAPIDA', 'BEBIDA', 'SNACK', 'ACOMPANAMIENTO', 'PLATO_FUERTE'));

-- Paso 2: Actualizar productos existentes a las nuevas categorías
-- Mapeo de categorías antiguas a nuevas (si aplica)
UPDATE productos 
SET categoria = 'COMIDA_RAPIDA' 
WHERE categoria = 'COMIDA';

-- Los productos POSTRE se pueden eliminar o cambiar según necesidad
-- Por ahora los eliminamos si existen
DELETE FROM productos WHERE categoria = 'POSTRE';

-- Paso 3: Eliminar todos los productos existentes para empezar limpio
-- (Opcional - descomentar si quieres empezar desde cero)
-- DELETE FROM productos;

-- Paso 4: Insertar los nuevos productos según la lista proporcionada

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
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen)
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE productos.nombre = v.nombre);

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
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen)
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE productos.nombre = v.nombre);

-- SNACKS (1 producto)
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen) 
SELECT * FROM (VALUES
('Mekatos', 'Mekatos, paquete individual', 'SNACK', 2500, 1000, true, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1200&auto=format&fit=crop')
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen)
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE productos.nombre = v.nombre);

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
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen)
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE productos.nombre = v.nombre);

-- PLATOS FUERTES (5 productos)
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen) 
SELECT * FROM (VALUES
('Sopas', 'Sopa del día, porción individual', 'PLATO_FUERTE', 4000, 1800, true, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1200&auto=format&fit=crop'),
('Desvare', 'Desvare completo, plato fuerte', 'PLATO_FUERTE', 6000, 2800, true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop'),
('Corrientes', 'Plato corriente completo, plato fuerte', 'PLATO_FUERTE', 10000, 4500, true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop'),
('Porción de Arroz', 'Porción de arroz, acompañamiento', 'PLATO_FUERTE', 2000, 800, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=1200&auto=format&fit=crop'),
('Porción de Proteína', 'Porción de proteína (carne, pollo o pescado)', 'PLATO_FUERTE', 4000, 1800, true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop')
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen)
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE productos.nombre = v.nombre);

-- Verificar que se insertaron todos los productos
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
    
    RAISE NOTICE '✅ Resumen de productos insertados:';
    RAISE NOTICE '   - Total productos: %', total_productos;
    RAISE NOTICE '   - Comidas Rápidas: %', comida_rapida_count;
    RAISE NOTICE '   - Bebidas: %', bebida_count;
    RAISE NOTICE '   - Snacks: %', snack_count;
    RAISE NOTICE '   - Acompañamientos: %', acompanamiento_count;
    RAISE NOTICE '   - Platos Fuertes: %', plato_fuerte_count;
END $$;

COMMIT;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Total de productos esperados: 32
--   - 7 Comidas Rápidas
--   - 7 Bebidas
--   - 1 Snack
--   - 12 Acompañamientos
--   - 5 Platos Fuertes
-- ============================================

