/**
 * Script de Seed para generar datos de prueba
 * Ejecutar con: npx ts-node scripts/seed.ts
 * O con: npm run seed (si está configurado en package.json)
 */

import { createServerClient } from "../lib/supabase/client";
import bcrypt from "bcryptjs";
import { CategoriaProducto, EstadoPedido, MetodoPago, TipoDescuento, RolUsuario, TipoMovimientoInventario } from "../types/domain";

const supabase = createServerClient();

async function seed() {
  console.log("🌱 Iniciando seed de datos de prueba...");

  try {
    // 1. Crear Usuarios
    console.log("📝 Creando usuarios...");
    const passwordHash = await bcrypt.hash("admin123", 10);
    
    const usuarios = [
      {
        nombre: "Admin Principal",
        email: "admin@eventossalome.com",
        password: passwordHash,
        rol: RolUsuario.ADMIN,
        activo: true,
      },
      {
        nombre: "Mesero Juan",
        email: "mesero1@eventossalome.com",
        password: passwordHash,
        rol: RolUsuario.MESERO,
        activo: true,
      },
      {
        nombre: "Mesero María",
        email: "mesero2@eventossalome.com",
        password: passwordHash,
        rol: RolUsuario.MESERO,
        activo: true,
      },
      {
        nombre: "Cliente Prueba",
        email: "cliente@eventossalome.com",
        password: passwordHash,
        rol: RolUsuario.CLIENTE,
        activo: true,
      },
    ];

    const { data: usuariosData, error: usuariosError } = await supabase
      .from("usuarios")
      .upsert(usuarios, { onConflict: "email" })
      .select();

    if (usuariosError) {
      console.error("Error creando usuarios:", usuariosError);
      throw usuariosError;
    }

    console.log(`✅ ${usuariosData?.length || 0} usuarios creados`);
    const adminId = usuariosData?.find((u: any) => u.rol === RolUsuario.ADMIN)?.id;
    const meseroId = usuariosData?.find((u: any) => u.rol === RolUsuario.MESERO)?.id;

    // 2. Crear Productos
    console.log("☕ Creando productos...");
    const productos = [
      // BEBIDAS
      {
        nombre: "Café Espresso",
        descripcion: "Café espresso italiano auténtico",
        categoria: CategoriaProducto.BEBIDA,
        precio: 25.00,
        costo: 8.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Cappuccino",
        descripcion: "Café con leche espumada y cacao",
        categoria: CategoriaProducto.BEBIDA,
        precio: 35.00,
        costo: 12.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Latte",
        descripcion: "Café con leche vaporizada",
        categoria: CategoriaProducto.BEBIDA,
        precio: 40.00,
        costo: 14.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Americano",
        descripcion: "Café espresso con agua caliente",
        categoria: CategoriaProducto.BEBIDA,
        precio: 30.00,
        costo: 10.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Mocha",
        descripcion: "Café con chocolate y leche",
        categoria: CategoriaProducto.BEBIDA,
        precio: 45.00,
        costo: 16.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Té Verde",
        descripcion: "Té verde japonés premium",
        categoria: CategoriaProducto.BEBIDA,
        precio: 28.00,
        costo: 9.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Jugo de Naranja",
        descripcion: "Jugo de naranja natural",
        categoria: CategoriaProducto.BEBIDA,
        precio: 32.00,
        costo: 11.00,
        disponible: true,
        imagen: null,
      },
      // COMIDA
      {
        nombre: "Sandwich de Pollo",
        descripcion: "Sandwich con pollo asado, lechuga y tomate",
        categoria: CategoriaProducto.COMIDA,
        precio: 85.00,
        costo: 35.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Bagel con Queso Crema",
        descripcion: "Bagel tostado con queso crema y salmón",
        categoria: CategoriaProducto.COMIDA,
        precio: 75.00,
        costo: 30.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Ensalada César",
        descripcion: "Ensalada con pollo, crutones y aderezo césar",
        categoria: CategoriaProducto.COMIDA,
        precio: 90.00,
        costo: 38.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Quesadilla",
        descripcion: "Quesadilla de queso con salsa",
        categoria: CategoriaProducto.COMIDA,
        precio: 70.00,
        costo: 28.00,
        disponible: true,
        imagen: null,
      },
      // POSTRES
      {
        nombre: "Pastel de Chocolate",
        descripcion: "Pastel de chocolate belga",
        categoria: CategoriaProducto.POSTRE,
        precio: 65.00,
        costo: 25.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Cheesecake",
        descripcion: "Cheesecake de fresa",
        categoria: CategoriaProducto.POSTRE,
        precio: 70.00,
        costo: 28.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Brownie",
        descripcion: "Brownie con nueces",
        categoria: CategoriaProducto.POSTRE,
        precio: 45.00,
        costo: 18.00,
        disponible: true,
        imagen: null,
      },
      // SNACKS
      {
        nombre: "Galletas",
        descripcion: "Galletas caseras variadas",
        categoria: CategoriaProducto.SNACK,
        precio: 35.00,
        costo: 12.00,
        disponible: true,
        imagen: null,
      },
      {
        nombre: "Muffin",
        descripcion: "Muffin de arándanos",
        categoria: CategoriaProducto.SNACK,
        precio: 40.00,
        costo: 15.00,
        disponible: true,
        imagen: null,
      },
    ];

    const { data: productosData, error: productosError } = await supabase
      .from("productos")
      .upsert(productos, { onConflict: "nombre" })
      .select();

    if (productosError) {
      console.error("Error creando productos:", productosError);
      throw productosError;
    }

    console.log(`✅ ${productosData?.length || 0} productos creados`);

    // 3. Crear Inventario
    console.log("📦 Creando inventario...");
    if (productosData && productosData.length > 0) {
      const inventarioItems = productosData.map((producto: any, index: number) => ({
        producto_id: producto.id,
        cantidad: 50 + Math.floor(Math.random() * 100),
        cantidad_minima: 20,
        unidad: "unidad",
        ubicacion: `Estante ${String.fromCharCode(65 + (index % 5))}`,
        fecha_vencimiento: null,
      }));

      const { data: inventarioData, error: inventarioError } = await supabase
        .from("inventario_items")
        .upsert(inventarioItems, { onConflict: "producto_id" })
        .select();

      if (inventarioError) {
        console.error("Error creando inventario:", inventarioError);
      } else {
        console.log(`✅ ${inventarioData?.length || 0} items de inventario creados`);
      }
    }

    // 4. Crear Proveedores
    console.log("🏢 Creando proveedores...");
    const proveedores = [
      {
        nombre: "Café Premium S.A.",
        telefono: "555-0101",
        email: "ventas@cafepremium.com",
        direccion: "Av. Principal 123",
        activo: true,
      },
      {
        nombre: "Distribuidora de Alimentos",
        telefono: "555-0102",
        email: "contacto@distribuidora.com",
        direccion: "Calle Comercial 456",
        activo: true,
      },
      {
        nombre: "Proveedor de Postres",
        telefono: "555-0103",
        email: "info@postres.com",
        direccion: "Boulevard Dulce 789",
        activo: true,
      },
    ];

    const { data: proveedoresData, error: proveedoresError } = await supabase
      .from("proveedores")
      .upsert(proveedores, { onConflict: "nombre" })
      .select();

    if (proveedoresError) {
      console.error("Error creando proveedores:", proveedoresError);
    } else {
      console.log(`✅ ${proveedoresData?.length || 0} proveedores creados`);
    }

    // 5. Crear Mesas
    console.log("🪑 Creando mesas...");
    const mesas = Array.from({ length: 10 }, (_, i) => ({
      numero: i + 1,
      capacidad: [2, 4, 4, 6, 2, 4, 8, 4, 2, 6][i],
      disponible: Math.random() > 0.3,
      notas: i === 0 ? "Mesa cerca de la ventana" : null,
    }));

    const { data: mesasData, error: mesasError } = await supabase
      .from("mesas")
      .upsert(mesas, { onConflict: "numero" })
      .select();

    if (mesasError) {
      console.error("Error creando mesas:", mesasError);
    } else {
      console.log(`✅ ${mesasData?.length || 0} mesas creadas`);
    }

    // 6. Crear Descuentos
    console.log("🎟️ Creando descuentos...");
    const descuentos = [
      {
        nombre: "Descuento 10%",
        descripcion: "Descuento del 10% en todos los productos",
        tipo: TipoDescuento.PORCENTAJE,
        valor: 10.0,
        activo: true,
        fecha_inicio: new Date().toISOString(),
        fecha_fin: null,
        cantidad_minima: null,
        aplicado_a_pedidos: 0,
      },
      {
        nombre: "Descuento $50",
        descripcion: "Descuento fijo de $50 en pedidos mayores a $200",
        tipo: TipoDescuento.VALOR_FIJO,
        valor: 50.0,
        activo: true,
        fecha_inicio: new Date().toISOString(),
        fecha_fin: null,
        cantidad_minima: 200,
        aplicado_a_pedidos: 0,
      },
    ];

    const { data: descuentosData, error: descuentosError } = await supabase
      .from("descuentos")
      .upsert(descuentos, { onConflict: "nombre" })
      .select();

    if (descuentosError) {
      console.error("Error creando descuentos:", descuentosError);
    } else {
      console.log(`✅ ${descuentosData?.length || 0} descuentos creados`);
    }

    // 7. Crear Pedidos de ejemplo
    console.log("🛒 Creando pedidos de ejemplo...");
    let pedidosData: any[] | null = null;
    if (productosData && mesasData && usuariosData && descuentosData) {
      const pedidos = [];
      const estados = [EstadoPedido.PENDIENTE, EstadoPedido.ENTREGADO, EstadoPedido.EN_PREPARACION];
      const metodosPago = [MetodoPago.EFECTIVO, MetodoPago.TARJETA, MetodoPago.TRANSFERENCIA];

      for (let i = 0; i < 15; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));
        fecha.setHours(8 + Math.floor(Math.random() * 12));

        const productosSeleccionados = productosData.slice(0, Math.floor(Math.random() * 3) + 1);
        const subtotal = productosSeleccionados.reduce((sum: number, p: any) => sum + (p.precio * (Math.floor(Math.random() * 2) + 1)), 0);
        const descuento = i % 3 === 0 ? subtotal * 0.1 : 0;
        const subtotalConDescuento = subtotal - descuento;
        const iva = subtotalConDescuento * 0.16;
        const total = subtotalConDescuento + iva;

        const pedido = {
          numero: `PED-${String(i + 1).padStart(6, "0")}`,
          estado: estados[Math.floor(Math.random() * estados.length)],
          subtotal: subtotal,
          descuento: descuento,
          iva: iva,
          total: total,
          metodo_pago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
          cliente_id: usuariosData.find((u: any) => u.rol === RolUsuario.CLIENTE)?.id || null,
          cliente_nombre: "Cliente Prueba",
          mesa_id: mesasData[Math.floor(Math.random() * mesasData.length)].id,
          descuento_id: i % 3 === 0 ? descuentosData[0].id : null,
          ticket_qr: null,
          notas: i % 5 === 0 ? "Sin azúcar" : null,
          fecha: fecha.toISOString(),
        };

        pedidos.push(pedido);
      }

      const { data: pedidosDataResult, error: pedidosError } = await supabase
        .from("pedidos")
        .upsert(pedidos, { onConflict: "numero" })
        .select();
      
      pedidosData = pedidosDataResult;

      if (pedidosError) {
        console.error("Error creando pedidos:", pedidosError);
      } else {
        console.log(`✅ ${pedidosDataResult?.length || 0} pedidos creados`);

        // Crear items de pedidos
        if (pedidosData && productosData) {
          const itemsPedido = [];
          for (const pedido of pedidosData) {
            const productosPedido = productosData.slice(0, Math.floor(Math.random() * 3) + 1);
            for (const producto of productosPedido) {
              const cantidad = Math.floor(Math.random() * 2) + 1;
              itemsPedido.push({
                pedido_id: pedido.id,
                producto_id: producto.id,
                cantidad: cantidad,
                precio_unitario: producto.precio,
                subtotal: producto.precio * cantidad,
                notas: null,
              });
            }
          }

          const { error: itemsError } = await supabase
            .from("items_pedido")
            .upsert(itemsPedido);

          if (itemsError) {
            console.error("Error creando items de pedidos:", itemsError);
          } else {
            console.log(`✅ ${itemsPedido.length} items de pedidos creados`);
          }
        }
      }
    }

    // 8. Crear Cierres de Caja
    console.log("💰 Creando cierres de caja...");
    if (pedidosData && adminId) {
      const cierres = [];
      for (let i = 0; i < 5; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaInicio = new Date(fecha);
        fechaInicio.setHours(8, 0, 0, 0);
        const fechaFin = new Date(fecha);
        fechaFin.setHours(22, 0, 0, 0);

        const pedidosDelDia = pedidosData.filter((p: any) => {
          const pedidoDate = new Date(p.fecha);
          return pedidoDate.toDateString() === fecha.toDateString();
        });

        const totalVentas = pedidosDelDia.reduce((sum: number, p: any) => sum + p.total, 0);
        const totalEfectivo = pedidosDelDia.filter((p: any) => p.metodo_pago === MetodoPago.EFECTIVO).reduce((sum: number, p: any) => sum + p.total, 0);
        const totalTarjeta = pedidosDelDia.filter((p: any) => p.metodo_pago === MetodoPago.TARJETA).reduce((sum: number, p: any) => sum + p.total, 0);
        const totalTransferencia = pedidosDelDia.filter((p: any) => p.metodo_pago === MetodoPago.TRANSFERENCIA).reduce((sum: number, p: any) => sum + p.total, 0);

        cierres.push({
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString(),
          total_ventas: totalVentas || 0,
          total_efectivo: totalEfectivo || 0,
          total_tarjeta: totalTarjeta || 0,
          total_transferencia: totalTransferencia || 0,
          numero_pedidos: pedidosDelDia.length,
          numero_pedidos_cancelados: 0,
          diferencia_efectivo: 0,
          notas: `Cierre del día ${fecha.toLocaleDateString()}`,
          usuario_id: adminId,
          cerrado: true,
        });
      }

      const { error: cierresError } = await supabase
        .from("cierres_caja")
        .upsert(cierres);

      if (cierresError) {
        console.error("Error creando cierres de caja:", cierresError);
      } else {
        console.log(`✅ ${cierres.length} cierres de caja creados`);
      }
    }

    // 9. Crear Actividades de Auditoría
    console.log("📋 Creando actividades de auditoría...");
    if (adminId && productosData) {
      const actividades = [];
      const acciones = ["CREAR", "ACTUALIZAR", "ELIMINAR", "VER"];
      const entidades = ["PRODUCTO", "PEDIDO", "INVENTARIO", "USUARIO"];

      for (let i = 0; i < 20; i++) {
        const fecha = new Date();
        fecha.setHours(fecha.getHours() - Math.floor(Math.random() * 48));

        actividades.push({
          usuario_id: adminId,
          accion: acciones[Math.floor(Math.random() * acciones.length)],
          entidad: entidades[Math.floor(Math.random() * entidades.length)],
          entidad_id: productosData[Math.floor(Math.random() * productosData.length)].id,
          detalles: `Acción de prueba ${i + 1}`,
          fecha: fecha.toISOString(),
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        });
      }

      const { error: auditoriaError } = await supabase
        .from("actividades_auditoria")
        .insert(actividades);

      if (auditoriaError) {
        console.error("Error creando actividades de auditoría:", auditoriaError);
      } else {
        console.log(`✅ ${actividades.length} actividades de auditoría creadas`);
      }
    }

    console.log("\n✅ ¡Seed completado exitosamente!");
    console.log("\n📝 Credenciales de acceso:");
    console.log("   Admin: admin@eventossalome.com / admin123");
    console.log("   Mesero: mesero1@eventossalome.com / admin123");
    console.log("   Cliente: cliente@eventossalome.com / admin123");

  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    process.exit(1);
  }
}

seed();

