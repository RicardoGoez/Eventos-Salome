-- ============================================
-- REGISTROS DE PRUEBA Y DATOS INICIALES
-- EVENTOS SALOME - Sistema de Gestión
-- ============================================
-- Ejecutar DESPUÉS de schema.sql
-- Este archivo contiene todos los registros de prueba necesarios

-- ============================================
-- EXTENSIÓN PARA HASHING (bcrypt)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- USUARIOS DE PRUEBA
-- ============================================
-- Contraseñas visibles para desarrollo:
-- - admin@salome.com / admin123
-- - mesero@salome.com / mesero123
-- - cocina@salome.com / cocina123
-- - cliente@salome.com / cliente123

-- ADMIN
INSERT INTO usuarios (nombre, email, password, rol, activo)
SELECT 'Admin Eventos', 'admin@salome.com', crypt('admin123', gen_salt('bf')), 'ADMIN', true
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'admin@salome.com'
);

-- MESERO
INSERT INTO usuarios (nombre, email, password, rol, activo)
SELECT 'Mesero Principal', 'mesero@salome.com', crypt('mesero123', gen_salt('bf')), 'MESERO', true
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'mesero@salome.com'
);

-- COCINA
INSERT INTO usuarios (nombre, email, password, rol, activo)
SELECT 'Cocinero Jefe', 'cocina@salome.com', crypt('cocina123', gen_salt('bf')), 'COCINA', true
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'cocina@salome.com'
);

-- CLIENTE
INSERT INTO usuarios (nombre, email, password, rol, activo)
SELECT 'Cliente Demo', 'cliente@salome.com', crypt('cliente123', gen_salt('bf')), 'CLIENTE', true
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'cliente@salome.com'
);

