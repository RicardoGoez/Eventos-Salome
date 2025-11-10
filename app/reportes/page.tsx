"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, DollarSign, Package, Download, FileText, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { Logo } from "@/components/logo";
import { getLogoDataUrl } from "@/lib/utils/logo-loader";

export default function ReportesPage() {
  const [fechaInicio, setFechaInicio] = useState(
    format(new Date(new Date().setDate(new Date().getDate() - 7)), "yyyy-MM-dd")
  );
  const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [reporteVentas, setReporteVentas] = useState({
    totalVentas: 0,
    pedidosTotales: 0,
    promedioPorPedido: 0,
    ventasPorMetodo: {} as Record<string, number>,
    ventasPorDia: [] as { fecha: string; total: number; cantidad: number }[],
  });
  const [reporteInventario, setReporteInventario] = useState({
    totalItems: 0,
    itemsStockBajo: 0,
    valorTotal: 0,
  });
  const [reporteProductos, setReporteProductos] = useState<Array<{
    nombre: string;
    categoria: string;
    cantidadVendida: number;
    ingresos: number;
  }>>([]);

  useEffect(() => {
    loadReportes();
  }, [fechaInicio, fechaFin]);

  const loadReportes = async () => {
    setLoading(true);
    try {
      const [pedidosRes, inventarioRes, productosRes] = await Promise.all([
        fetch("/api/pedidos"),
        fetch("/api/inventario"),
        fetch("/api/productos"),
      ]);

      const pedidos = await pedidosRes.json();
      const inventario = await inventarioRes.json();
      const productos = await productosRes.json();

      // Filtrar pedidos por fecha
      const fechaInicioDate = new Date(fechaInicio);
      fechaInicioDate.setHours(0, 0, 0, 0);
      const fechaFinDate = new Date(fechaFin);
      fechaFinDate.setHours(23, 59, 59, 999);

      const pedidosFiltrados = pedidos.filter((p: any) => {
        const fechaPedido = new Date(p.fecha);
        return fechaPedido >= fechaInicioDate && fechaPedido <= fechaFinDate && p.estado === "ENTREGADO";
      });

      // Calcular estadísticas de ventas
      const totalVentas = pedidosFiltrados.reduce((sum: number, p: any) => sum + (p.total || 0), 0);
      const pedidosTotales = pedidosFiltrados.length;
      const promedioPorPedido = pedidosTotales > 0 ? totalVentas / pedidosTotales : 0;

      // Ventas por método de pago
      const ventasPorMetodo: Record<string, number> = {};
      pedidosFiltrados.forEach((p: any) => {
        const metodo = p.metodoPago || "EFECTIVO";
        ventasPorMetodo[metodo] = (ventasPorMetodo[metodo] || 0) + (p.total || 0);
      });

      // Ventas por día
      const ventasPorDiaMap: Record<string, { total: number; cantidad: number }> = {};
      pedidosFiltrados.forEach((p: any) => {
        const fechaPedido = new Date(p.fecha);
        fechaPedido.setHours(0, 0, 0, 0);
        const fechaStr = format(fechaPedido, "yyyy-MM-dd");
        if (!ventasPorDiaMap[fechaStr]) {
          ventasPorDiaMap[fechaStr] = { total: 0, cantidad: 0 };
        }
        ventasPorDiaMap[fechaStr].total += p.total || 0;
        ventasPorDiaMap[fechaStr].cantidad += 1;
      });

      const ventasPorDia = Object.entries(ventasPorDiaMap)
        .map(([fecha, data]) => ({ fecha, ...data }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

      // Reporte de productos
      const productosVendidos: Record<string, { cantidad: number; ingresos: number; categoria: string }> = {};
      pedidosFiltrados.forEach((pedido: any) => {
        pedido.items?.forEach((item: any) => {
          const productoId = item.productoId || item.producto?.id;
          const productoNombre = item.producto?.nombre || "Producto desconocido";
          const categoria = item.producto?.categoria || "OTROS";
          
          if (!productosVendidos[productoId]) {
            productosVendidos[productoId] = {
              cantidad: 0,
              ingresos: 0,
              categoria,
            };
          }
          productosVendidos[productoId].cantidad += item.cantidad || 0;
          productosVendidos[productoId].ingresos += item.subtotal || 0;
        });
      });

      const reporteProductosArray = Object.entries(productosVendidos)
        .map(([id, data]) => {
          const producto = productos.find((p: any) => p.id === id);
          return {
            nombre: producto?.nombre || "Producto desconocido",
            categoria: data.categoria,
            cantidadVendida: data.cantidad,
            ingresos: data.ingresos,
          };
        })
        .sort((a, b) => b.ingresos - a.ingresos);

      // Reporte de inventario
      const itemsStockBajo = inventario.filter((item: any) => item.cantidad <= item.cantidadMinima);
      const valorTotal = inventario.reduce((sum: number, item: any) => {
        const producto = productos.find((p: any) => p.id === item.productoId);
        return sum + (item.cantidad * (producto?.precio || 0));
      }, 0);

      setReporteVentas({
        totalVentas,
        pedidosTotales,
        promedioPorPedido,
        ventasPorMetodo,
        ventasPorDia,
      });
      setReporteInventario({
        totalItems: inventario.length,
        itemsStockBajo: itemsStockBajo.length,
        valorTotal,
      });
      setReporteProductos(reporteProductosArray);
    } catch (error) {
      console.error("Error al cargar reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportarVentasExcel = () => {
    const wsData = [
      ["Fecha", "Total Ventas", "Cantidad Pedidos"],
      ...reporteVentas.ventasPorDia.map((v) => [
        format(new Date(v.fecha), "dd/MM/yyyy", { locale: es }),
        v.total,
        v.cantidad,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    XLSX.writeFile(wb, `reporte_ventas_${fechaInicio}_${fechaFin}.xlsx`);
  };

  const exportarVentasPDF = async () => {
    const doc = new jsPDF();
    const logoDataUrl = await getLogoDataUrl();

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", 14, 10, 30, 30, undefined, "FAST");
    }

    doc.setFontSize(18);
    doc.text("Reporte de Ventas - Eventos Salome", logoDataUrl ? 50 : 14, 22);
    doc.setFontSize(12);
    doc.text(
      `Período: ${format(new Date(fechaInicio), "dd/MM/yyyy")} - ${format(new Date(fechaFin), "dd/MM/yyyy")}`,
      logoDataUrl ? 50 : 14,
      32
    );
    
    let y = 45;
    doc.setFontSize(14);
    doc.text("Resumen", 14, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`Total Ventas: $${reporteVentas.totalVentas.toFixed(2)}`, 14, y);
    y += 7;
    doc.text(`Pedidos Totales: ${reporteVentas.pedidosTotales}`, 14, y);
    y += 7;
    doc.text(`Promedio por Pedido: $${reporteVentas.promedioPorPedido.toFixed(2)}`, 14, y);
    
    y += 15;
    doc.setFontSize(14);
    doc.text("Ventas por Día", 14, y);
    y += 10;
    
    reporteVentas.ventasPorDia.forEach((venta) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(
        `${format(new Date(venta.fecha), "dd/MM/yyyy")}: $${venta.total.toFixed(2)} (${venta.cantidad} pedidos)`,
        14,
        y
      );
      y += 7;
    });

    doc.save(`reporte_ventas_${fechaInicio}_${fechaFin}.pdf`);
  };

  const exportarProductosExcel = () => {
    const wsData = [
      ["Producto", "Categoría", "Cantidad Vendida", "Ingresos"],
      ...reporteProductos.map((p) => [p.nombre, p.categoria, p.cantidadVendida, p.ingresos]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, `reporte_productos_${fechaInicio}_${fechaFin}.xlsx`);
  };

  const maxVentas = Math.max(...reporteVentas.ventasPorDia.map((v) => v.total), 1);

  return (
    <div className="flex min-h-screen lg:h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo size="lg" shadow />
              <h1 className="text-3xl font-bold text-dark">Reportes - Eventos Salome</h1>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-40"
              />
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          <Tabs defaultValue="ventas" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ventas">Ventas</TabsTrigger>
              <TabsTrigger value="inventario">Inventario</TabsTrigger>
              <TabsTrigger value="productos">Productos</TabsTrigger>
            </TabsList>

            <TabsContent value="ventas" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Reporte de Ventas</CardTitle>
                      <CardDescription>
                        Análisis de ventas y pedidos del período seleccionado
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={exportarVentasExcel} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Excel
                      </Button>
                      <Button onClick={exportarVentasPDF} variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Cargando reporte...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Total Ventas
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              ${reporteVentas.totalVentas.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Total acumulado
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Pedidos Totales
                            </CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {reporteVentas.pedidosTotales}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Total de pedidos
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              Promedio por Pedido
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              ${reporteVentas.promedioPorPedido.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Ticket promedio
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Ventas por Día</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 flex items-end justify-between gap-2">
                            {reporteVentas.ventasPorDia.length === 0 ? (
                              <p className="text-sm text-muted-foreground w-full text-center">
                                No hay ventas en el período seleccionado
                              </p>
                            ) : (
                              reporteVentas.ventasPorDia.map((venta, index) => (
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
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Ventas por Método de Pago</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(reporteVentas.ventasPorMetodo).map(
                              ([metodo, total]) => (
                                <div key={metodo} className="flex items-center justify-between">
                                  <span className="text-sm font-medium capitalize">
                                    {metodo.toLowerCase()}
                                  </span>
                                  <span className="text-sm font-semibold">
                                    ${total.toFixed(2)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventario" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reporte de Inventario</CardTitle>
                  <CardDescription>
                    Estado y movimientos de inventario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Items en Inventario
                          </CardTitle>
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {reporteInventario.totalItems}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Total de items
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Stock Bajo
                          </CardTitle>
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {reporteInventario.itemsStockBajo}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Items con stock mínimo
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Valor Total
                          </CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            ${reporteInventario.valorTotal.toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Valor del inventario
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="productos" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Reporte de Productos</CardTitle>
                      <CardDescription>
                        Análisis de productos y categorías
                      </CardDescription>
                    </div>
                    <Button onClick={exportarProductosExcel} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {reporteProductos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay productos vendidos en el período seleccionado
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-right">Cantidad Vendida</TableHead>
                          <TableHead className="text-right">Ingresos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reporteProductos.map((producto, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{producto.nombre}</TableCell>
                            <TableCell className="capitalize">{producto.categoria.toLowerCase()}</TableCell>
                            <TableCell className="text-right">{producto.cantidadVendida}</TableCell>
                            <TableCell className="text-right font-semibold">
                              ${producto.ingresos.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
