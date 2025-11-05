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
-- PRODUCTOS BÁSICOS (10 registros)
-- ============================================
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen) 
SELECT * FROM (VALUES
('Café Espresso', 'Café espresso italiano auténtico', 'BEBIDA', 25.00, 8.00, true, NULL),
('Cappuccino', 'Café con leche espumada y cacao', 'BEBIDA', 35.00, 12.00, true, NULL),
('Latte', 'Café con leche vaporizada', 'BEBIDA', 40.00, 14.00, true, NULL),
('Sandwich de Pollo', 'Sandwich con pollo asado, lechuga y tomate', 'COMIDA', 85.00, 35.00, true, NULL),
('Ensalada César', 'Ensalada con pollo, crutones y aderezo césar', 'COMIDA', 90.00, 38.00, true, NULL),
('Pastel de Chocolate', 'Pastel de chocolate belga', 'POSTRE', 65.00, 25.00, true, NULL),
('Cheesecake', 'Cheesecake de fresa', 'POSTRE', 70.00, 28.00, true, NULL),
('Brownie', 'Brownie con nueces', 'POSTRE', 45.00, 18.00, true, NULL),
('Galletas', 'Galletas caseras variadas', 'SNACK', 35.00, 12.00, true, NULL),
('Muffin', 'Muffin de arándanos', 'SNACK', 40.00, 15.00, true, NULL)
) AS v(nombre, descripcion, categoria, precio, costo, disponible, imagen)
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE productos.nombre = v.nombre);

