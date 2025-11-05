/**
 * Script de Verificación del Flujo de Venta
 * Verifica que todos los componentes necesarios para el flujo de venta estén funcionando
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno (si dotenv está disponible)
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (e) {
  // Si dotenv no está disponible, cargar manualmente desde .env.local
  try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.+)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (err) {
    // Ignorar si no se puede cargar
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('   Asegúrate de tener .env.local con:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=tu_url');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const checks = {
  conexion: false,
  productos: false,
  usuarios: false,
  inventario: false,
  descuentos: false,
  mesas: false,
  pedidos: false,
};

async function verificarConexion() {
  try {
    const { data, error } = await supabase.from('productos').select('count').limit(1);
    if (error) throw error;
    checks.conexion = true;
    console.log('✅ Conexión a Supabase: OK');
    return true;
  } catch (error) {
    console.error('❌ Conexión a Supabase: FALLO');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function verificarProductos() {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, categoria, disponible')
      .eq('disponible', true);
    
    if (error) throw error;
    
    const total = data.length;
    const porCategoria = {};
    
    data.forEach(p => {
      porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
    });
    
    if (total >= 10) {
      checks.productos = true;
      console.log(`✅ Productos disponibles: ${total} productos`);
      console.log(`   Categorías: ${JSON.stringify(porCategoria)}`);
      return true;
    } else {
      console.error(`❌ Productos disponibles: Solo ${total} productos (mínimo 10)`);
      console.error('   Ejecuta supabase/seed.sql para cargar productos');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar productos:', error.message);
    return false;
  }
}

async function verificarUsuarios() {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo')
      .eq('activo', true);
    
    if (error) throw error;
    
    const roles = {
      ADMIN: data.filter(u => u.rol === 'ADMIN').length,
      MESERO: data.filter(u => u.rol === 'MESERO').length,
      COCINA: data.filter(u => u.rol === 'COCINA').length,
      CLIENTE: data.filter(u => u.rol === 'CLIENTE').length,
    };
    
    const tieneAdmin = roles.ADMIN > 0;
    const tieneMesero = roles.MESERO > 0;
    const tieneCocina = roles.COCINA > 0;
    const tieneCliente = roles.CLIENTE > 0;
    
    if (tieneAdmin && tieneMesero && tieneCocina && tieneCliente) {
      checks.usuarios = true;
      console.log('✅ Usuarios de prueba: OK');
      console.log(`   Roles: ${JSON.stringify(roles)}`);
      return true;
    } else {
      console.error('❌ Usuarios de prueba: Faltan roles');
      console.error(`   Roles encontrados: ${JSON.stringify(roles)}`);
      console.error('   Ejecuta supabase/seed.sql para cargar usuarios');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error.message);
    return false;
  }
}

async function verificarInventario() {
  try {
    const { data, error } = await supabase
      .from('inventario_items')
      .select('id, producto_id, cantidad, cantidad_minima');
    
    if (error) throw error;
    
    const total = data.length;
    const conStock = data.filter(i => i.cantidad > 0).length;
    
    if (total >= 5) {
      checks.inventario = true;
      console.log(`✅ Inventario: ${total} items, ${conStock} con stock`);
      return true;
    } else {
      console.error(`❌ Inventario: Solo ${total} items (mínimo 5)`);
      console.error('   Ejecuta supabase/seed.sql para cargar inventario');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar inventario:', error.message);
    return false;
  }
}

async function verificarDescuentos() {
  try {
    const { data, error } = await supabase
      .from('descuentos')
      .select('id, nombre, activo')
      .eq('activo', true);
    
    if (error) throw error;
    
    const total = data.length;
    
    if (total >= 3) {
      checks.descuentos = true;
      console.log(`✅ Descuentos activos: ${total} descuentos`);
      return true;
    } else {
      console.error(`❌ Descuentos activos: Solo ${total} (mínimo 3)`);
      console.error('   Ejecuta supabase/seed.sql para cargar descuentos');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar descuentos:', error.message);
    return false;
  }
}

async function verificarMesas() {
  try {
    const { data, error } = await supabase
      .from('mesas')
      .select('id, numero, disponible');
    
    if (error) throw error;
    
    const total = data.length;
    const disponibles = data.filter(m => m.disponible).length;
    
    if (total >= 5) {
      checks.mesas = true;
      console.log(`✅ Mesas: ${total} mesas, ${disponibles} disponibles`);
      return true;
    } else {
      console.error(`❌ Mesas: Solo ${total} (mínimo 5)`);
      console.error('   Ejecuta supabase/seed.sql para cargar mesas');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar mesas:', error.message);
    return false;
  }
}

async function verificarPedidos() {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, numero, estado, total')
      .limit(5);
    
    if (error) throw error;
    
    // No es crítico si no hay pedidos, solo verificamos que la tabla existe
    checks.pedidos = true;
    console.log(`✅ Tabla de pedidos: OK (${data.length} pedidos existentes)`);
    return true;
  } catch (error) {
    console.error('❌ Error al verificar pedidos:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n🔍 Verificando Flujo de Venta...\n');
  
  await verificarConexion();
  if (!checks.conexion) {
    console.error('\n❌ No se puede continuar sin conexión a Supabase');
    process.exit(1);
  }
  
  await verificarProductos();
  await verificarUsuarios();
  await verificarInventario();
  await verificarDescuentos();
  await verificarMesas();
  await verificarPedidos();
  
  console.log('\n' + '='.repeat(50));
  
  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(v => v).length;
  
  if (passedChecks === totalChecks) {
    console.log(`\n✅ TODAS LAS VERIFICACIONES PASARON (${passedChecks}/${totalChecks})`);
    console.log('\n🚀 El sistema está listo para hacer ventas!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Inicia el servidor: npm run dev');
    console.log('   2. Ve a http://localhost:3000');
    console.log('   3. Agrega productos al carrito');
    console.log('   4. Inicia sesión como cliente@salome.com / cliente123');
    console.log('   5. Completa el checkout');
    console.log('   6. Verifica el pedido en /seguimiento/[id]\n');
  } else {
    console.log(`\n⚠️  ALGUNAS VERIFICACIONES FALLARON (${passedChecks}/${totalChecks})`);
    console.log('\n📋 Pasos para solucionar:');
    console.log('   1. Ejecuta supabase/schema.sql en Supabase SQL Editor');
    console.log('   2. Ejecuta supabase/seed.sql en Supabase SQL Editor');
    console.log('   3. Ejecuta supabase/rls-policies.sql en Supabase SQL Editor');
    console.log('   4. Vuelve a ejecutar este script: node scripts/verify-sale-flow.js\n');
  }
  
  process.exit(passedChecks === totalChecks ? 0 : 1);
}

main().catch(console.error);

