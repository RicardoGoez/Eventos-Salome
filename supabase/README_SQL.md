# 📁 Archivos SQL - Eventos Salome

Este directorio contiene **3 archivos SQL** organizados para configurar la base de datos completa:

## 📋 Archivos

### 1. `schema.sql`
**Esquema completo de la base de datos**

Contiene:
- ✅ 12 tablas principales
- ✅ Índices para optimización
- ✅ Triggers para actualización automática
- ✅ Funciones auxiliares
- ✅ Habilitación de RLS (Row Level Security)
- ✅ Bucket de Storage para imágenes

**Ejecutar PRIMERO**

---

### 2. `seed.sql`
**Registros de prueba y datos iniciales**

Contiene:
- ✅ 4 usuarios de prueba (ADMIN, MESERO, COCINA, CLIENTE)
- ✅ 10 productos básicos (BEBIDA, COMIDA, POSTRE, SNACK)
- ✅ 30 ingredientes vendibles (INGREDIENTE)
- ✅ 10 registros de inventario
- ✅ 10 proveedores
- ✅ 10 mesas
- ✅ 10 descuentos
- ✅ 10 pedidos con items
- ✅ 10 movimientos de inventario
- ✅ 10 entradas de inventario
- ✅ 10 cierres de caja
- ✅ 10 actividades de auditoría

**Ejecutar SEGUNDO** (después de `schema.sql`)

---

### 3. `rls-policies.sql`
**Políticas de seguridad (RLS) y permisos**

Contiene:
- ✅ Políticas RLS para todas las tablas (modo desarrollo)
- ✅ Permisos para roles de Supabase
- ✅ Políticas de Storage para imágenes de productos

**Ejecutar TERCERO** (después de `schema.sql` y `seed.sql`)

---

## 🚀 Orden de Ejecución

```sql
1. schema.sql      → Crea la estructura completa
2. seed.sql        → Inserta datos de prueba
3. rls-policies.sql → Configura políticas de seguridad
```

---

## 👤 Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| ADMIN | admin@salome.com | admin123 |
| MESERO | mesero@salome.com | mesero123 |
| COCINA | cocina@salome.com | cocina123 |
| CLIENTE | cliente@salome.com | cliente123 |

---

## 📝 Notas

- Todos los archivos usan `WHERE NOT EXISTS` o `ON CONFLICT` para evitar duplicados
- Las políticas RLS están configuradas para **modo desarrollo** (acceso completo)
- Para producción, ajustar las políticas en `rls-policies.sql`

---

## 🔧 Ejecución en Supabase

1. Abre el **SQL Editor** en tu proyecto de Supabase
2. Ejecuta cada archivo en orden:
   - Copia y pega el contenido de `schema.sql` → Ejecutar
   - Copia y pega el contenido de `seed.sql` → Ejecutar
   - Copia y pega el contenido de `rls-policies.sql` → Ejecutar

¡Listo! Tu base de datos estará configurada y lista para usar.