-- ============================================
-- PRODUCTOS BÁSICOS - CAFETERÍA UNIVERSITARIA
-- 4 productos por categoría (BEBIDA, COMIDA, POSTRE, SNACK)
-- Precios en Pesos Colombianos (COP)
-- ============================================
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen) 
SELECT * FROM (VALUES
-- BEBIDAS (4 productos)
('Café Tinto', 'Café colombiano tradicional, taza mediana', 'BEBIDA', 2500, 800, true, 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200&auto=format&fit=crop'),
('Café con Leche', 'Café con leche caliente, taza mediana', 'BEBIDA', 3500, 1200, true, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=1200&auto=format&fit=crop'),
('Jugo de Naranja Natural', 'Jugo de naranja recién exprimido, vaso 350ml', 'BEBIDA', 4000, 1500, true, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1200&auto=format&fit=crop'),
('Avena Caliente', 'Avena con leche, canela y panela, taza mediana', 'BEBIDA', 3000, 1000, true, 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?q=80&w=1200&auto=format&fit=crop'),

-- COMIDAS (4 productos)
('Sandwich de Pollo', 'Sandwich con pollo desmechado, lechuga, tomate y mayonesa', 'COMIDA', 8500, 3500, true, 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?q=80&w=1200&auto=format&fit=crop'),
('Perro Caliente', 'Perro caliente con salchicha, papas, salsas y queso', 'COMIDA', 6000, 2500, true, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop'),
('Empanada de Carne', 'Empanada frita rellena de carne molida, papa y arroz', 'COMIDA', 2500, 1000, true, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=1200&auto=format&fit=crop'),
('Arepa con Queso', 'Arepa de maíz con queso derretido', 'COMIDA', 3000, 1200, true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1200&auto=format&fit=crop'),

-- POSTRES (4 productos)
('Tres Leches', 'Torta tres leches casera, porción individual', 'POSTRE', 5000, 2000, true, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop'),
('Flan de Caramelo', 'Flan casero con caramelo, porción individual', 'POSTRE', 4000, 1500, true, 'https://images.unsplash.com/photo-1606312619070-d48b4e8c6e7e?q=80&w=1200&auto=format&fit=crop'),
('Helado de Vainilla', 'Helado de vainilla, 1 bola', 'POSTRE', 3500, 1200, true, 'https://images.unsplash.com/photo-1563805042-7684c019e1b5?q=80&w=1200&auto=format&fit=crop'),
('Brownie con Helado', 'Brownie casero con helado de vainilla', 'POSTRE', 6000, 2500, true, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476b?q=80&w=1200&auto=format&fit=crop'),

-- SNACKS (4 productos)
('Papas Fritas', 'Papas fritas caseras, porción mediana', 'SNACK', 4000, 1500, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop'),
('Chocorramo', 'Chocorramo individual, marca reconocida', 'SNACK', 2500, 1000, true, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop'),
('Galletas de Avena', 'Galletas de avena caseras, paquete de 3 unidades', 'SNACK', 3000, 1200, true, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1200&auto=format&fit=crop'),
('Chicharrón', 'Chicharrón de cerdo frito, porción pequeña', 'SNACK', 5000, 2000, true, 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=1200&auto=format&fit=crop')
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen)
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE productos.nombre = v.nombre);

-- ============================================
-- INGREDIENTES VENDIBLES (4 productos)
-- Precios en Pesos Colombianos (COP)
-- ============================================
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen)
SELECT nombre, descripcion, categoria, precio, costo, disponible, imagen
FROM (VALUES
  ('Café en Grano 500g', 'Café colombiano en grano, tueste medio. Bolsa de 500g. Ideal para preparar en casa.', 'INGREDIENTE', 25000, 15000, true, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop'),
  ('Azúcar Blanca 1kg', 'Azúcar blanca refinada. Bolsa de 1kg.', 'INGREDIENTE', 3500, 2000, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  ('Panela en Panela 500g', 'Panela artesanal colombiana. Bloque de 500g.', 'INGREDIENTE', 4000, 2500, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  ('Leche en Polvo 1kg', 'Leche en polvo entera. Bolsa de 1kg.', 'INGREDIENTE', 18000, 12000, true, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1200&auto=format&fit=crop')
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen)
WHERE NOT EXISTS (
  SELECT 1 FROM productos p WHERE p.nombre = v.nombre
);

-- ============================================
-- INVENTARIO (10 registros)
-- ============================================
INSERT INTO inventario_items (producto_id, cantidad, cantidad_minima, unidad, ubicacion, fecha_vencimiento)
SELECT 
    p.id,
    (50 + (random() * 100)::int)::numeric(10,2) as cantidad,
    20::numeric(10,2) as cantidad_minima,
    'unidad' as unidad,
    'Estante ' || (ARRAY['A', 'B', 'C', 'D', 'E'])[1 + (MOD((row_number() OVER())::int, 5))] as ubicacion,
    NULL as fecha_vencimiento
FROM productos p
WHERE p.id NOT IN (SELECT producto_id FROM inventario_items WHERE producto_id IS NOT NULL)
LIMIT 10;

-- ============================================
-- PROVEEDORES (10 registros)
-- Proveedores reales para cafetería universitaria en Colombia
-- ============================================
INSERT INTO proveedores (nombre, telefono, email, direccion, activo) VALUES
('Café de Colombia S.A.', '604-1234567', 'ventas@cafecolombia.com', 'Carrera 50 #45-123, Medellín', true),
('Distribuidora Montería', '604-2345678', 'contacto@distmonteria.com', 'Calle 30 #25-45, Montería', true),
('Panadería El Buen Pan', '604-3456789', 'pedidos@buenpan.com', 'Av. Primera #10-20, Montería', true),
('Carnes y Pollos del Norte', '604-4567890', 'ventas@carnesnorte.com', 'Carrera 3 #15-30, Montería', true),
('Lácteos La Finca', '604-5678901', 'info@lacteosfinca.com', 'Vía Ciénaga de Oro Km 5', true),
('Frutas y Verduras Frescas', '604-6789012', 'pedidos@frutasfrescas.com', 'Mercado Central Local 12', true),
('Bebidas y Refrescos S.A.', '604-7890123', 'ventas@bebidas.com', 'Zona Industrial, Bodega 5', true),
('Snacks y Golosinas', '604-8901234', 'contacto@snacks.com', 'Calle 20 #12-34, Montería', true),
('Ingredientes y Especias', '604-9012345', 'pedidos@ingredientes.com', 'Carrera 5 #8-15, Montería', true),
('Proveedor Express Montería', '604-0123456', 'express@proveedor.com', 'Av. Circunvalar #45-67', true)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- MESAS (10 registros)
-- ============================================
INSERT INTO mesas (numero, capacidad, disponible, notas) VALUES
(1, 2, true, 'Mesa cerca de la ventana'),
(2, 4, true, NULL),
(3, 4, false, 'Reservada'),
(4, 6, true, 'Mesa para grupos'),
(5, 2, true, NULL),
(6, 4, true, NULL),
(7, 8, true, 'Mesa grande para eventos'),
(8, 4, false, 'Ocupada'),
(9, 2, true, NULL),
(10, 6, true, 'Mesa en terraza')
ON CONFLICT (numero) DO NOTHING;

-- ============================================
-- DESCUENTOS (10 registros)
-- Precios en Pesos Colombianos (COP)
-- ============================================
INSERT INTO descuentos (nombre, descripcion, tipo, valor, activo, fecha_inicio, fecha_fin, cantidad_minima, aplicado_a_pedidos) VALUES
('Descuento Estudiante 10%', 'Descuento del 10% para estudiantes universitarios', 'PORCENTAJE', 10.0, true, NOW(), NULL, NULL, 0),
('Descuento por Volumen', 'Descuento de $2.000 en pedidos mayores a $20.000', 'VALOR_FIJO', 2000.0, true, NOW(), NULL, 20000, 0),
('Descuento Postres 15%', 'Descuento del 15% en todos los postres', 'PORCENTAJE', 15.0, true, NOW(), NULL, NULL, 0),
('Descuento Happy Hour', 'Descuento de $1.500 en pedidos mayores a $15.000', 'VALOR_FIJO', 1500.0, true, NOW(), NULL, 15000, 0),
('Descuento Fin de Semana 20%', 'Descuento del 20% los fines de semana', 'PORCENTAJE', 20.0, true, NOW(), NOW() + INTERVAL '30 days', NULL, 0),
('Descuento Docente 5%', 'Descuento del 5% para docentes universitarios', 'PORCENTAJE', 5.0, true, NOW(), NULL, NULL, 0),
('Descuento Bebidas 8%', 'Descuento del 8% en todas las bebidas', 'PORCENTAJE', 8.0, true, NOW(), NULL, NULL, 0),
('Descuento Combo', 'Descuento de $3.000 en pedidos mayores a $25.000', 'VALOR_FIJO', 3000.0, true, NOW(), NULL, 25000, 0),
('Descuento Comidas 12%', 'Descuento del 12% en todas las comidas', 'PORCENTAJE', 12.0, true, NOW(), NULL, NULL, 0),
('Descuento Promoción', 'Descuento de $1.000 en cualquier pedido', 'VALOR_FIJO', 1000.0, false, NOW(), NOW() - INTERVAL '1 day', NULL, 0)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- PEDIDOS (10 registros)
-- Precios en Pesos Colombianos (COP)
-- ============================================
INSERT INTO pedidos (numero, estado, subtotal, descuento, iva, total, metodo_pago, cliente_id, cliente_nombre, mesa_id, descuento_id, ticket_qr, notas, fecha)
WITH pedidos_data AS (
    SELECT 
        'PED-' || LPAD(ROW_NUMBER() OVER()::text, 6, '0') as numero,
        (ARRAY['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'])[1 + (random() * 3)::int] as estado,
        (8000 + (random() * 25000))::numeric(10,2) as subtotal,
        (random() < 0.3) as tiene_descuento,
        (ARRAY['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'])[1 + (random() * 2)::int] as metodo_pago,
        (SELECT id FROM usuarios WHERE rol = 'CLIENTE' LIMIT 1) as cliente_id,
        'Estudiante UCC' as cliente_nombre,
        (SELECT id FROM mesas ORDER BY random() LIMIT 1) as mesa_id,
        CASE WHEN random() < 0.3 THEN (SELECT id FROM descuentos WHERE activo = true LIMIT 1) ELSE NULL END as descuento_id,
        NULL as ticket_qr,
        CASE WHEN random() < 0.2 THEN 'Sin azúcar' ELSE NULL END as notas,
        NOW() - (random() * INTERVAL '30 days') as fecha
    FROM generate_series(1, 10)
)
SELECT 
    numero,
    estado,
    subtotal,
    CASE WHEN tiene_descuento THEN (subtotal * 0.1)::numeric(10,2) ELSE 0::numeric(10,2) END as descuento,
    ((subtotal - CASE WHEN tiene_descuento THEN (subtotal * 0.1) ELSE 0 END) * 0.16)::numeric(10,2) as iva,
    (subtotal - CASE WHEN tiene_descuento THEN (subtotal * 0.1) ELSE 0 END + ((subtotal - CASE WHEN tiene_descuento THEN (subtotal * 0.1) ELSE 0 END) * 0.16))::numeric(10,2) as total,
    metodo_pago,
    cliente_id,
    cliente_nombre,
    mesa_id,
    descuento_id,
    ticket_qr,
    notas,
    fecha
FROM pedidos_data
ON CONFLICT (numero) DO NOTHING;

-- ============================================
-- ITEMS DE PEDIDO (10 registros)
-- ============================================
INSERT INTO items_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas)
SELECT 
    p.id as pedido_id,
    pr.id as producto_id,
    (1 + (random() * 2)::int) as cantidad,
    pr.precio as precio_unitario,
    (pr.precio * (1 + (random() * 2)::int))::numeric(10,2) as subtotal,
    CASE WHEN random() < 0.1 THEN 'Especial' ELSE NULL END as notas
FROM pedidos p
CROSS JOIN LATERAL (
    SELECT id, precio FROM productos ORDER BY random() LIMIT 1
) pr
WHERE p.id NOT IN (SELECT pedido_id FROM items_pedido)
LIMIT 10;

-- ============================================
-- MOVIMIENTOS DE INVENTARIO (10 registros)
-- ============================================
INSERT INTO movimientos_inventario (inventario_item_id, tipo, cantidad, motivo, fecha, usuario_id)
SELECT 
    ii.id as inventario_item_id,
    (ARRAY['ENTRADA', 'SALIDA', 'AJUSTE'])[1 + (random() * 2)::int] as tipo,
    (10 + (random() * 50)::int)::numeric(10,2) as cantidad,
    CASE 
        WHEN random() < 0.33 THEN 'Compra a proveedor'
        WHEN random() < 0.66 THEN 'Venta'
        ELSE 'Ajuste de inventario'
    END as motivo,
    NOW() - (random() * INTERVAL '15 days') as fecha,
    (SELECT id FROM usuarios WHERE rol = 'ADMIN' LIMIT 1) as usuario_id
FROM inventario_items ii
ORDER BY random()
LIMIT 10;

-- ============================================
-- ENTRADAS DE INVENTARIO (10 registros)
-- ============================================
INSERT INTO entradas_inventario (inventario_item_id, proveedor_id, cantidad, precio_compra, fecha, numero_factura, notas, usuario_id)
SELECT 
    ii.id as inventario_item_id,
    pr.id as proveedor_id,
    (20 + (random() * 80)::int)::numeric(10,2) as cantidad,
    (ii.cantidad * (0.3 + random() * 0.2))::numeric(10,2) as precio_compra,
    NOW() - (random() * INTERVAL '20 days') as fecha,
    'FAC-' || LPAD((random() * 10000)::int::text, 6, '0') as numero_factura,
    CASE WHEN random() < 0.3 THEN 'Lote especial' ELSE NULL END as notas,
    (SELECT id FROM usuarios WHERE rol = 'ADMIN' LIMIT 1) as usuario_id
FROM inventario_items ii
CROSS JOIN LATERAL (
    SELECT id FROM proveedores ORDER BY random() LIMIT 1
) pr
ORDER BY random()
LIMIT 10;

-- ============================================
-- CIERRES DE CAJA (10 registros)
-- Precios en Pesos Colombianos (COP)
-- ============================================
INSERT INTO cierres_caja (fecha_inicio, fecha_fin, total_ventas, total_efectivo, total_tarjeta, total_transferencia, numero_pedidos, numero_pedidos_cancelados, diferencia_efectivo, notas, usuario_id, cerrado)
SELECT 
    (NOW() - (n * INTERVAL '1 day'))::date + TIME '07:00:00' as fecha_inicio,
    (NOW() - (n * INTERVAL '1 day'))::date + TIME '20:00:00' as fecha_fin,
    (150000 + (random() * 500000))::numeric(10,2) as total_ventas,
    (80000 + (random() * 200000))::numeric(10,2) as total_efectivo,
    (50000 + (random() * 200000))::numeric(10,2) as total_tarjeta,
    (20000 + (random() * 100000))::numeric(10,2) as total_transferencia,
    (25 + (random() * 75)::int) as numero_pedidos,
    (0 + (random() * 3)::int) as numero_pedidos_cancelados,
    (random() * 5000 - 2500)::numeric(10,2) as diferencia_efectivo,
    'Cierre del día ' || (NOW() - (n * INTERVAL '1 day'))::date as notas,
    (SELECT id FROM usuarios WHERE rol = 'ADMIN' LIMIT 1) as usuario_id,
    true as cerrado
FROM generate_series(0, 9) n
WHERE NOT EXISTS (
    SELECT 1 FROM cierres_caja 
    WHERE fecha_inicio = (NOW() - (n * INTERVAL '1 day'))::date + TIME '07:00:00'
);

-- ============================================
-- ACTIVIDADES DE AUDITORÍA (10 registros)
-- ============================================
INSERT INTO actividades_auditoria (usuario_id, accion, entidad, entidad_id, detalles, fecha, ip)
SELECT 
    u.id as usuario_id,
    (ARRAY['CREAR', 'ACTUALIZAR', 'ELIMINAR', 'VER'])[1 + (random() * 3)::int] as accion,
    (ARRAY['PRODUCTO', 'PEDIDO', 'INVENTARIO', 'USUARIO'])[1 + (random() * 3)::int] as entidad,
    (SELECT id FROM productos ORDER BY random() LIMIT 1) as entidad_id,
    'Acción de prueba ' || n as detalles,
    NOW() - (random() * INTERVAL '48 hours') as fecha,
    '192.168.1.' || (100 + (random() * 155)::int) as ip
FROM usuarios u
CROSS JOIN generate_series(1, 10) n
WHERE u.rol = 'ADMIN'
LIMIT 10;

-- ============================================
-- FIN DE REGISTROS DE PRUEBA
-- ============================================
-- Este archivo contiene:
-- ✅ 4 usuarios de prueba (ADMIN, MESERO, COCINA, CLIENTE)
-- ✅ 20 productos totales:
--    - 4 BEBIDAS (Café Tinto, Café con Leche, Jugo de Naranja, Avena)
--    - 4 COMIDAS (Sandwich de Pollo, Perro Caliente, Empanada, Arepa con Queso)
--    - 4 POSTRES (Tres Leches, Flan, Helado, Brownie con Helado)
--    - 4 SNACKS (Papas Fritas, Chocorramo, Galletas de Avena, Chicharrón)
--    - 4 INGREDIENTES (Café en Grano, Azúcar, Panela, Leche en Polvo)
-- ✅ 10 registros de inventario
-- ✅ 10 proveedores (proveedores reales de Montería, Colombia)
-- ✅ 10 mesas
-- ✅ 10 descuentos (con valores en COP)
-- ✅ 10 pedidos con items (valores en COP)
-- ✅ 10 movimientos de inventario
-- ✅ 10 entradas de inventario
-- ✅ 10 cierres de caja (valores en COP)
-- ✅ 10 actividades de auditoría
-- 
-- TODOS LOS PRECIOS ESTÁN EN PESOS COLOMBIANOS (COP)
-- Productos realistas para cafetería universitaria
-- 
-- Ejecutar DESPUÉS de schema.sql
-- Luego ejecutar: rls-policies.sql

