"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, TrendingUp, AlertTriangle, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AdminWrapper } from "@/components/admin-wrapper";
import { useAdminData } from "@/contexts/admin-data-context";

interface ProductoPopular {
  id: string;
  nombre: string;
  cantidad: number;
  total: number;
}

interface ActividadReciente {
  id: string;
  fecha: string;
  accion: string;
  entidad: string;
  usuarioId: string;
}

function AdminDashboardPageContent() {
  const {
    productos,
    pedidos,
    refreshAll,
  } = useAdminData();
  
  const [stats, setStats] = useState({
    productos: 0,
    pedidosPendientes: 0,
    ingresosDia: 0,
    stockBajo: 0,
    totalUsuarios: 0,
    pedidosTotales: 0,
  });
  const [productosPopulares, setProductosPopulares] = useState<ProductoPopular[]>([]);
  const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);
  const [ventasPorDia, setVentasPorDia] = useState<{ fecha: string; total: number }[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [productos, pedidos]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoadingExtra(true);
      
      // Usar datos del contexto (ya cargados)
      const productosArray = Array.isArray(productos) ? productos : [];
      const todosPedidos = Array.isArray(pedidos) ? pedidos : [];
      
      // Solo cargar datos adicionales que no están en el contexto
      const [inventarioRes, usuariosRes, pedidosPendientesRes, auditoriaRes] = await Promise.all([
        fetch("/api/inventario?bajoStock=true"),
        fetch("/api/usuarios"),
        fetch("/api/pedidos?estado=PENDIENTE"),
        fetch("/api/auditoria"),
      ]);

      const inventario = inventarioRes.ok ? await inventarioRes.json() : [];
      const usuarios = usuariosRes.ok ? await usuariosRes.json() : [];
      const pedidosPendientes = pedidosPendientesRes.ok ? await pedidosPendientesRes.json() : [];
      const actividadesData = auditoriaRes.ok ? await auditoriaRes.json() : [];

      // Asegurar que siempre sean arrays
      const inventarioArray = Array.isArray(inventario) ? inventario : (inventario.error ? [] : []);
      const usuariosArray = Array.isArray(usuarios) ? usuarios : (usuarios.error ? [] : []);
      const pedidosPendientesArray = Array.isArray(pedidosPendientes) ? pedidosPendientes : (pedidosPendientes.error ? [] : []);
      const actividades = Array.isArray(actividadesData) ? actividadesData : (actividadesData.error ? [] : []);

      // Calcular ingresos del día
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const ingresosDia = todosPedidos
        .filter((p: any) => {
          const fechaPedido = new Date(p.fecha);
          return fechaPedido >= hoy && p.estado === "ENTREGADO";
        })
        .reduce((sum: number, p: any) => sum + (p.total || 0), 0);

      // Calcular productos más vendidos
      const productosVendidos: Record<string, { cantidad: number; total: number; nombre: string }> = {};
      todosPedidos
        .filter((p: any) => p.estado === "ENTREGADO")
        .forEach((pedido: any) => {
          pedido.items?.forEach((item: any) => {
            const productoId = item.productoId || item.producto?.id;
            const productoNombre = item.producto?.nombre || "Producto desconocido";
            if (!productosVendidos[productoId]) {
              productosVendidos[productoId] = {
                cantidad: 0,
                total: 0,
                nombre: productoNombre,
              };
            }
            productosVendidos[productoId].cantidad += item.cantidad || 0;
            productosVendidos[productoId].total += item.subtotal || 0;
          });
        });

      const productosPopularesArray = Object.entries(productosVendidos)
        .map(([id, data]) => ({
          id,
          nombre: data.nombre,
          cantidad: data.cantidad,
          total: data.total,
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

      // Ventas por día (últimos 7 días)
      const ventasPorDiaMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        fecha.setHours(0, 0, 0, 0);
        const fechaStr = format(fecha, "yyyy-MM-dd");
        ventasPorDiaMap[fechaStr] = 0;
      }

      todosPedidos
        .filter((p: any) => p.estado === "ENTREGADO")
        .forEach((pedido: any) => {
          const fechaPedido = new Date(pedido.fecha);
          fechaPedido.setHours(0, 0, 0, 0);
          const fechaStr = format(fechaPedido, "yyyy-MM-dd");
          if (ventasPorDiaMap[fechaStr] !== undefined) {
            ventasPorDiaMap[fechaStr] += pedido.total || 0;
          }
        });

      const ventasPorDiaArray = Object.entries(ventasPorDiaMap).map(([fecha, total]) => ({
        fecha,
        total,
      }));

      // Actividades recientes (últimas 5)
      const actividadesRecientesArray = actividades
        .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 5)
        .map((act: any) => ({
          id: act.id,
          fecha: act.fecha,
          accion: act.accion,
          entidad: act.entidad || "Sistema",
          usuarioId: act.usuarioId,
        }));

      setStats({
        productos: productosArray.length,
        pedidosPendientes: pedidosPendientesArray.length,
        ingresosDia,
        stockBajo: inventarioArray.length,
        totalUsuarios: usuariosArray.length,
        pedidosTotales: todosPedidos.filter((p: any) => p.estado === "ENTREGADO").length,
      });
      setProductosPopulares(productosPopularesArray);
      setActividadesRecientes(actividadesRecientesArray);
      setVentasPorDia(ventasPorDiaArray);
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
    } finally {
      setLoadingExtra(false);
    }
  }, [productos, pedidos]);

  // Memoizar maxVentas
  const maxVentas = useMemo(() => 
    Math.max(...ventasPorDia.map((v) => v.total), 1),
    [ventasPorDia]
  );


  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0" role="main" id="main-content">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb items={[{ label: "Dashboard" }]} />
          <h1 className="mb-4 sm:mb-6 md:mb-8 text-2xl sm:text-3xl font-bold text-dark">
            Dashboard - Eventos <span className="italic">Salome</span>
          </h1>

          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-900">
                  Total Productos
                </CardTitle>
                <Package className="h-4 w-4 text-gray-600" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.productos}</div>
                <p className="text-xs text-gray-700">
                  Productos disponibles
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-900">
                  Pedidos Pendientes
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-gray-600" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pedidosPendientes}</div>
                <p className="text-xs text-gray-700">
                  En espera de preparación
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-900">
                  Ingresos del Día
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">${stats.ingresosDia.toFixed(2)}</div>
                <p className="text-xs text-gray-700">
                  Total de ventas hoy
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-900">
                  Stock Bajo
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.stockBajo}</div>
                <p className="text-xs text-gray-700">
                  Items con stock mínimo
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-900">
                  Total Usuarios
                </CardTitle>
                <Users className="h-4 w-4 text-gray-600" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalUsuarios}</div>
                <p className="text-xs text-gray-700">
                  Usuarios registrados
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-900">
                  Pedidos Totales
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-gray-600" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pedidosTotales}</div>
                <p className="text-xs text-gray-700">
                  Pedidos entregados
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ventas Últimos 7 Días</CardTitle>
                <CardDescription>
                  Tendencia de ventas diarias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {ventasPorDia.map((venta, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full h-48 bg-gray-200 rounded-t overflow-hidden">
                        <div
                          className="absolute bottom-0 w-full bg-primary transition-all duration-500"
                          style={{
                            height: `${(venta.total / maxVentas) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        {format(new Date(venta.fecha), "dd/MM", { locale: es })}
                      </div>
                      <div className="text-xs font-semibold">
                        ${venta.total.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productos Populares</CardTitle>
                <CardDescription>
                  Los productos más vendidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                  {productosPopulares.length === 0 ? (
                    <p className="text-sm text-gray-700">
                      No hay productos vendidos aún
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {productosPopulares.map((producto, index) => (
                        <div key={producto.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{producto.nombre}</p>
                              <p className="text-xs text-gray-700">
                                {producto.cantidad} unidades
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${producto.total.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 sm:mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>
                  Últimos movimientos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                  {actividadesRecientes.length === 0 ? (
                    <p className="text-sm text-gray-700">
                      No hay actividad reciente
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {actividadesRecientes.map((actividad) => (
                        <div
                          key={actividad.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{actividad.accion}</p>
                            <p className="text-sm text-gray-700">
                              {actividad.entidad} • Usuario: {actividad.usuarioId.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-700">
                            {format(new Date(actividad.fecha), "dd/MM/yyyy HH:mm", {
                              locale: es,
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminWrapper>
      <AdminDashboardPageContent />
    </AdminWrapper>
  );
}
