-- ============================================
-- POLÍTICAS RLS Y PERMISOS
-- EVENTOS SALOME - Sistema de Gestión
-- ============================================
-- Ejecutar DESPUÉS de schema.sql y seed.sql
-- Este archivo contiene todas las políticas de seguridad (RLS)
-- y permisos para Supabase Storage

-- NOTA: RLS ya está habilitado en schema.sql
-- Este archivo solo define las políticas

-- 🔹 Eliminar políticas existentes (para evitar conflictos)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('schema_migrations')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "acceso_completo_%I" ON %I;', t, t);
    END LOOP;
END $$;

-- 🔹 Crear políticas globales de acceso completo
CREATE POLICY "acceso_completo_usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_productos" ON productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_inventario_items" ON inventario_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_proveedores" ON proveedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_entradas_inventario" ON entradas_inventario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_movimientos_inventario" ON movimientos_inventario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_mesas" ON mesas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_descuentos" ON descuentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_items_pedido" ON items_pedido FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_cierres_caja" ON cierres_caja FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_completo_actividades_auditoria" ON actividades_auditoria FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 🔹 Asignar permisos a los roles del sistema
-- ============================================

-- Permitir que todos los roles puedan acceder (modo desarrollo)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- También incluir vistas, secuencias y funciones si las usas
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- STORAGE (Supabase Storage)
-- ============================================

-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "storage_public_access" ON storage.objects;

-- Permitir acceso público completo al bucket "productos"
CREATE POLICY "storage_public_access"
ON storage.objects FOR ALL
USING (bucket_id = 'productos')
WITH CHECK (bucket_id = 'productos');

-- ============================================
-- FIN DE CONFIGURACIÓN DE PERMISOS
-- ============================================

-- ✅ Modo desarrollo activado
-- Todos los roles tienen acceso completo a todas las tablas y funciones
-- Ideal para entorno local o de pruebas