-- ============================================
-- INGREDIENTES VENDIBLES (30 registros)
-- ============================================
-- Precios en COP (Pesos Colombianos)
INSERT INTO productos (nombre, descripcion, categoria, precio, costo, disponible, imagen)
SELECT nombre, descripcion, categoria, precio, costo, disponible, imagen
FROM (VALUES
  -- Café en grano y molido
  ('Café en grano 250 g', 'Blend arábica de tueste medio. Bolsa 250 g. Ideal para preparar en casa.', 'INGREDIENTE', 18000, 12000, true, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop'),
  ('Café en grano 500 g', 'Blend arábica Premium. Bolsa 500 g. Perfecto para amantes del café.', 'INGREDIENTE', 32000, 23000, true, 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=1200&auto=format&fit=crop'),
  ('Molido para prensa 250 g', 'Café molido grueso ideal para prensa francesa. Origen Colombia.', 'INGREDIENTE', 19000, 13000, true, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop'),
  ('Molido espresso 250 g', 'Café molido fino para máquinas espresso. Tueste medio-oscuro.', 'INGREDIENTE', 20000, 14000, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  
  -- Syrups y saborizantes
  ('Jarabe de vainilla 750 ml', 'Syrup de vainilla grado barista, 750 ml. Ideal para lattes y bebidas frías.', 'INGREDIENTE', 22000, 14000, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  ('Jarabe de caramelo 750 ml', 'Syrup de caramelo para bebidas frías y calientes. 750 ml.', 'INGREDIENTE', 22000, 14000, true, 'https://images.unsplash.com/photo-1513639725746-c5d3e861f32a?q=80&w=1200&auto=format&fit=crop'),
  ('Jarabe de avellana 750 ml', 'Syrup de avellana premium. Perfecto para cappuccinos y frappés.', 'INGREDIENTE', 24000, 16000, true, 'https://images.unsplash.com/photo-1513639725746-c5d3e861f32a?q=80&w=1200&auto=format&fit=crop'),
  ('Jarabe de chocolate 750 ml', 'Syrup de chocolate belga. 750 ml.', 'INGREDIENTE', 25000, 17000, true, 'https://images.unsplash.com/photo-1513639725746-c5d3e861f32a?q=80&w=1200&auto=format&fit=crop'),
  
  -- Chocolate y cacao
  ('Chocolate en polvo 1 kg', 'Mezcla premium para chocolatería y repostería. 1 kg.', 'INGREDIENTE', 42000, 30000, true, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop'),
  ('Cacao 70% 500 g', 'Cacao en polvo 70% sin azúcar. 500 g.', 'INGREDIENTE', 28000, 20000, true, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476b?q=80&w=1200&auto=format&fit=crop'),
  ('Salsa de chocolate 1 kg', 'Salsa para latte art y toppings. 1 kg.', 'INGREDIENTE', 36000, 25000, true, 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop'),
  ('Chocolate negro 85% 200 g', 'Tableta de chocolate negro 85% cacao. 200 g.', 'INGREDIENTE', 32000, 22000, true, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop'),
  
  -- Tés y matcha
  ('Té chai 500 g', 'Concentrado en polvo para chai latte. 500 g.', 'INGREDIENTE', 35000, 24000, true, 'https://images.unsplash.com/photo-1513639725746-c5d3e861f32a?q=80&w=1200&auto=format&fit=crop'),
  ('Matcha culinario 100 g', 'Matcha grado culinario para bebidas y postres. 100 g.', 'INGREDIENTE', 38000, 27000, true, 'https://images.unsplash.com/photo-1513639725746-c5d3e861f32a?q=80&w=1200&auto=format&fit=crop'),
  ('Té verde en hebras 100 g', 'Té verde premium en hebras sueltas. 100 g.', 'INGREDIENTE', 25000, 18000, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  ('Té negro English Breakfast 100 g', 'Té negro clásico para desayuno. 100 g.', 'INGREDIENTE', 22000, 15000, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  
  -- Granola y mermeladas
  ('Granola artesanal 500 g', 'Granola de avena con frutos secos y miel. 500 g.', 'INGREDIENTE', 26000, 18000, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  ('Mermelada de frutos rojos 300 g', 'Mermelada casera sin conservantes. 300 g.', 'INGREDIENTE', 18000, 12000, true, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop'),
  ('Mermelada de fresa 300 g', 'Mermelada de fresa artesanal. 300 g.', 'INGREDIENTE', 18000, 12000, true, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop'),
  ('Mermelada de naranja 300 g', 'Mermelada de naranja con trozos. 300 g.', 'INGREDIENTE', 18000, 12000, true, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop'),
  
  -- Panadería
  ('Pan de masa madre 1 unidad', 'Pan artesanal horneado diariamente. 1 pieza (500 g aprox.).', 'INGREDIENTE', 12000, 8000, true, 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop'),
  ('Croissants x 6 unidades', 'Croissants artesanales. Paquete de 6 unidades.', 'INGREDIENTE', 28000, 19000, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop'),
  ('Bagels integrales x 4 unidades', 'Bagels integrales con semillas. Paquete de 4 unidades.', 'INGREDIENTE', 24000, 16000, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop'),
  
  -- Especias y condimentos
  ('Canela en polvo 100 g', 'Canela en polvo premium. 100 g.', 'INGREDIENTE', 15000, 10000, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  ('Nuez moscada molida 50 g', 'Nuez moscada molida fresca. 50 g.', 'INGREDIENTE', 18000, 12000, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  ('Cardamomo en grano 100 g', 'Cardamomo verde en grano. 100 g.', 'INGREDIENTE', 32000, 22000, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  
  -- Otros
  ('Leche en polvo 1 kg', 'Leche en polvo entera. 1 kg.', 'INGREDIENTE', 28000, 20000, true, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1200&auto=format&fit=crop'),
  ('Azúcar morena 500 g', 'Azúcar morena orgánica. 500 g.', 'INGREDIENTE', 12000, 8000, true, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=1200&auto=format&fit=crop'),
  ('Miel de abejas 500 g', 'Miel pura de abejas artesanal. 500 g.', 'INGREDIENTE', 35000, 24000, true, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop')
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
-- ============================================
INSERT INTO proveedores (nombre, telefono, email, direccion, activo) VALUES
('Café Premium S.A.', '555-0101', 'ventas@cafepremium.com', 'Av. Principal 123', true),
('Distribuidora de Alimentos', '555-0102', 'contacto@distribuidora.com', 'Calle Comercial 456', true),
('Proveedor de Postres', '555-0103', 'info@postres.com', 'Boulevard Dulce 789', true),
('Suministros Gastronómicos', '555-0104', 'ventas@suministros.com', 'Av. Industrial 321', true),
('Importadora de Café', '555-0105', 'import@cafe.com', 'Calle Internacional 654', true),
('Proveedor de Bebidas', '555-0106', 'bebidas@proveedor.com', 'Boulevard Refrescos 987', true),
('Distribuidora de Snacks', '555-0107', 'snacks@dist.com', 'Av. Dulces 147', true),
('Proveedor de Ingredientes', '555-0108', 'ingredientes@proveedor.com', 'Calle Materias 258', true),
('Café Orgánico Ltda.', '555-0109', 'organico@cafe.com', 'Av. Ecológica 369', true),
('Proveedor Express', '555-0110', 'express@proveedor.com', 'Boulevard Rápido 741', true)
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
-- ============================================
INSERT INTO descuentos (nombre, descripcion, tipo, valor, activo, fecha_inicio, fecha_fin, cantidad_minima, aplicado_a_pedidos) VALUES
('Descuento 10%', 'Descuento del 10% en todos los productos', 'PORCENTAJE', 10.0, true, NOW(), NULL, NULL, 0),
('Descuento $50', 'Descuento fijo de $50 en pedidos mayores a $200', 'VALOR_FIJO', 50.0, true, NOW(), NULL, 200, 0),
('Descuento 15%', 'Descuento del 15% en productos de postre', 'PORCENTAJE', 15.0, true, NOW(), NULL, NULL, 0),
('Descuento $30', 'Descuento fijo de $30 en pedidos mayores a $150', 'VALOR_FIJO', 30.0, true, NOW(), NULL, 150, 0),
('Descuento 20%', 'Descuento del 20% en happy hour', 'PORCENTAJE', 20.0, true, NOW(), NOW() + INTERVAL '30 days', NULL, 0),
('Descuento $25', 'Descuento fijo de $25', 'VALOR_FIJO', 25.0, true, NOW(), NULL, NULL, 0),
('Descuento 5%', 'Descuento del 5% en bebidas', 'PORCENTAJE', 5.0, true, NOW(), NULL, NULL, 0),
('Descuento $40', 'Descuento fijo de $40 en pedidos mayores a $180', 'VALOR_FIJO', 40.0, true, NOW(), NULL, 180, 0),
('Descuento 12%', 'Descuento del 12% en comidas', 'PORCENTAJE', 12.0, true, NOW(), NULL, NULL, 0),
('Descuento $20', 'Descuento fijo de $20', 'VALOR_FIJO', 20.0, false, NOW(), NOW() - INTERVAL '1 day', NULL, 0)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- PEDIDOS (10 registros)
-- ============================================
INSERT INTO pedidos (numero, estado, subtotal, descuento, iva, total, metodo_pago, cliente_id, cliente_nombre, mesa_id, descuento_id, ticket_qr, notas, fecha)
WITH pedidos_data AS (
    SELECT 
        'PED-' || LPAD(ROW_NUMBER() OVER()::text, 6, '0') as numero,
        (ARRAY['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'])[1 + (random() * 3)::int] as estado,
        (80 + (random() * 200))::numeric(10,2) as subtotal,
        (random() < 0.3) as tiene_descuento,
        (ARRAY['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'])[1 + (random() * 2)::int] as metodo_pago,
        (SELECT id FROM usuarios WHERE rol = 'CLIENTE' LIMIT 1) as cliente_id,
        'Cliente Prueba' as cliente_nombre,
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
-- ============================================
INSERT INTO cierres_caja (fecha_inicio, fecha_fin, total_ventas, total_efectivo, total_tarjeta, total_transferencia, numero_pedidos, numero_pedidos_cancelados, diferencia_efectivo, notas, usuario_id, cerrado)
SELECT 
    (NOW() - (n * INTERVAL '1 day'))::date + TIME '08:00:00' as fecha_inicio,
    (NOW() - (n * INTERVAL '1 day'))::date + TIME '22:00:00' as fecha_fin,
    (500 + (random() * 2000))::numeric(10,2) as total_ventas,
    (200 + (random() * 800))::numeric(10,2) as total_efectivo,
    (150 + (random() * 600))::numeric(10,2) as total_tarjeta,
    (100 + (random() * 400))::numeric(10,2) as total_transferencia,
    (10 + (random() * 30)::int) as numero_pedidos,
    0 as numero_pedidos_cancelados,
    (random() * 20 - 10)::numeric(10,2) as diferencia_efectivo,
    'Cierre del día ' || (NOW() - (n * INTERVAL '1 day'))::date as notas,
    (SELECT id FROM usuarios WHERE rol = 'ADMIN' LIMIT 1) as usuario_id,
    true as cerrado
FROM generate_series(0, 9) n
WHERE NOT EXISTS (
    SELECT 1 FROM cierres_caja 
    WHERE fecha_inicio = (NOW() - (n * INTERVAL '1 day'))::date + TIME '08:00:00'
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
-- ✅ 10 productos básicos (BEBIDA, COMIDA, POSTRE, SNACK)
-- ✅ 30 ingredientes vendibles (INGREDIENTE)
-- ✅ 10 registros de inventario
-- ✅ 10 proveedores
-- ✅ 10 mesas
-- ✅ 10 descuentos
-- ✅ 10 pedidos con items
-- ✅ 10 movimientos de inventario
-- ✅ 10 entradas de inventario
-- ✅ 10 cierres de caja
-- ✅ 10 actividades de auditoría
-- 
-- Ejecutar DESPUÉS de schema.sql
-- Luego ejecutar: rls-policies.sql

