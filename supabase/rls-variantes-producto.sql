-- ============================================
-- POLÍTICAS RLS PARA VARIANTES_PRODUCTO
-- ============================================
-- Este script configura las políticas de seguridad (RLS)
-- para permitir acceso a la tabla variantes_producto
--
-- Ejecutar en Supabase SQL Editor después de crear la tabla
-- ============================================

-- Habilitar RLS en la tabla (si no está habilitado)
ALTER TABLE variantes_producto ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay (para evitar duplicados)
DROP POLICY IF EXISTS "acceso_completo_variantes_producto" ON variantes_producto;
DROP POLICY IF EXISTS "Permitir lectura pública de variantes" ON variantes_producto;
DROP POLICY IF EXISTS "Permitir inserción de variantes" ON variantes_producto;
DROP POLICY IF EXISTS "Permitir actualización de variantes" ON variantes_producto;
DROP POLICY IF EXISTS "Permitir eliminación de variantes" ON variantes_producto;

-- Política de acceso completo (mismo patrón que otras tablas)
-- Esto permite acceso completo a la tabla para todos los usuarios
CREATE POLICY "acceso_completo_variantes_producto" 
ON variantes_producto 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Política RLS configurada para variantes_producto';
    RAISE NOTICE '   - Acceso completo habilitado (SELECT, INSERT, UPDATE, DELETE)';
END $$;

